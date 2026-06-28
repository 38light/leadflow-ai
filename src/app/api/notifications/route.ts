import { NextRequest, NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createServerClient } from "@/lib/supabase/server";
import type { Notification } from "@/types";

/**
 * GET /api/notifications
 * Returns notifications for the current user, newest first.
 * Query params:
 *   limit       - number of notifications to return (default 20)
 *   unread_only - "true" to return only unread notifications
 */
export async function GET(req: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 100);
  const unreadOnly = searchParams.get("unread_only") === "true";

  const supabase = await createServerClient();

  let query = supabase
    .from("notifications" as never)
    .select("*")
    .eq("user_id", ctx.user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq("read", false);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/notifications]", error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }

  return NextResponse.json({ data: (data ?? []) as Notification[] });
}

/**
 * PUT /api/notifications
 * Mark one or all notifications as read.
 * Body: { id: string } — mark a single notification read
 *       { all: true }  — mark all notifications read
 */
export async function PUT(req: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const supabase = await createServerClient();

  const payload = body as Record<string, unknown>;

  if (payload.all === true) {
    // Mark all notifications read for the current user
    const { error } = await supabase
      .from("notifications" as never)
      .update({ read: true } as never)
      .eq("user_id", ctx.user.id)
      .eq("read", false);

    if (error) {
      console.error("[PUT /api/notifications] mark all read:", error);
      return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
    }
  } else if (typeof payload.id === "string" && payload.id.length > 0) {
    // Mark a single notification read — must belong to this user
    const { error } = await supabase
      .from("notifications" as never)
      .update({ read: true } as never)
      .eq("id", payload.id)
      .eq("user_id", ctx.user.id);

    if (error) {
      console.error("[PUT /api/notifications] mark read:", error);
      return NextResponse.json({ error: "Failed to update notification" }, { status: 500 });
    }
  } else {
    return NextResponse.json(
      { error: "Provide { id: string } or { all: true }" },
      { status: 400 }
    );
  }

  return NextResponse.json({ success: true });
}
