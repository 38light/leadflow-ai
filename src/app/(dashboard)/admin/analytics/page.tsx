"use client";

import { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Users,
  TrendingUp,
  DollarSign,
  Activity,
  UserMinus,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Period = "7d" | "30d" | "90d";

interface AnalyticsData {
  signups: {
    today: number;
    this_week: number;
    this_month: number;
    by_day: { date: string; count: number }[];
  };
  active_users: { dau: number; wau: number; mau: number };
  plans: {
    free: number;
    starter: number;
    professional: number;
    enterprise: number;
  };
  churn: { cancelled_this_month: number; churn_rate_pct: number };
  mrr: {
    total_cents: number;
    by_plan: { plan: string; users: number; mrr_cents: number }[];
  };
  arr: { total_cents: number };
  conversion: {
    trial_to_paid_pct: number;
    total_trials: number;
    total_paid: number;
  };
  total_users: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<string, string> = {
  free: "#9ca3af",
  starter: "#3b82f6",
  professional: "#8b5cf6",
  enterprise: "#f59e0b",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

// ─── Skeleton Loading ─────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm"
        >
          <Skeleton className="mb-2 h-4 w-24" />
          <Skeleton className="h-8 w-20" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-5 w-36" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string;
  sub?: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
}

function KpiCard({ label, value, sub, icon: Icon, iconBg, iconColor }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-gray-500">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
          {sub && (
            <p className="mt-0.5 text-xs text-gray-400">{sub}</p>
          )}
        </div>
        <div
          className={cn(
            "ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            iconBg
          )}
        >
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  const [period, setPeriod] = useState<Period>("30d");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (p: Period) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/analytics?period=${p}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? "Failed to load analytics");
      }
      const json = await res.json();
      setData((json as { data: AnalyticsData }).data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(period);
  }, [fetchData, period]);

  const handlePeriod = (p: Period) => {
    setPeriod(p);
  };

  // ── Derived values ──
  const dauMauRatio =
    data && data.active_users.mau > 0
      ? `${Math.round((data.active_users.dau / data.active_users.mau) * 100)}%`
      : "—";

  const mrrFormatted = data ? formatCurrency(data.mrr.total_cents) : "—";
  const arrFormatted = data ? formatCurrency(data.arr.total_cents) : "—";
  const churnFormatted = data ? `${data.churn.churn_rate_pct}%` : "—";

  // ── Pie data for plan distribution ──
  const pieData = data
    ? [
        { name: "Free", value: data.plans.free, key: "free" },
        { name: "Starter", value: data.plans.starter, key: "starter" },
        { name: "Professional", value: data.plans.professional, key: "professional" },
        { name: "Enterprise", value: data.plans.enterprise, key: "enterprise" },
      ].filter((d) => d.value > 0)
    : [];

  // ── Bar data for MRR by plan ──
  const mrrBarData = data
    ? data.mrr.by_plan
        .filter((p) => p.mrr_cents > 0)
        .map((p) => ({
          plan: PLAN_LABELS[p.plan] ?? p.plan,
          mrr: Math.round(p.mrr_cents / 100),
          key: p.plan,
        }))
    : [];

  // ── Signup trend formatted ──
  const signupTrendData = data
    ? data.signups.by_day.map((d) => ({
        date: formatDate(d.date),
        signups: d.count,
      }))
    : [];

  const hasAnyChartData = data && data.total_users > 0;

  return (
    <div className="p-6 lg:p-8">
      {/* Header + Period Selector */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Revenue, growth, and engagement metrics
          </p>
        </div>

        <div className="flex gap-1 rounded-lg border border-gray-200 bg-gray-50 p-1">
          {(["7d", "30d", "90d"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriod(p)}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                period === p
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {p === "7d" ? "7D" : p === "30d" ? "30D" : "90D"}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <div className="mb-8">
          <KpiSkeleton />
        </div>
      ) : data ? (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <KpiCard
            label="Total Users"
            value={data.total_users.toLocaleString()}
            sub={`+${data.signups.this_month} this month`}
            icon={Users}
            iconBg="bg-blue-50"
            iconColor="text-blue-600"
          />
          <KpiCard
            label="New Today / Week"
            value={`${data.signups.today} / ${data.signups.this_week}`}
            sub="signups"
            icon={ArrowUpRight}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <KpiCard
            label="MRR"
            value={mrrFormatted}
            sub="monthly recurring"
            icon={DollarSign}
            iconBg="bg-emerald-50"
            iconColor="text-emerald-600"
          />
          <KpiCard
            label="ARR"
            value={arrFormatted}
            sub="annual recurring"
            icon={TrendingUp}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
          <KpiCard
            label="DAU / MAU"
            value={dauMauRatio}
            sub={`DAU ${data.active_users.dau} · MAU ${data.active_users.mau}`}
            icon={Activity}
            iconBg="bg-orange-50"
            iconColor="text-orange-600"
          />
          <KpiCard
            label="Churn Rate"
            value={churnFormatted}
            sub={`${data.churn.cancelled_this_month} cancelled`}
            icon={UserMinus}
            iconBg="bg-red-50"
            iconColor="text-red-500"
          />
        </div>
      ) : null}

      {/* Charts */}
      {loading ? (
        <ChartSkeleton />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* 1. Signup Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Signup Trend</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasAnyChartData || signupTrendData.every((d) => d.signups === 0) ? (
                <div className="flex h-56 items-center justify-center text-sm text-gray-400">
                  No signup data for this period
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={224}>
                  <AreaChart
                    data={signupTrendData}
                    margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
                  >
                    <defs>
                      <linearGradient id="signupGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "12px",
                      }}
                      cursor={{ stroke: "#e5e7eb" }}
                    />
                    <Area
                      type="monotone"
                      dataKey="signups"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fill="url(#signupGradient)"
                      name="Signups"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 2. Plan Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Plan Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {pieData.length === 0 ? (
                <div className="flex h-56 items-center justify-center text-sm text-gray-400">
                  No users yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={224}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={88}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={PLAN_COLORS[entry.key] ?? "#9ca3af"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "12px",
                      }}
                      formatter={(value: number) => [
                        `${value} users`,
                        "",
                      ]}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: "12px", color: "#374151" }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 3. MRR by Plan */}
          <Card>
            <CardHeader>
              <CardTitle>MRR by Plan</CardTitle>
            </CardHeader>
            <CardContent>
              {mrrBarData.length === 0 ? (
                <div className="flex h-56 items-center justify-center text-sm text-gray-400">
                  No paid plans yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={224}>
                  <BarChart
                    data={mrrBarData}
                    margin={{ top: 4, right: 8, left: -8, bottom: 4 }}
                  >
                    <XAxis
                      dataKey="plan"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v: number) => `$${v.toLocaleString()}`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "12px",
                      }}
                      cursor={{ fill: "#f9fafb" }}
                      formatter={(value: number) => [
                        `$${value.toLocaleString("en-US")}`,
                        "MRR",
                      ]}
                    />
                    <Bar dataKey="mrr" radius={[4, 4, 0, 0]} name="MRR">
                      {mrrBarData.map((entry) => (
                        <Cell
                          key={entry.key}
                          fill={PLAN_COLORS[entry.key] ?? "#9ca3af"}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* 4. Trial → Paid Funnel */}
          <Card>
            <CardHeader>
              <CardTitle>Trial to Paid Conversion</CardTitle>
            </CardHeader>
            <CardContent>
              {!data ? (
                <div className="flex h-56 items-center justify-center text-sm text-gray-400">
                  No data
                </div>
              ) : (
                <div className="flex h-56 flex-col justify-center space-y-6 px-4">
                  {/* Conversion rate big number */}
                  <div className="text-center">
                    <p className="text-5xl font-bold text-gray-900">
                      {data.conversion.trial_to_paid_pct}%
                    </p>
                    <p className="mt-1 text-sm text-gray-500">conversion rate</p>
                  </div>

                  {/* Horizontal funnel bars */}
                  <div className="space-y-3">
                    {/* Free / Trial bar */}
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                        <span>Free / Trial</span>
                        <span className="font-medium text-gray-700">
                          {data.conversion.total_trials.toLocaleString()} users
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-3 rounded-full bg-gray-400 transition-all duration-500"
                          style={{ width: "100%" }}
                        />
                      </div>
                    </div>

                    {/* Paid bar */}
                    <div>
                      <div className="mb-1 flex items-center justify-between text-xs text-gray-500">
                        <span>Paid</span>
                        <span className="font-medium text-gray-700">
                          {data.conversion.total_paid.toLocaleString()} users
                        </span>
                      </div>
                      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className="h-3 rounded-full bg-blue-500 transition-all duration-500"
                          style={{
                            width:
                              data.total_users > 0
                                ? `${Math.round((data.conversion.total_paid / data.total_users) * 100)}%`
                                : "0%",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
