"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// ── Types ──────────────────────────────────────────────────────────────────────

interface TeamSummary {
  totalConversations: number;
  aiResolved: number;
  humanHandled: number;
  aiResolutionRate: number;
  avgResponseTimeMs: number;
  totalMessages: number;
}

interface ChannelStat {
  channel: string;
  count: number;
  aiRate: number;
}

interface DailyVolume {
  date: string;
  conversations: number;
  messages: number;
}

interface TeamAnalyticsData {
  summary: TeamSummary;
  byChannel: ChannelStat[];
  dailyVolume: DailyVolume[];
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatMs(ms: number): string {
  if (ms === 0) return "—";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function channelLabel(channel: string): string {
  const labels: Record<string, string> = {
    whatsapp: "WhatsApp",
    sms: "SMS",
    email: "Email",
    web_chat: "Web Chat",
    instagram: "Instagram",
    facebook: "Facebook",
    voice: "Voice",
    unknown: "Unknown",
  };
  return labels[channel] ?? channel.replace("_", " ");
}

function aiRateStatus(rate: number): string {
  if (rate >= 75) return "Excellent";
  if (rate >= 50) return "Good";
  if (rate >= 25) return "Fair";
  return "Low";
}

function aiRateColor(rate: number): string {
  if (rate >= 75) return "text-green-600";
  if (rate >= 50) return "text-blue-600";
  if (rate >= 25) return "text-yellow-600";
  return "text-red-600";
}

const BAR_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];

// ── Skeletons ──────────────────────────────────────────────────────────────────

function KpiSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-24 mt-2" />
        </div>
      ))}
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-56 w-full" />
      </CardContent>
    </Card>
  );
}

function TableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-44" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
}

function KpiCard({ label, value, sub }: KpiCardProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function TeamPerformancePage() {
  const [data, setData] = useState<TeamAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/analytics/team");
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setError((json as { error?: string }).error ?? "Failed to load data");
          return;
        }
        const json = await res.json();
        setData(json.data as TeamAnalyticsData);
      } catch {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Last 14 days for chart
  const chartData = data?.dailyVolume.slice(-14).map((d) => ({
    ...d,
    label: formatDate(d.date),
  })) ?? [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Performance</h1>
        <p className="text-sm text-gray-500 mt-1">
          AI and human agent activity over the last 30 days
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* KPI Cards */}
      {loading ? (
        <KpiSkeleton />
      ) : data ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Conversations"
            value={data.summary.totalConversations.toLocaleString()}
            sub="Last 30 days"
          />
          <KpiCard
            label="AI Resolution Rate"
            value={`${data.summary.aiResolutionRate}%`}
            sub={`${data.summary.aiResolved} resolved by AI`}
          />
          <KpiCard
            label="Avg AI Response"
            value={formatMs(data.summary.avgResponseTimeMs)}
            sub="Per AI interaction"
          />
          <KpiCard
            label="Human Escalations"
            value={data.summary.humanHandled.toLocaleString()}
            sub="Handed off to agents"
          />
        </div>
      ) : null}

      {/* Daily Volume Bar Chart */}
      {loading ? (
        <ChartSkeleton />
      ) : data ? (
        <Card>
          <CardHeader>
            <CardTitle>Daily Conversation Volume (Last 14 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 || chartData.every((d) => d.conversations === 0) ? (
              <div className="flex h-56 items-center justify-center text-sm text-gray-400">
                No data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={224}>
                <BarChart
                  data={chartData}
                  margin={{ top: 4, right: 8, left: -16, bottom: 4 }}
                >
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11 }}
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
                  <Bar
                    dataKey="conversations"
                    name="Conversations"
                    radius={[4, 4, 0, 0]}
                    fill="#3b82f6"
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Channel Breakdown Table */}
      {loading ? (
        <TableSkeleton />
      ) : data ? (
        <Card>
          <CardHeader>
            <CardTitle>Channel Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {data.byChannel.length === 0 ? (
              <div className="flex h-32 items-center justify-center text-sm text-gray-400">
                No channel data yet
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left py-3 pr-4 font-medium text-gray-500">Channel</th>
                      <th className="text-right py-3 pr-4 font-medium text-gray-500">Conversations</th>
                      <th className="text-right py-3 pr-4 font-medium text-gray-500">AI Rate</th>
                      <th className="text-right py-3 font-medium text-gray-500">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {data.byChannel.map((ch, idx) => (
                      <tr key={ch.channel} className="hover:bg-gray-50 transition-colors">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block w-2 h-2 rounded-full"
                              style={{
                                backgroundColor:
                                  BAR_COLORS[idx % BAR_COLORS.length],
                              }}
                            />
                            <span className="font-medium text-gray-900">
                              {channelLabel(ch.channel)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right text-gray-700">
                          {ch.count.toLocaleString()}
                        </td>
                        <td className="py-3 pr-4 text-right font-medium text-gray-900">
                          {ch.aiRate}%
                        </td>
                        <td className="py-3 text-right">
                          <span className={`font-medium ${aiRateColor(ch.aiRate)}`}>
                            {aiRateStatus(ch.aiRate)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
