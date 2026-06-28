"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface DigestStats {
  newLeads: number;
  wonDeals: number;
  bookings: number;
  aiConversations: number;
  topSourceChannel: string | null;
  avgResponseTimeMs: number | null;
  rangeStart: string;
  rangeEnd: string;
}

interface DigestPayload {
  subject: string;
  html: string;
  text: string;
  stats: DigestStats;
}

function formatLatency(ms: number | null): string {
  if (ms === null) return "n/a";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

interface StatCardProps {
  label: string;
  value: string | number;
}

function StatCard({ label, value }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold text-gray-900">{value}</p>
      </CardContent>
    </Card>
  );
}

export default function DigestPage() {
  const [loading, setLoading] = useState(true);
  const [digest, setDigest] = useState<DigestPayload | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const fetchDigest = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/digest/preview");
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to load digest.");
        return;
      }
      setDigest(json.data as DigestPayload);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDigest();
  }, [fetchDigest]);

  async function handleSend() {
    setStatus(null);
    setSending(true);
    try {
      const res = await fetch("/api/digest/send", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        setStatus(json.error ?? "Failed to send digest.");
        return;
      }
      setStatus(`Sent to ${json.data?.recipient ?? "your email"}.`);
    } catch {
      setStatus("An unexpected error occurred.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Digest</h1>
          <p className="text-sm text-gray-500 mt-1">
            Auto-generated summary of the last 7 days. Send it to your inbox
            with one click.
          </p>
        </div>
        <Button onClick={handleSend} loading={sending} disabled={!digest}>
          Send to my email
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {status && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
          {status}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      ) : digest ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="New leads" value={digest.stats.newLeads} />
            <StatCard label="Won" value={digest.stats.wonDeals} />
            <StatCard label="Bookings" value={digest.stats.bookings} />
            <StatCard label="AI chats" value={digest.stats.aiConversations} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Top source channel
                </p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {digest.stats.topSourceChannel ?? "n/a"}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Avg AI response time
                </p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {formatLatency(digest.stats.avgResponseTimeMs)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Email preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-gray-200 bg-gray-50 p-3 mb-3">
                <p className="text-xs uppercase font-semibold text-gray-500">
                  Subject
                </p>
                <p className="text-sm text-gray-900 mt-0.5">{digest.subject}</p>
              </div>
              <iframe
                title="Digest preview"
                srcDoc={digest.html}
                sandbox=""
                className="w-full h-[520px] rounded-md border border-gray-200 bg-white"
              />
            </CardContent>
          </Card>
        </>
      ) : null}
    </div>
  );
}
