import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";

interface ServiceStatus {
  status: "ok" | "error" | "unconfigured" | "warning";
  message?: string;
}

interface DatabaseStatus extends ServiceStatus {
  status: "ok" | "error";
  latency_ms: number;
}

interface QueueStatus extends ServiceStatus {
  status: "ok" | "warning";
  pending_jobs: number;
}

export interface HealthCheckResult {
  database: DatabaseStatus;
  supabase_auth: ServiceStatus;
  stripe: ServiceStatus;
  resend: ServiceStatus;
  anthropic: ServiceStatus;
  queue: QueueStatus;
  errors_today: number;
  last_checked: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function checkDatabase(): Promise<DatabaseStatus> {
  try {
    const admin = createAdminClient();
    const start = Date.now();
    const result = await withTimeout(
      admin.from("profiles").select("user_id").limit(1) as unknown as Promise<{ error: { message: string } | null }>,
      5000
    );
    const latency_ms = Date.now() - start;

    if (result.error) {
      return { status: "error", latency_ms, message: result.error.message };
    }
    return { status: "ok", latency_ms };
  } catch (err) {
    return {
      status: "error",
      latency_ms: 0,
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function checkSupabaseAuth(): Promise<ServiceStatus> {
  try {
    const admin = createAdminClient();
    const { error } = await withTimeout(
      admin.auth.admin.listUsers({ page: 1, perPage: 1 }),
      5000
    );
    if (error) {
      return { status: "error", message: error.message };
    }
    return { status: "ok" };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function checkStripe(): Promise<ServiceStatus> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return { status: "unconfigured", message: "STRIPE_SECRET_KEY not set" };
  }
  try {
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
    await withTimeout(stripe.products.list({ limit: 1 }), 5000);
    return { status: "ok" };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function checkResend(): Promise<ServiceStatus> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { status: "unconfigured", message: "RESEND_API_KEY not set" };
  }
  return { status: "ok", message: "API key configured" };
}

async function checkAnthropic(): Promise<ServiceStatus> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return { status: "unconfigured", message: "ANTHROPIC_API_KEY not set" };
  }
  return { status: "ok", message: "API key configured" };
}

async function checkQueue(): Promise<QueueStatus> {
  // No queue system is implemented yet — return healthy with 0 pending
  return { status: "ok", pending_jobs: 0, message: "No queue system configured" };
}

async function countErrorsToday(): Promise<number> {
  try {
    const admin = createAdminClient();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const result = await withTimeout(
      admin
        .from("audit_logs")
        .select("*", { count: "exact", head: true })
        .like("action", "error.%")
        .gte("created_at", todayStart.toISOString()) as unknown as Promise<{ count: number | null; error: { message: string } | null }>,
      5000
    );

    if (result.error) return 0;
    return result.count ?? 0;
  } catch {
    return 0;
  }
}

// GET /api/admin/health — system health check (super admin only)
export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [database, supabase_auth, stripe, resend, anthropic, queue, errors_today] =
    await Promise.all([
      checkDatabase(),
      checkSupabaseAuth(),
      checkStripe(),
      checkResend(),
      checkAnthropic(),
      checkQueue(),
      countErrorsToday(),
    ]);

  const result: HealthCheckResult = {
    database,
    supabase_auth,
    stripe,
    resend,
    anthropic,
    queue,
    errors_today,
    last_checked: new Date().toISOString(),
  };

  return NextResponse.json({ data: result });
}
