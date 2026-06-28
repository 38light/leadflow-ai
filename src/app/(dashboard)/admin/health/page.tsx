"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Database,
  Shield,
  CreditCard,
  Mail,
  Brain,
  Layers,
  RefreshCw,
  CheckCircle2,
  XCircle,
  MinusCircle,
  AlertTriangle,
  Clock,
  AlertCircle,
} from "lucide-react";
import type { HealthCheckResult } from "@/app/api/admin/health/route";
import type { HealthError } from "@/app/api/admin/health/errors/route";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ServiceStatusValue = "ok" | "error" | "unconfigured" | "warning";

interface ServiceCardData {
  key: keyof Pick<
    HealthCheckResult,
    "database" | "supabase_auth" | "stripe" | "resend" | "anthropic"
  >;
  label: string;
  Icon: React.ElementType;
  iconColor: string;
  iconBg: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatusBadge({ status }: { status: ServiceStatusValue }) {
  const map: Record<
    ServiceStatusValue,
    { label: string; className: string; Icon: React.ElementType }
  > = {
    ok: {
      label: "Operational",
      className: "bg-green-100 text-green-700",
      Icon: CheckCircle2,
    },
    error: {
      label: "Error",
      className: "bg-red-100 text-red-700",
      Icon: XCircle,
    },
    unconfigured: {
      label: "Not Configured",
      className: "bg-gray-100 text-gray-500",
      Icon: MinusCircle,
    },
    warning: {
      label: "Warning",
      className: "bg-yellow-100 text-yellow-700",
      Icon: AlertTriangle,
    },
  };

  const { label, className, Icon } = map[status] ?? map.error;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${className}`}
    >
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function latencyColor(ms: number): string {
  if (ms < 100) return "text-green-600";
  if (ms <= 500) return "text-yellow-600";
  return "text-red-600";
}

function errorsColor(n: number): string {
  if (n === 0) return "text-green-600";
  if (n <= 5) return "text-yellow-600";
  return "text-red-600";
}

function formatTs(iso: string): string {
  return new Date(iso).toLocaleString();
}

function truncate(str: string, max = 80): string {
  return str.length > max ? str.slice(0, max) + "…" : str;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ENV_VARS: { label: string; key: string }[] = [
  { label: "NEXT_PUBLIC_SUPABASE_URL", key: "NEXT_PUBLIC_SUPABASE_URL" },
  { label: "SUPABASE_SERVICE_ROLE_KEY", key: "SUPABASE_SERVICE_ROLE_KEY" },
  { label: "STRIPE_SECRET_KEY", key: "STRIPE_SECRET_KEY" },
  { label: "STRIPE_WEBHOOK_SECRET", key: "STRIPE_WEBHOOK_SECRET" },
  { label: "RESEND_API_KEY", key: "RESEND_API_KEY" },
  { label: "ANTHROPIC_API_KEY", key: "ANTHROPIC_API_KEY" },
];

const SERVICE_CARDS: ServiceCardData[] = [
  {
    key: "database",
    label: "Database",
    Icon: Database,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
  },
  {
    key: "supabase_auth",
    label: "Supabase Auth",
    Icon: Shield,
    iconColor: "text-indigo-600",
    iconBg: "bg-indigo-100",
  },
  {
    key: "stripe",
    label: "Stripe",
    Icon: CreditCard,
    iconColor: "text-purple-600",
    iconBg: "bg-purple-100",
  },
  {
    key: "resend",
    label: "Resend Email",
    Icon: Mail,
    iconColor: "text-orange-600",
    iconBg: "bg-orange-100",
  },
  {
    key: "anthropic",
    label: "Anthropic (Claude)",
    Icon: Brain,
    iconColor: "text-teal-600",
    iconBg: "bg-teal-100",
  },
];

// ---------------------------------------------------------------------------
// Skeleton components
// ---------------------------------------------------------------------------

function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-gray-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-24 rounded bg-gray-200" />
          <div className="h-3 w-16 rounded bg-gray-100" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Environment variables section
// ---------------------------------------------------------------------------

interface EnvCheckSectionProps {
  health: HealthCheckResult;
}

function EnvCheckSection({ health }: EnvCheckSectionProps) {
  // We derive which vars are configured from the health payload (server-side
  // knowledge). We never expose the actual values.
  const configured: Record<string, boolean> = {
    NEXT_PUBLIC_SUPABASE_URL: health.database.status !== "error" || health.database.latency_ms > 0,
    SUPABASE_SERVICE_ROLE_KEY:
      health.database.status === "ok" || health.supabase_auth.status === "ok",
    STRIPE_SECRET_KEY: health.stripe.status !== "unconfigured",
    STRIPE_WEBHOOK_SECRET: health.stripe.status !== "unconfigured",
    RESEND_API_KEY: health.resend.status !== "unconfigured",
    ANTHROPIC_API_KEY: health.anthropic.status !== "unconfigured",
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-6 py-4">
        <h2 className="text-base font-semibold text-gray-900">Environment Variables</h2>
        <p className="text-xs text-gray-400">Shows presence only — actual values are never exposed</p>
      </div>
      <div className="divide-y divide-gray-100">
        {ENV_VARS.map(({ label, key }) => {
          const present = configured[key] ?? false;
          return (
            <div key={key} className="flex items-center justify-between px-6 py-3">
              <span className="font-mono text-sm text-gray-700">{label}</span>
              {present ? (
                <span className="flex items-center gap-1 text-sm font-medium text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Configured
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm font-medium text-red-500">
                  <XCircle className="h-4 w-4" />
                  Missing
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function SystemHealthPage() {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [errors, setErrors] = useState<HealthError[] | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const [errorsLoading, setErrorsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetch("/api/admin/health");
      if (res.ok) {
        const { data } = await res.json();
        setHealth(data as HealthCheckResult);
      }
    } finally {
      setHealthLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  const fetchErrors = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/health/errors");
      if (res.ok) {
        const { errors: errs } = await res.json();
        setErrors(errs as HealthError[]);
      }
    } finally {
      setErrorsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchHealth();
    fetchErrors();
  }, [fetchHealth, fetchErrors]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchHealth();
      fetchErrors();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchHealth, fetchErrors]);

  const handleRefresh = () => {
    fetchHealth(true);
    setErrorsLoading(true);
    fetchErrors();
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Page header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">System Health</h1>
            {health ? (
              <p className="flex items-center gap-1 text-xs text-gray-400">
                <Clock className="h-3 w-3" />
                Last checked: {formatTs(health.last_checked)}
              </p>
            ) : (
              <p className="text-xs text-gray-400">Checking…</p>
            )}
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Integration Status Grid */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          Integration Status
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {healthLoading
            ? Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
            : SERVICE_CARDS.map(({ key, label, Icon, iconColor, iconBg }) => {
                const svc = health?.[key];
                const status = (svc?.status ?? "error") as ServiceStatusValue;
                const message = (svc as { message?: string })?.message;

                return (
                  <div
                    key={key}
                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
                        >
                          <Icon className={`h-5 w-5 ${iconColor}`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{label}</p>
                          <StatusBadge status={status} />
                        </div>
                      </div>
                    </div>
                    {message && status !== "ok" && (
                      <p className="mt-3 rounded-md bg-red-50 px-3 py-2 text-xs text-red-600">
                        {message}
                      </p>
                    )}
                  </div>
                );
              })}
        </div>
      </div>

      {/* System Metrics Row */}
      <div className="mb-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
          System Metrics
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {/* DB Latency */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              DB Latency
            </p>
            {healthLoading ? (
              <div className="mt-2 h-8 w-20 animate-pulse rounded bg-gray-200" />
            ) : (
              <p
                className={`mt-1 text-3xl font-bold ${latencyColor(
                  health?.database?.latency_ms ?? 0
                )}`}
              >
                {health?.database?.latency_ms ?? "—"}
                <span className="ml-1 text-base font-normal text-gray-400">ms</span>
              </p>
            )}
          </div>

          {/* Errors Today */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Errors Today
            </p>
            {healthLoading ? (
              <div className="mt-2 h-8 w-20 animate-pulse rounded bg-gray-200" />
            ) : (
              <p
                className={`mt-1 text-3xl font-bold ${errorsColor(
                  health?.errors_today ?? 0
                )}`}
              >
                {health?.errors_today ?? 0}
              </p>
            )}
          </div>

          {/* Queue Status */}
          <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Queue Status
            </p>
            {healthLoading ? (
              <div className="mt-2 h-8 w-20 animate-pulse rounded bg-gray-200" />
            ) : (
              <div className="mt-1">
                <p className="text-3xl font-bold text-gray-900">
                  {health?.queue?.pending_jobs ?? 0}
                  <span className="ml-1 text-base font-normal text-gray-400">
                    pending
                  </span>
                </p>
                <StatusBadge
                  status={(health?.queue?.status ?? "ok") as ServiceStatusValue}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Errors Panel */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-base font-semibold text-gray-900">Recent Errors</h2>
          <p className="text-xs text-gray-400">From audit logs and webhook logs</p>
        </div>

        {errorsLoading ? (
          <div className="space-y-3 p-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : !errors || errors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <CheckCircle2 className="mb-2 h-8 w-8 text-green-400" />
            <p className="text-sm font-medium">No recent errors</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Timestamp
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {errors.map((err, i) => (
                  <tr key={i} className="hover:bg-gray-50/50">
                    <td className="px-6 py-3">
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        <AlertCircle className="h-3 w-3" />
                        {err.source}
                      </span>
                    </td>
                    <td className="max-w-xs px-6 py-3 text-sm text-gray-700">
                      {truncate(err.message)}
                    </td>
                    <td className="whitespace-nowrap px-6 py-3 text-xs text-gray-400">
                      {formatTs(err.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Environment Check */}
      {health && <EnvCheckSection health={health} />}
    </div>
  );
}
