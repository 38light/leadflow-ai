import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";

// GET /api/admin/accounts — list all business-owner accounts (super admin only)
// Query params: ?search=, ?plan=, ?page=, ?limit=20
export async function GET(req: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim() ?? "";
  const plan = searchParams.get("plan")?.trim() ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10)));
  const offset = (page - 1) * limit;

  const admin = createAdminClient();

  // Build profiles query — only role='user' (business owners)
  let query = admin
    .from("profiles")
    .select(
      "id, user_id, business_name, business_type, subscription_tier, is_active, created_at",
      { count: "exact" }
    )
    .eq("role", "user")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (plan) {
    query = query.eq("subscription_tier", plan);
  }

  const { data: profiles, error, count } = await query;

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({
      data: [],
      pagination: { page, limit, total: count ?? 0, totalPages: 0 },
    });
  }

  // Fetch auth users (for email + last_sign_in_at) via admin API
  const { data: authUsers } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const authMap = new Map<string, { email: string; last_sign_in_at: string | null }>(
    (authUsers?.users ?? []).map((u) => [
      u.id,
      { email: u.email ?? "", last_sign_in_at: u.last_sign_in_at ?? null },
    ])
  );

  // Apply email/business_name search filter after we have emails
  let filtered = profiles;
  if (search) {
    const lc = search.toLowerCase();
    filtered = profiles.filter((p) => {
      const email = authMap.get(p.user_id)?.email ?? "";
      const biz = (p.business_name ?? "").toLowerCase();
      return biz.includes(lc) || email.toLowerCase().includes(lc);
    });
  }

  if (filtered.length === 0) {
    return NextResponse.json({
      data: [],
      pagination: { page, limit, total: 0, totalPages: 0 },
    });
  }

  const filteredUserIds = filtered.map((p) => p.user_id);

  // Parallel counts: member_count, contact_count, booking_count
  const [membersRes, contactsRes, bookingsRes] = await Promise.all([
    admin
      .from("team_members")
      .select("owner_id")
      .in("owner_id", filteredUserIds),
    admin
      .from("contacts")
      .select("user_id")
      .in("user_id", filteredUserIds),
    admin
      .from("bookings")
      .select("user_id")
      .in("user_id", filteredUserIds),
  ]);

  // Build count maps
  const memberCountMap = new Map<string, number>();
  const contactCountMap = new Map<string, number>();
  const bookingCountMap = new Map<string, number>();

  for (const row of membersRes.data ?? []) {
    memberCountMap.set(row.owner_id, (memberCountMap.get(row.owner_id) ?? 0) + 1);
  }
  for (const row of contactsRes.data ?? []) {
    contactCountMap.set(row.user_id, (contactCountMap.get(row.user_id) ?? 0) + 1);
  }
  for (const row of bookingsRes.data ?? []) {
    bookingCountMap.set(row.user_id, (bookingCountMap.get(row.user_id) ?? 0) + 1);
  }

  const data = filtered.map((p) => {
    const auth = authMap.get(p.user_id);
    return {
      id: p.user_id,
      profile_id: p.id,
      email: auth?.email ?? "",
      business_name: p.business_name,
      business_type: p.business_type,
      subscription_tier: p.subscription_tier,
      is_active: p.is_active,
      created_at: p.created_at,
      last_sign_in_at: auth?.last_sign_in_at ?? null,
      member_count: memberCountMap.get(p.user_id) ?? 0,
      contact_count: contactCountMap.get(p.user_id) ?? 0,
      booking_count: bookingCountMap.get(p.user_id) ?? 0,
    };
  });

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: search ? data.length : (count ?? 0),
      totalPages: search
        ? Math.ceil(data.length / limit)
        : Math.ceil((count ?? 0) / limit),
    },
  });
}
