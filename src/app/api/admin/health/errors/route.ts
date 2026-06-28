import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";

export interface HealthError {
  source: string;
  message: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

// GET /api/admin/health/errors — recent errors from all sources (super admin only)
export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const errors: HealthError[] = [];

  // 1. Audit log entries with action starting with 'error.'
  try {
    const { data: auditErrors } = await admin
      .from("audit_logs")
      .select("action, metadata, created_at, actor_email, target_label")
      .like("action", "error.%")
      .order("created_at", { ascending: false })
      .limit(50);

    for (const row of auditErrors ?? []) {
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      errors.push({
        source: "audit_log",
        message:
          typeof meta.message === "string"
            ? meta.message
            : row.action,
        timestamp: row.created_at,
        metadata: {
          action: row.action,
          actor_email: row.actor_email,
          target_label: row.target_label,
          ...meta,
        },
      });
    }
  } catch {
    // audit_logs table may not exist yet — silently skip
  }

  // 2. Failed webhook_logs entries (if table exists)
  try {
    const { data: webhookErrors } = await admin
      .from("webhook_logs")
      .select("event_type, error_message, created_at, metadata")
      .eq("status", "failed")
      .order("created_at", { ascending: false })
      .limit(20);

    for (const row of webhookErrors ?? []) {
      errors.push({
        source: "webhook_log",
        message: row.error_message ?? "Webhook delivery failed",
        timestamp: row.created_at,
        metadata: {
          event_type: row.event_type,
          ...((row.metadata ?? {}) as Record<string, unknown>),
        },
      });
    }
  } catch {
    // webhook_logs table may not exist — silently skip
  }

  // Sort all errors by timestamp descending
  errors.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return NextResponse.json({ errors: errors.slice(0, 70) });
}
