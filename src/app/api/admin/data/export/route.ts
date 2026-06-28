import { NextRequest, NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createAdminClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

// Third-party credentials stored on profiles — never include these in a GDPR export.
const SECRET_PROFILE_COLUMNS = [
  "anthropic_api_key",
  "stripe_secret_key",
  "sendgrid_api_key",
  "twilio_account_sid",
  "twilio_auth_token",
  "meta_access_token",
  "vapi_api_key",
  "hubspot_access_token",
  "hubspot_refresh_token",
  "slack_webhook_url",
  "google_calendar_token",
  "outlook_calendar_token",
];

function stripProfileSecrets(profile: Record<string, unknown> | null): Record<string, unknown> | null {
  if (!profile) return null;
  const cleaned: Record<string, unknown> = { ...profile };
  for (const key of SECRET_PROFILE_COLUMNS) {
    if (key in cleaned) delete cleaned[key];
  }
  return cleaned;
}

// GET /api/admin/data/export?user_id=xxx
// Exports ALL data for a given user as a JSON download (GDPR compliance)
export async function GET(req: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("user_id")?.trim();

  if (!userId) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Fetch auth user info
  const { data: authUserData, error: authError } = await adminClient.auth.admin.getUserById(userId);
  if (authError || !authUserData?.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const authUser = authUserData.user;

  // Fetch all user data in parallel
  const [
    profileRes,
    contactsRes,
    conversationsRes,
    messagesRes,
    bookingsRes,
    knowledgeBasesRes,
    knowledgeDocsRes,
    notificationsRes,
  ] = await Promise.all([
    adminClient.from("profiles").select("*").eq("user_id", userId).single(),
    adminClient.from("contacts").select("*").eq("user_id", userId),
    adminClient.from("conversations").select("*").eq("user_id", userId),
    adminClient.from("messages").select("*").eq("user_id", userId),
    adminClient.from("bookings").select("*").eq("user_id", userId),
    adminClient.from("knowledge_bases").select("*").eq("user_id", userId),
    adminClient.from("knowledge_documents").select("*").eq("user_id", userId),
    adminClient.from("notifications").select("*").eq("user_id", userId),
  ]);

  const exportData = {
    exported_at: new Date().toISOString(),
    user: {
      id: authUser.id,
      email: authUser.email ?? null,
      created_at: authUser.created_at,
      last_sign_in_at: authUser.last_sign_in_at ?? null,
      profile: stripProfileSecrets(profileRes.data ?? null),
    },
    contacts: contactsRes.data ?? [],
    conversations: conversationsRes.data ?? [],
    messages: messagesRes.data ?? [],
    bookings: bookingsRes.data ?? [],
    knowledge: {
      bases: knowledgeBasesRes.data ?? [],
      documents: knowledgeDocsRes.data ?? [],
    },
    notifications: notificationsRes.data ?? [],
  };

  // Log audit event
  await logAuditEvent({
    actorId: ctx.user.id,
    actorEmail: ctx.user.email ?? undefined,
    action: "data.gdpr_export",
    targetType: "user",
    targetId: userId,
    targetLabel: authUser.email ?? userId,
    metadata: {
      contacts_count: exportData.contacts.length,
      conversations_count: exportData.conversations.length,
      messages_count: exportData.messages.length,
      bookings_count: exportData.bookings.length,
    },
  });

  const dateStr = new Date().toISOString().slice(0, 10);
  const filename = `user-export-${userId}-${dateStr}.json`;

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
