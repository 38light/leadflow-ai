import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { logAuditEvent } from "@/lib/audit";

// GET /api/admin/accounts/[id] — full account detail (id = user_id)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;
  const admin = createAdminClient();

  // Profile
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, user_id, business_name, business_type, subscription_tier, is_active, ai_enabled, timezone, phone, website, created_at, updated_at")
    .eq("user_id", userId)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Auth user (email + last_sign_in_at)
  const { data: authUser, error: authError } = await admin.auth.admin.getUserById(userId);
  if (authError || !authUser?.user) {
    return NextResponse.json({ error: "Auth user not found" }, { status: 404 });
  }

  // Team members — joined with profiles for email
  const { data: teamMembersRaw } = await admin
    .from("team_members")
    .select("id, member_user_id, role, created_at")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true });

  // Get emails for team members
  let teamMembers: { id: string; email: string; role: string; created_at: string }[] = [];
  if (teamMembersRaw && teamMembersRaw.length > 0) {
    const { data: memberAuthUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
    const memberEmailMap = new Map<string, string>(
      (memberAuthUsers?.users ?? []).map((u) => [u.id, u.email ?? ""])
    );
    teamMembers = teamMembersRaw.map((m) => ({
      id: m.id,
      email: memberEmailMap.get(m.member_user_id ?? "") ?? "Unknown",
      role: m.role,
      created_at: m.created_at,
    }));
  }

  // Usage stats
  const [contactsRes, bookingsRes, conversationsRes] = await Promise.all([
    admin.from("contacts").select("id", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", userId),
    admin.from("conversations").select("id", { count: "exact", head: true }).eq("user_id", userId),
  ]);

  const data = {
    id: userId,
    profile_id: profile.id,
    email: authUser.user.email ?? "",
    last_sign_in_at: authUser.user.last_sign_in_at ?? null,
    business_name: profile.business_name,
    business_type: profile.business_type,
    subscription_tier: profile.subscription_tier,
    is_active: profile.is_active,
    ai_enabled: profile.ai_enabled,
    timezone: profile.timezone,
    phone: profile.phone,
    website: profile.website,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    team_members: teamMembers,
    stats: {
      member_count: teamMembers.length,
      contact_count: contactsRes.count ?? 0,
      booking_count: bookingsRes.count ?? 0,
      conversation_count: conversationsRes.count ?? 0,
    },
  };

  return NextResponse.json({ data });
}

// PUT /api/admin/accounts/[id] — seat management / notes
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: userId } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { action, seats, note } = body as { action?: string; seats?: number; note?: string };

  if (!action || !["add_seats", "remove_seats", "add_note"].includes(action)) {
    return NextResponse.json(
      { error: "action must be one of: add_seats, remove_seats, add_note" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  if (action === "add_note" || action === "add_seats" || action === "remove_seats") {
    // Determine note content
    let content: string;
    if (action === "add_note") {
      if (!note || typeof note !== "string" || note.trim().length === 0) {
        return NextResponse.json({ error: "note is required for add_note action" }, { status: 400 });
      }
      content = note.trim();
    } else {
      // seat actions — validate seats
      if (typeof seats !== "number" || seats <= 0 || !Number.isInteger(seats)) {
        return NextResponse.json({ error: "seats must be a positive integer" }, { status: 400 });
      }
      const direction = action === "add_seats" ? "increased" : "decreased";
      content = `Max seats ${direction} by ${seats} (action: ${action})${
        note ? ` — Note: ${note}` : ""
      }`;
    }

    const { data: noteData, error: noteError } = await admin
      .from("admin_notes")
      .insert({
        target_user_id: userId,
        author_id: ctx.user.id,
        author_email: ctx.user.email ?? null,
        content,
      })
      .select()
      .single();

    if (noteError) {
      return NextResponse.json({ error: noteError.message }, { status: 500 });
    }

    await logAuditEvent({
      actorId: ctx.user.id,
      actorEmail: ctx.user.email,
      action: `account.${action}`,
      targetType: "account",
      targetId: userId,
      metadata: { seats: seats ?? null, note: content },
    });

    return NextResponse.json({ data: noteData });
  }

  return NextResponse.json({ error: "Unhandled action" }, { status: 400 });
}
