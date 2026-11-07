"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ArrowRight, CheckCircle2, Circle, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OnboardingItem, OnboardingResponse } from "@/app/api/dashboard/onboarding/route";

function dismissalKey(data: OnboardingResponse) {
  return `leadflow:pilot-checklist:v1:${data.ownerId}:${data.currentUserId}`;
}

export function OnboardingChecklist() {
  const [data, setData] = useState<OnboardingResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState("");
  const requestRef = useRef<AbortController | null>(null);
  const dismissedKeyRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setRefreshing(true);
    try {
      const response = await fetch("/api/dashboard/onboarding", { cache: "no-store", signal: controller.signal });
      const json = await response.json();
      if (!response.ok || !json.data) throw new Error(json.error ?? "Could not load your pilot checklist. Please try again.");
      if (controller.signal.aborted) return;
      const next = json.data as OnboardingResponse;
      const key = dismissalKey(next);
      let isDismissed = dismissedKeyRef.current === key;
      try {
        isDismissed = isDismissed || window.localStorage.getItem(key) === "1";
      } catch {
        // Storage may be unavailable; a dismissal still works for this visit.
      }
      setDismissed(isDismissed);
      setData(next);
      setError("");
    } catch (err) {
      if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Could not load your pilot checklist. Please try again.");
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void load();
    const refreshVisible = () => { if (document.visibilityState === "visible") void load(); };
    const interval = window.setInterval(refreshVisible, 60_000);
    window.addEventListener("focus", refreshVisible);
    document.addEventListener("visibilitychange", refreshVisible);
    return () => {
      requestRef.current?.abort();
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshVisible);
      document.removeEventListener("visibilitychange", refreshVisible);
    };
  }, [load]);

  function dismiss() {
    if (!data) return;
    const key = dismissalKey(data);
    dismissedKeyRef.current = key;
    try { window.localStorage.setItem(key, "1"); } catch { /* This visit still stays dismissed. */ }
    setDismissed(true);
  }

  if (dismissed || data?.allDone) return null;

  if (loading) return (
    <section className="rounded-xl border border-blue-100 bg-white px-5 py-4" aria-busy="true" aria-label="Loading pilot checklist">
      <h2 className="font-semibold text-gray-950">Start your web chat pilot</h2>
      <p role="status" className="mt-2 text-sm text-gray-500">Checking your first conversation and next step…</p>
    </section>
  );

  if (!data) return (
    <section className="rounded-xl border border-blue-100 bg-white px-5 py-4" aria-label="Pilot checklist">
      <h2 className="font-semibold text-gray-950">Start your web chat pilot</h2>
      <p role="alert" className="mt-2 text-sm text-red-700">{error || "Could not load your pilot checklist."}</p>
      <Button className="mt-3" variant="outline" size="sm" onClick={() => void load()} loading={refreshing}>Retry checklist</Button>
    </section>
  );

  const doneCount = data.items.filter((item) => item.done).length;
  return (
    <section className="overflow-hidden rounded-xl border border-blue-100 bg-white" aria-labelledby="pilot-checklist-title">
      <div className="border-b border-blue-100 bg-blue-50/40 px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="pilot-checklist-title" className="font-semibold text-gray-950">Start your web chat pilot</h2>
            <p className="mt-1 text-sm text-gray-600">Follow one enquiry from the visitor’s chat to your next action.</p>
          </div>
          <button type="button" onClick={dismiss} className="rounded p-1 text-gray-500 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Dismiss pilot checklist"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-blue-100" role="progressbar" aria-label="Pilot milestones completed" aria-valuemin={0} aria-valuemax={data.items.length} aria-valuenow={doneCount}>
            <div className="h-full rounded-full bg-blue-600 transition-all motion-reduce:transition-none" style={{ width: `${data.percent}%` }} />
          </div>
          <span className="text-xs font-medium tabular-nums text-blue-900">{doneCount} of {data.items.length}</span>
          <button type="button" onClick={() => void load()} disabled={refreshing} className="rounded p-1 text-blue-700 hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:opacity-50" aria-label="Refresh pilot checklist"><RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin motion-reduce:animate-none")} /></button>
        </div>
      </div>
      {error && <p role="alert" className="px-5 pt-3 text-sm text-red-700">{error} Showing your last loaded progress.</p>}
      <ul className="grid divide-y divide-gray-100 px-5 lg:grid-cols-2 lg:gap-x-6">
        {data.items.map((item) => <ChecklistRow key={item.key} item={item} />)}
      </ul>
    </section>
  );
}

function ChecklistRow({ item }: { item: OnboardingItem }) {
  return <li>
    <Link href={item.href as Route} className="group flex items-start gap-3 rounded-md py-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
      <span className="mt-0.5 shrink-0" aria-label={item.done ? "Completed" : "Not completed"}>{item.done ? <CheckCircle2 className="h-5 w-5 text-green-600" /> : <Circle className="h-5 w-5 text-blue-300" />}</span>
      <div className="min-w-0 flex-1"><p className={cn("text-sm font-medium", item.done ? "text-gray-500" : "text-gray-900 group-hover:text-blue-700")}>{item.label}</p><p className="mt-1 text-xs leading-5 text-gray-500">{item.description}</p></div>
      <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-gray-300 group-hover:text-blue-600" />
    </Link>
  </li>;
}
