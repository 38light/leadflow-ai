import { createClient } from "@supabase/supabase-js";

export interface AuditEvent {
  actorId?: string;
  actorEmail?: string;
  action: string; // e.g. 'user.suspend', 'user.plan_change', 'impersonate.start'
  targetType?: string;
  targetId?: string;
  targetLabel?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

/**
 * Log an audit event using the service role client (bypasses RLS).
 * This function never throws — logging failures are swallowed silently
 * so they never interrupt the main action being audited.
 */
export async function logAuditEvent(event: AuditEvent): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      // Can't log without credentials — fail silently
      return;
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    await adminClient.from("audit_logs").insert({
      actor_id: event.actorId ?? null,
      actor_email: event.actorEmail ?? null,
      action: event.action,
      target_type: event.targetType ?? null,
      target_id: event.targetId ?? null,
      target_label: event.targetLabel ?? null,
      metadata: event.metadata ?? {},
      ip_address: event.ipAddress ?? null,
      user_agent: event.userAgent ?? null,
    });
  } catch {
    // Silently swallow — audit logging must never break the main action
  }
}
