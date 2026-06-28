import { NextRequest, NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createAdminClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

const ANNOUNCEMENT_TYPES = ["info", "warning", "maintenance"] as const;
type AnnouncementType = (typeof ANNOUNCEMENT_TYPES)[number];

// POST /api/admin/communications/announcement
// Body: { title: string, body: string, type: 'info' | 'warning' | 'maintenance' }
export async function POST(req: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { title, body: announcementBody, type } = body as {
    title?: string;
    body?: string;
    type?: string;
  };

  if (!title || typeof title !== "string" || title.trim().length === 0) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!announcementBody || typeof announcementBody !== "string" || announcementBody.trim().length === 0) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }
  if (!type || !ANNOUNCEMENT_TYPES.includes(type as AnnouncementType)) {
    return NextResponse.json(
      { error: "type must be one of: info, warning, maintenance" },
      { status: 400 }
    );
  }
  if (title.length > 200) {
    return NextResponse.json({ error: "title must be 200 characters or fewer" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Fetch all user IDs from profiles
  const { data: profiles, error: profilesError } = await adminClient
    .from("profiles")
    .select("user_id");

  if (profilesError) {
    console.error("[admin/communications/announcement] profiles query error:", profilesError);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }

  const allUserIds = (profiles ?? []).map((p) => p.user_id as string);

  if (allUserIds.length === 0) {
    return NextResponse.json({ success: true, sent_to: 0 });
  }

  // Map announcement type to notification type: all map to 'system'
  const notificationType = "system";

  const notifications = allUserIds.map((userId) => ({
    user_id: userId,
    type: notificationType,
    title: title.trim(),
    body: announcementBody.trim(),
    link: null as string | null,
    read: false,
  }));

  // Insert in batches of 500 to avoid payload limits
  const BATCH_SIZE = 500;
  let insertedCount = 0;

  for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
    const batch = notifications.slice(i, i + BATCH_SIZE);
    const { error: insertError } = await adminClient.from("notifications").insert(batch);

    if (insertError) {
      console.error("[admin/communications/announcement] insert error:", insertError);
      return NextResponse.json(
        { error: "Failed to send announcement", sent_to: insertedCount },
        { status: 500 }
      );
    }

    insertedCount += batch.length;
  }

  await logAuditEvent({
    actorId: ctx.user.id,
    actorEmail: ctx.user.email,
    action: "communication.announcement_sent",
    metadata: {
      title: title.trim(),
      type,
      user_count: insertedCount,
    },
  });

  return NextResponse.json({ success: true, sent_to: insertedCount });
}
