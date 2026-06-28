"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight } from "lucide-react";

interface StaleAlertResponse {
  data: {
    thresholdHours: number;
    count: number;
  };
}

export function StaleLeadsAlert() {
  const [count, setCount] = useState(0);
  const [hours, setHours] = useState(2);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/alerts/stale-hot-leads");
        if (!res.ok) return;
        const json = (await res.json()) as StaleAlertResponse;
        if (cancelled) return;
        setCount(json.data.count);
        setHours(json.data.thresholdHours);
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loaded || count === 0) return null;

  return (
    <Link
      href="/contacts?filter=stale_hot"
      className="flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 hover:bg-red-100 transition-colors"
    >
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 text-red-600 shrink-0" />
        <span>
          <strong>{count}</strong> hot lead{count === 1 ? "" : "s"} waiting for
          reply for more than {hours}h
        </span>
      </div>
      <ArrowRight className="h-4 w-4 text-red-600" />
    </Link>
  );
}
