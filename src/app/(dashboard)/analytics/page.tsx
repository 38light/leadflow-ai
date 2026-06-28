"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Link from "next/link";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { ChannelFlowSankey } from "@/components/analytics/channel-flow-sankey";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ForecastPipelineStage {
  stage: string;
  count: number;
  probability: number;
  value: number;
}

interface ForecastData {
  pipeline: ForecastPipelineStage[];
  totalWeightedValue: number;
  totalPipelineCount: number;
  avgDealValue: number;
  wonThisMonth: number;
  wonValueThisMonth: number;
}

interface AnalyticsData {
  contacts: {
    total: number;
    hot: number;
    warm: number;
    won: number;
    lost: number;
  };
  conversations: {
    total: number;
    active: number;
  };
  messages: {
    total: number;
    ai: number;
  };
  rates: {
    conversion: number;
    handoff: number;
  };
}

interface ConversationItem {
  channel_type: string;
}

// ── Colour palettes ────────────────────────────────────────────────────────────

const FUNNEL_COLORS = ["#3b82f6", "#ef4444", "#f97316", "#10b981", "#6b7280"];
const TEMPERATURE_COLORS: Record<string, string> = {
  Hot: "#ef4444",
  Warm: "#f97316",
  Cold: "#3b82f6",
};
const CHANNEL_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#ec4899",
];

// ── Period selector ────────────────────────────────────────────────────────────

type Period = 7 | 30 | 90;
const PERIODS: { label: string; value: Period }[] = [
  { label: "7 days", value: 7 },
  { label: "30 days", value: 30 },
  { label: "90 days", value: 90 },
];

// ── Helper: build channel breakdown from conversations list ────────────────────

function buildChannelData(conversations: ConversationItem[]) {
  const counts: Record<string, number> = {};
  for (const c of conversations) {
    const ch = c.channel_type ?? "unknown";
    counts[ch] = (counts[ch] ?? 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, value]) => ({ name: name.replace("_", " "), value }))
    .sort((a, b) => b.value - a.value);
}

// ── Skeleton for charts ────────────────────────────────────────────────────────

function ChartSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[1, 2].map((i) => (
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

// ── Empty placeholder inside a chart ──────────────────────────────────────────

function NoData() {
  return (
    <div className="flex h-56 items-center justify-center text-sm text-gray-400">
      No data yet
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<Period>(30);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [channelData, setChannelData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [forecastData, setForecastData] = useState<ForecastData | null>(null);
  const [forecastLoading, setForecastLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [analyticsRes, convsRes] = await Promise.all([
          fetch("/api/analytics"),
          // fetch all conversations (high limit) to compute channel breakdown client-side
          fetch("/api/conversations?limit=500&page=1"),
        ]);

        if (analyticsRes.ok) {
          const json = await analyticsRes.json();
          setAnalytics(json.data as AnalyticsData);
        }

        if (convsRes.ok) {
          const json = await convsRes.json();
          const conversations: ConversationItem[] = json.data ?? [];
          setChannelData(buildChannelData(conversations));
        }
      } catch {
        // silently fail — ui shows empty state
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [period]); // re-fetch when period changes (future: pass period to API)

  useEffect(() => {
    async function loadForecast() {
      setForecastLoading(true);
      try {
        const res = await fetch("/api/analytics/forecast");
        if (res.ok) {
          const json = await res.json();
          setForecastData(json.data as ForecastData);
        }
      } catch {
        // silently fail
      } finally {
        setForecastLoading(false);
      }
    }
    loadForecast();
  }, []);

  // ── Derived chart data ───────────────────────────────────────────────────────

  const funnelData = analytics
    ? [
        { name: "Total", value: analytics.contacts.total },
        { name: "Hot", value: analytics.contacts.hot },
        { name: "Warm", value: analytics.contacts.warm },
        { name: "Won", value: analytics.contacts.won },
        { name: "Lost", value: analytics.contacts.lost },
      ]
    : [];

  const cold = analytics
    ? Math.max(0, analytics.contacts.total - analytics.contacts.hot - analytics.contacts.warm)
    : 0;

  const temperatureData = analytics
    ? [
        { name: "Hot", value: analytics.contacts.hot },
        { name: "Warm", value: analytics.contacts.warm },
        { name: "Cold", value: cold },
      ].filter((d) => d.value > 0)
    : [];

  // Conversion funnel: Total → Hot → Won
  const conversionFunnelData = analytics
    ? [
        { name: "All Contacts", value: analytics.contacts.total },
        { name: "Hot Leads", value: analytics.contacts.hot },
        { name: "Won", value: analytics.contacts.won },
      ]
    : [];

  const hasData = analytics && analytics.contacts.total > 0;

  // ── KPI values ───────────────────────────────────────────────────────────────

  const kpiProps = {
    totalContacts: analytics?.contacts.total ?? 0,
    hotLeads: analytics?.contacts.hot ?? 0,
    activeConversations: analytics?.conversations.active ?? 0,
    wonDeals: analytics?.contacts.won ?? 0,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">
            Overview of your leads, contacts and conversations
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          <Link
            href="/analytics/team"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
          >
            Team Analytics →
          </Link>
          <Link
            href="/analytics/funnel"
            className="text-sm font-medium text-blue-600 hover:text-blue-700 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
          >
            Funnel →
          </Link>

        {/* Period selector */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                period === value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        </div>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
              <Skeleton className="h-4 w-32 mb-3" />
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      ) : (
        <KpiCards {...kpiProps} />
      )}

      {/* ── Rates row ── */}
      {!loading && analytics && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="py-5 flex flex-col gap-1">
              <p className="text-sm text-gray-500">Conversion Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.rates.conversion}%
              </p>
              <p className="text-xs text-gray-400">Won / Total contacts</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5 flex flex-col gap-1">
              <p className="text-sm text-gray-500">AI Handoff Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.rates.handoff}%
              </p>
              <p className="text-xs text-gray-400">Human messages / Total</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-5 flex flex-col gap-1">
              <p className="text-sm text-gray-500">Total Messages</p>
              <p className="text-3xl font-bold text-gray-900">
                {analytics.messages.total.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400">
                {analytics.messages.ai.toLocaleString()} from AI
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Lead funnel + Temperature distribution ── */}
      {loading ? (
        <ChartSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Lead Funnel Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Funnel</CardTitle>
            </CardHeader>
            <CardContent>
              {!hasData ? (
                <NoData />
              ) : (
                <ResponsiveContainer width="100%" height={224}>
                  <BarChart
                    data={funnelData}
                    margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
                  >
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "13px",
                      }}
                      cursor={{ fill: "#f9fafb" }}
                    />
                    <Bar dataKey="value" name="Contacts" radius={[4, 4, 0, 0]}>
                      {funnelData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Temperature Distribution Donut */}
          <Card>
            <CardHeader>
              <CardTitle>Lead Temperature</CardTitle>
            </CardHeader>
            <CardContent>
              {temperatureData.length === 0 ? (
                <NoData />
              ) : (
                <ResponsiveContainer width="100%" height={224}>
                  <PieChart>
                    <Pie
                      data={temperatureData}
                      cx="50%"
                      cy="50%"
                      innerRadius={56}
                      outerRadius={88}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {temperatureData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={TEMPERATURE_COLORS[entry.name] ?? "#9ca3af"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e5e7eb",
                        fontSize: "13px",
                      }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value) => (
                        <span style={{ fontSize: "13px", color: "#374151" }}>
                          {value}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── Channel Breakdown ── */}
      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-56 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Conversations by Channel</CardTitle>
          </CardHeader>
          <CardContent>
            {channelData.length === 0 ? (
              <NoData />
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <BarChart
                  data={channelData}
                  margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
                >
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid #e5e7eb",
                      fontSize: "13px",
                    }}
                    cursor={{ fill: "#f9fafb" }}
                  />
                  <Bar dataKey="value" name="Conversations" radius={[4, 4, 0, 0]}>
                    {channelData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CHANNEL_COLORS[index % CHANNEL_COLORS.length]}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Channel → Outcome Sankey ── */}
      <ChannelFlowSankey days={period} />

      {/* ── Conversion Funnel (horizontal bar representation) ── */}
      {loading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasData ? (
              <NoData />
            ) : (
              <div className="space-y-4">
                {conversionFunnelData.map((step, index) => {
                  const max = conversionFunnelData[0]?.value ?? 1;
                  const pct = max > 0 ? (step.value / max) * 100 : 0;
                  const funnelBg = [
                    "bg-blue-500",
                    "bg-orange-500",
                    "bg-green-500",
                  ];
                  return (
                    <div key={step.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-700">
                          {step.name}
                        </span>
                        <span className="text-sm text-gray-500">
                          {step.value.toLocaleString()}
                          {index > 0 && max > 0 && (
                            <span className="text-gray-400 ml-1.5">
                              ({pct.toFixed(0)}%)
                            </span>
                          )}
                        </span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            funnelBg[index] ?? "bg-blue-500"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Revenue Forecast ── */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Revenue Forecast</h2>

        {/* Forecast KPI Cards */}
        {forecastLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                <Skeleton className="h-4 w-40 mb-3" />
                <Skeleton className="h-8 w-28" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Card>
              <CardContent className="py-5 flex flex-col gap-1">
                <p className="text-sm text-gray-500">Total Pipeline Value</p>
                <p className="text-3xl font-bold text-gray-900">
                  ${(forecastData?.totalWeightedValue ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">Weighted by stage probability</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-5 flex flex-col gap-1">
                <p className="text-sm text-gray-500">Won This Month</p>
                <p className="text-3xl font-bold text-green-600">
                  ${(forecastData?.wonValueThisMonth ?? 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-400">
                  {forecastData?.wonThisMonth ?? 0} deal{(forecastData?.wonThisMonth ?? 0) !== 1 ? "s" : ""} closed
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pipeline stage breakdown */}
        {forecastLoading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-48 w-full" />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Pipeline by Stage</CardTitle>
            </CardHeader>
            <CardContent>
              {!forecastData || forecastData.pipeline.length === 0 ? (
                <NoData />
              ) : (
                <div className="space-y-3">
                  {forecastData.pipeline
                    .filter((p) => p.stage !== "lost")
                    .map((stage) => {
                      const maxValue = Math.max(
                        ...forecastData.pipeline
                          .filter((p) => p.stage !== "lost")
                          .map((p) => p.value),
                        1
                      );
                      const pct = maxValue > 0 ? (stage.value / maxValue) * 100 : 0;
                      const stageColors: Record<string, string> = {
                        new: "bg-gray-400",
                        contacted: "bg-blue-400",
                        qualified: "bg-blue-500",
                        proposal: "bg-indigo-500",
                        negotiation: "bg-purple-500",
                        won: "bg-green-500",
                      };
                      return (
                        <div key={stage.stage}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {stage.stage}
                              </span>
                              <span className="text-xs text-gray-400">
                                {stage.count} contact{stage.count !== 1 ? "s" : ""} · {Math.round(stage.probability * 100)}%
                              </span>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">
                              ${stage.value.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all duration-500",
                                stageColors[stage.stage] ?? "bg-blue-500"
                              )}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  <p className="text-xs text-gray-400 pt-2">
                    Avg deal value: ${(forecastData.avgDealValue).toLocaleString()} · {forecastData.totalPipelineCount} total contacts
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
