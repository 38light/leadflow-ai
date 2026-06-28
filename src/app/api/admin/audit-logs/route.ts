import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";

// Strip Postgres LIKE wildcards so user-supplied wildcards don't broaden the query.
const stripLikeWildcards = (s: string) => s.replace(/[%_]/g, "");

const shortString = z
  .string()
  .trim()
  .max(100)
  .optional()
  .transform((v) => v ?? "");

const auditLogQuerySchema = z.object({
  actor_id: shortString,
  action: shortString,
  target_type: shortString,
  date_from: shortString,
  date_to: shortString,
  search: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => (v ? stripLikeWildcards(v) : "")),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
  offset: z.coerce.number().int().min(0).optional().default(0),
});

// GET /api/admin/audit-logs — paginated audit log listing (super admin only)
// Query params: ?actor_id=, ?action=, ?target_type=, ?date_from=, ?date_to=, ?search=, ?page=, ?limit=20
export async function GET(req: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = auditLogQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query parameters" }, { status: 400 });
  }

  const {
    actor_id: actorId,
    action,
    target_type: targetType,
    date_from: dateFrom,
    date_to: dateTo,
    search,
    page,
    limit,
  } = parsed.data;
  const offset = (page - 1) * limit;

  // Use service role client — no RLS on audit_logs for regular users
  const adminClient = createAdminClient();

  let query = adminClient
    .from("audit_logs")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (actorId) {
    query = query.eq("actor_id", actorId);
  }

  if (action) {
    // Support prefix match: e.g. "user" matches "user.suspend", "user.plan_change"
    query = query.like("action", `${action}%`);
  }

  if (targetType) {
    query = query.eq("target_type", targetType);
  }

  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }

  if (dateTo) {
    // Include the full day by going to end of day
    const endOfDay = dateTo.includes("T") ? dateTo : `${dateTo}T23:59:59.999Z`;
    query = query.lte("created_at", endOfDay);
  }

  if (search) {
    // Search across action, target_label, and actor_email
    query = query.or(
      `action.ilike.%${search}%,target_label.ilike.%${search}%,actor_email.ilike.%${search}%`
    );
  }

  const { data: logs, error, count } = await query;

  if (error) {
    console.error("[audit-logs] query error:", error.message);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }

  return NextResponse.json({
    data: logs ?? [],
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}
