"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, CalendarCheck, CheckCheck, ListTodo, MessageSquare, RefreshCw, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FollowUp, TodayApproval, TodayData } from "@/types/today";
import { ApprovalQueue, FollowUpQueue, ReplyQueue } from "./today-queues";

type Queue = "needsReply" | "followUps" | "approvals";
const queueLabels = { needsReply: "Needs reply", followUps: "Follow-ups", approvals: "Approvals", bookings: "Bookings" };

export function TodayCommandCenter() {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [queue, setQueue] = useState<Queue>("needsReply");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<string | null>(null);
  const [actionErrors, setActionErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<string | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const mutating = useRef(false);

  const load = useCallback(async () => {
    if (mutating.current) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    setRefreshing(true);
    try {
      const response = await fetch("/api/dashboard/today", { cache: "no-store", signal: controller.signal });
      const json = await response.json();
      if (!response.ok || !json.data) throw new Error(json.error ?? "Could not load today's work.");
      if (controller.signal.aborted) return;
      const next = json.data as TodayData;
      setData(next);
      // Background refresh preserves the owner's edits while bringing in new drafts.
      setDrafts((current) => Object.fromEntries(next.approvals.map((item) => [item.id, current[item.id] ?? item.draftContent])));
      setLoadError(null);
    } catch (error) {
      if (!controller.signal.aborted) setLoadError(error instanceof Error ? error.message : "Could not load today's work.");
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

  async function performAction(key: string, url: string, method: string, body: Record<string, unknown>, success: string) {
    if (mutating.current) return;
    mutating.current = true;
    requestRef.current?.abort();
    setRefreshing(false);
    setActing(key);
    setNotice(null);
    setActionErrors({});
    try {
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error ?? "This action could not be completed. Try again.");
      setNotice(success);
    } catch (error) {
      setActionErrors((current) => ({ ...current, [key]: error instanceof Error ? error.message : "This action could not be completed. Try again." }));
    } finally {
      mutating.current = false;
      setActing(null);
      await load();
    }
  }

  function changeFollowUp(item: FollowUp, action: "complete" | "snooze") {
    void performAction(item.id, `/api/follow-ups/${item.id}`, "PATCH", {
      expected_updated_at: item.updated_at,
      ...(action === "complete" ? { status: "completed" } : { due_at: new Date(Date.now() + 86_400_000).toISOString() }),
    }, action === "complete" ? `Completed: ${item.title}` : `Snoozed for 24 hours: ${item.title}`);
  }

  function actOnApproval(item: TodayApproval, action: "approve" | "reject") {
    void performAction(item.id, `/api/ai/approvals/${item.id}`, "POST", {
      action,
      ...(action === "approve" ? { edited_content: drafts[item.id] ?? item.draftContent } : {}),
    }, action === "approve" ? `Reply approved for ${item.contactName}.` : `Draft rejected for ${item.contactName}.`);
  }

  if (loading) return (
    <div className="mx-auto max-w-7xl space-y-6" aria-busy="true" aria-label="Loading today's work">
      <div><h1 className="text-3xl font-semibold tracking-tight text-gray-950">Today</h1><p className="mt-2 text-sm text-gray-500">Loading your conversations and next steps…</p></div>
      <div className="h-96 animate-pulse rounded-xl border border-gray-200 bg-white motion-reduce:animate-none" />
    </div>
  );

  if (!data) return (
    <div className="mx-auto max-w-7xl">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-950">Today</h1>
      <div className="mt-6 rounded-xl border border-red-200 bg-white p-8">
        <AlertCircle className="mb-3 h-6 w-6 text-red-600" />
        <p role="alert" className="font-medium text-gray-900">{loadError ?? "Could not load today's work."}</p>
        <p className="mt-2 text-sm text-gray-500">Your work has not been changed. Reload the queue to try again.</p>
        <Button className="mt-5" onClick={() => void load()} loading={refreshing}>Try again</Button>
      </div>
    </div>
  );

  const dueCount = data.followUps.filter((item) => new Date(item.due_at).getTime() <= Date.now()).length;
  const orphanErrors = Object.entries(actionErrors).filter(([id, message]) => message && !data.followUps.some((item) => item.id === id) && !data.approvals.some((item) => item.id === id));
  const businessDate = new Intl.DateTimeFormat("en-AU", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(`${data.businessDate}T12:00:00Z`));
  const queueTabs = [
    { key: "needsReply" as const, icon: MessageSquare, count: data.totals.needsReply },
    { key: "followUps" as const, icon: ListTodo, count: dueCount },
    { key: "approvals" as const, icon: ShieldCheck, count: data.totals.approvals },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-gray-950">Today</h1>
          <p className="mt-1.5 text-sm text-gray-600">{businessDate} <span className="ml-2 text-gray-400">{data.timezone.replaceAll("_", " ")}</span></p>
          <p className="mt-3 max-w-xl text-sm leading-6 text-gray-600">Reply to waiting customers, move your follow-ups forward, and review the messages that need you.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => void load()} disabled={!!acting || refreshing} aria-label="Refresh today's work"><RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin motion-reduce:animate-none")} />Refresh</Button>
          <Link href="/contacts" className="inline-flex min-h-10 items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2">Plan a follow-up</Link>
        </div>
      </header>
      {loadError && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"><span>{loadError} Showing the last loaded queue.</span><button type="button" onClick={() => void load()} className="font-semibold underline" disabled={refreshing}>Retry</button></div>}
      {notice && <p role="status" className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900"><CheckCheck className="mt-0.5 h-4 w-4 shrink-0" />{notice}</p>}
      {orphanErrors.map(([id, message]) => <p key={id} role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{message} The queue has been refreshed.</p>)}
      {!data.canEdit && <p className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900">You have view-only access. A team member can complete follow-ups and approve replies.</p>}
      {data.truncated.length > 0 && <p role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">This overview shows up to 200 items for {data.truncated.map((key) => queueLabels[key].toLowerCase()).join(", ")}. Additional items are not shown.</p>}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-white" aria-label="Your work queue">
          <div className="flex overflow-x-auto border-b border-gray-200 bg-gray-50/60" role="group" aria-label="Choose work queue">
            {queueTabs.map(({ key, icon: Icon, count }) => <button key={key} type="button" onClick={() => setQueue(key)} aria-pressed={queue === key} className={cn("flex min-h-14 shrink-0 items-center gap-2 border-b-2 px-4 text-sm font-medium focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500 lg:px-5", queue === key ? "border-blue-600 bg-white text-blue-700" : "border-transparent text-gray-500 hover:text-gray-900")}><Icon className="h-4 w-4" /><span>{queueLabels[key]}</span><span className={cn("rounded-md px-1.5 py-0.5 text-xs tabular-nums", queue === key ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600")}>{count}</span></button>)}
          </div>
          {queue === "needsReply" && <ReplyQueue items={data.needsReply} />}
          {queue === "followUps" && <FollowUpQueue data={data} acting={acting} errors={actionErrors} onAction={changeFollowUp} />}
          {queue === "approvals" && <ApprovalQueue data={data} drafts={drafts} acting={acting} errors={actionErrors} onChangeDraft={(id, value) => setDrafts((current) => ({ ...current, [id]: value }))} onAction={actOnApproval} />}
        </section>
        <aside className="space-y-5" aria-label="Today's schedule and progress">
          <section className="rounded-xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-blue-700" /><h2 className="font-semibold text-gray-900">Today’s bookings</h2></div>
            <p className="mt-1 text-xs text-gray-500">Times in {data.timezone.replaceAll("_", " ")}</p>
            {data.bookings.length === 0 ? <p className="py-7 text-sm leading-6 text-gray-500">No upcoming bookings today. Confirmed appointments and pending requests will appear here.</p> : <ul className="mt-4 divide-y divide-gray-100">{data.bookings.map((booking) => <li key={booking.id} className="py-3"><p className="text-sm font-semibold tabular-nums text-gray-900">{booking.startTime.slice(0, 5)}–{booking.endTime.slice(0, 5)}</p>{booking.contactId ? <Link href={`/contacts/${booking.contactId}`} className="mt-1 block text-sm text-gray-700 hover:text-blue-700 hover:underline">{booking.clientName}</Link> : <p className="mt-1 text-sm text-gray-700">{booking.clientName}</p>}<p className={cn("mt-1 text-xs", booking.status === "pending" ? "text-amber-700" : "text-gray-500")}>{booking.status === "pending" ? "Awaiting confirmation" : "Confirmed"}</p></li>)}</ul>}
            <Link href="/bookings" className="inline-block text-sm font-medium text-blue-700 hover:underline">Open bookings</Link>
          </section>
          <section className="rounded-xl bg-blue-950 p-5 text-white"><CheckCheck className="mb-4 h-5 w-5 text-blue-200" /><p className="text-3xl font-semibold tabular-nums">{data.completedToday}</p><h2 className="mt-1 text-sm font-medium text-blue-100">Follow-ups completed today</h2><p className="mt-3 text-xs leading-5 text-blue-200">Every completed next step is saved on the contact’s record.</p></section>
          <Link href="/analytics" className="block px-1 text-sm font-medium text-gray-500 hover:text-blue-700 hover:underline">View conversion analytics</Link>
        </aside>
      </div>
    </div>
  );
}
