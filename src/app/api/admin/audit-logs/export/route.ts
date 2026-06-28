import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";

// GET /api/admin/audit-logs/export — download all audit logs as CSV (super admin only)
export async function GET(req: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const actorId = searchParams.get("actor_id")?.trim() ?? "";
  const action = searchParams.get("action")?.trim() ?? "";
  const targetType = searchParams.get("target_type")?.trim() ?? "";
  const dateFrom = searchParams.get("date_from")?.trim() ?? "";
  const dateTo = searchParams.get("date_to")?.trim() ?? "";
  const search = searchParams.get("search")?.trim() ?? "";

  const adminClient = createAdminClient();

  let query = adminClient
    .from("audit_logs")
    .select("created_at, actor_email, action, target_type, target_label, metadata, target_id, ip_address")
    .order("created_at", { ascending: false })
    .limit(10000); // Safety cap for CSV exports

  if (actorId) {
    query = query.eq("actor_id", actorId);
  }

  if (action) {
    query = query.like("action", `${action}%`);
  }

  if (targetType) {
    query = query.eq("target_type", targetType);
  }

  if (dateFrom) {
    query = query.gte("created_at", dateFrom);
  }

  if (dateTo) {
    const endOfDay = dateTo.includes("T") ? dateTo : `${dateTo}T23:59:59.999Z`;
    query = query.lte("created_at", endOfDay);
  }

  if (search) {
    query = query.or(
      `action.ilike.%${search}%,target_label.ilike.%${search}%,actor_email.ilike.%${search}%`
    );
  }

  const { data: logs, error } = await query;

  if (error) {
    console.error("[audit-logs/export] query error:", error.message);
    return NextResponse.json({ error: "Failed to export audit logs" }, { status: 500 });
  }

  const rows = logs ?? [];

  // Build CSV
  const csvEscape = (value: unknown): string => {
    if (value === null || value === undefined) return "";
    const str =
      typeof value === "object" ? JSON.stringify(value) : String(value);
    // Wrap in quotes if it contains comma, quote, or newline
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = ["timestamp", "actor_email", "action", "target_type", "target_label", "metadata"];

  const csvLines: string[] = [
    headers.join(","),
    ...rows.map((row) =>
      [
        csvEscape(row.created_at),
        csvEscape(row.actor_email),
        csvEscape(row.action),
        csvEscape(row.target_type),
        csvEscape(row.target_label),
        csvEscape(row.metadata),
      ].join(",")
    ),
  ];

  const csvContent = csvLines.join("\n");
  const filename = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
