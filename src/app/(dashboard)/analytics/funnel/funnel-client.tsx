"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

type FunnelStage =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal"
  | "negotiation"
  | "won";

interface FunnelStageResult {
  stage: FunnelStage;
  count: number;
  drop_off_pct: number;
  conversion_pct: number;
}

interface FunnelResponse {
  stages: FunnelStageResult[];
  overallConversionPct: number;
  totalLost: number;
  totalContacts: number;
  days: number;
  sourceChannel: string | null;
}

// ── Options ────────────────────────────────────────────────────────────────────

const DAY_OPTIONS: { value: string; label: string }[] = [
  { value: "30", label: "Last 30 days" },
  { value: "90", label: "Last 90 days" },
  { value: "365", label: "Last 365 days" },
];

const CHANNEL_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All channels" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "sms", label: "SMS" },
  { value: "voice", label: "Voice" },
  { value: "web_chat", label: "Web Chat" },
  { value: "manual", label: "Manual" },
  { value: "hubspot", label: "HubSpot" },
];

const STAGE_COLORS: Record<FunnelStage, string> = {
  new: "bg-gray-400",
  contacted: "bg-blue-400",
  qualified: "bg-blue-500",
  proposal: "bg-indigo-500",
  negotiation: "bg-purple-500",
  won: "bg-green-500",
};

const STAGE_LABELS: Record<FunnelStage, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
};

// ── Main component ─────────────────────────────────────────────────────────────

export function FunnelClient() {
  const router = useRouter();
  const [days, setDays] = useState<string>("90");
  const [sourceChannel, setSourceChannel] = useState<string>("");
  const [data, setData] = useState<FunnelResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ days });
        if (sourceChannel) params.set("source_channel", sourceChannel);
        const res = await fetch(`/api/analytics/funnel?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const json = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          setError(json.error ?? "Failed to load funnel data");
          return;
        }
        const json = (await res.json()) as { data: FunnelResponse };
        setData(json.data);
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [days, sourceChannel]);

  const maxCount = useMemo(() => {
    if (!data || data.stages.length === 0) return 0;
    return Math.max(...data.stages.map((s) => s.count), 1);
  }, [data]);

  function handleStageClick(stage: FunnelStage) {
    router.push(`/contacts?status=${stage}`);
  }

  const hasAnyContacts = data ? data.totalContacts > 0 : false;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Conversion Funnel
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            See how leads progress through your pipeline and where they drop off
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3 self-start sm:self-auto">
          <div className="min-w-[160px]">
            <Select
              label="Date range"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              options={DAY_OPTIONS}
            />
          </div>
          <div className="min-w-[180px]">
            <Select
              label="Source channel"
              value={sourceChannel}
              onChange={(e) => setSourceChannel(e.target.value)}
              options={CHANNEL_OPTIONS}
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Top summary row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-5 flex flex-col gap-1">
            <p className="text-sm text-gray-500">Overall Conversion</p>
            {loading ? (
              <Skeleton className="h-9 w-24 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-green-600">
                {data?.overallConversionPct ?? 0}%
              </p>
            )}
            <p className="text-xs text-gray-400">New leads that became Won</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 flex flex-col gap-1">
            <p className="text-sm text-gray-500">Total Contacts</p>
            {loading ? (
              <Skeleton className="h-9 w-20 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-gray-900">
                {(data?.totalContacts ?? 0).toLocaleString()}
              </p>
            )}
            <p className="text-xs text-gray-400">In selected window</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-5 flex flex-col gap-1">
            <p className="text-sm text-gray-500">Total Lost</p>
            {loading ? (
              <Skeleton className="h-9 w-20 mt-1" />
            ) : (
              <p className="text-3xl font-bold text-red-600">
                {(data?.totalLost ?? 0).toLocaleString()}
              </p>
            )}
            <button
              type="button"
              onClick={() => router.push("/contacts?status=lost")}
              className="text-xs text-blue-600 hover:text-blue-700 text-left"
            >
              View lost contacts →
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Stepped funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Stage breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !data || !hasAnyContacts ? (
            <div className="flex h-40 items-center justify-center text-sm text-gray-400">
              No contacts in this window yet
            </div>
          ) : (
            <div className="space-y-3">
              {data.stages.map((s, i) => {
                const width =
                  maxCount === 0 ? 0 : Math.max(8, (s.count / maxCount) * 100);
                return (
                  <button
                    key={s.stage}
                    type="button"
                    onClick={() => handleStageClick(s.stage)}
                    className="w-full group text-left"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700 transition-colors">
                          {STAGE_LABELS[s.stage]}
                        </span>
                        <span className="text-xs text-gray-400">
                          {s.count.toLocaleString()} contact
                          {s.count !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs">
                        {i > 0 && s.drop_off_pct > 0 && (
                          <span className="text-red-600 font-medium">
                            -{s.drop_off_pct.toFixed(1)}% drop
                          </span>
                        )}
                        <span className="text-gray-500">
                          {s.conversion_pct.toFixed(1)}% of new
                        </span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 rounded-md h-10 overflow-hidden relative">
                      <div
                        className={cn(
                          "h-full rounded-md transition-all duration-500 flex items-center px-3",
                          STAGE_COLORS[s.stage],
                          "group-hover:opacity-90"
                        )}
                        style={{ width: `${width}%` }}
                      >
                        <span className="text-xs font-semibold text-white truncate">
                          {s.count.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <p className="text-xs text-gray-400 pt-4">
            Click any stage to view those contacts. Drop-off shows the % lost
            from the previous stage.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
