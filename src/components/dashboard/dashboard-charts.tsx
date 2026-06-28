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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

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

const FUNNEL_COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444"];

const TEMPERATURE_COLORS: Record<string, string> = {
  Hot: "#ef4444",
  Warm: "#f97316",
  Cold: "#3b82f6",
};

export function DashboardCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const json = await res.json();
          setData(json.data as AnalyticsData);
        }
      } catch {
        // silently fail — charts will stay empty
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) {
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

  // Build lead funnel data
  const funnelData = data
    ? [
        {
          name: "Total",
          value: data.contacts.total,
        },
        {
          name: "Hot",
          value: data.contacts.hot,
        },
        {
          name: "Warm",
          value: data.contacts.warm,
        },
        {
          name: "Won",
          value: data.contacts.won,
        },
        {
          name: "Lost",
          value: data.contacts.lost,
        },
      ]
    : [];

  // Build temperature donut data (exclude zeros to avoid empty slices)
  const cold = data
    ? Math.max(
        0,
        data.contacts.total - data.contacts.hot - data.contacts.warm
      )
    : 0;
  const temperatureData = data
    ? [
        { name: "Hot", value: data.contacts.hot },
        { name: "Warm", value: data.contacts.warm },
        { name: "Cold", value: cold },
      ].filter((d) => d.value > 0)
    : [];

  const hasAnyData =
    data && (data.contacts.total > 0 || data.conversations.total > 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Lead Funnel Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          {!hasAnyData ? (
            <div className="flex h-56 items-center justify-center text-sm text-gray-400">
              No data yet
            </div>
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

      {/* Temperature Donut Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Lead Temperature</CardTitle>
        </CardHeader>
        <CardContent>
          {temperatureData.length === 0 ? (
            <div className="flex h-56 items-center justify-center text-sm text-gray-400">
              No data yet
            </div>
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
  );
}
