"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { formatDistanceToNowStrict } from "date-fns";
import { Check, Clock3, Inbox, ListTodo, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { FollowUp, TodayApproval, TodayData, TodayReply } from "@/types/today";

const channelLabels: Record<string, string> = { web_chat: "Web chat", whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook", sms: "SMS", voice: "Voice" };
const linkStyle = "inline-flex min-h-9 items-center justify-center rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2";

function displayDate(value: string, timezone: string) {
  return new Intl.DateTimeFormat("en-AU", { timeZone: timezone, day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

function EmptyQueue({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return <div className="px-6 py-16 text-center"><div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-blue-50 text-blue-700">{icon}</div><h3 className="text-base font-semibold text-gray-900">{title}</h3><div className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">{children}</div></div>;
}

export function ReplyQueue({ items }: { items: TodayReply[] }) {
  return <>
    <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-3 text-xs text-gray-500"><p>Customers waiting for a reply</p><span>Oldest first</span></div>
    {items.length === 0 ? <EmptyQueue icon={<Inbox className="h-5 w-5" />} title="No customers waiting"><p>When a customer sends a message that needs a reply, the conversation will appear here.</p><Link href="/conversations" className="mt-3 inline-block font-medium text-blue-700 hover:underline">Open inbox</Link></EmptyQueue> : <ul className="divide-y divide-gray-100">{items.map((item) => <li key={item.id} className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><Link href={`/contacts/${item.contactId}`} className="font-semibold text-gray-900 hover:text-blue-700 hover:underline">{item.contactName}</Link><p className="mt-1 text-xs text-gray-500">{channelLabels[item.channel] ?? item.channel}</p></div><span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-800"><Clock3 className="h-3.5 w-3.5" />Waiting {formatDistanceToNowStrict(new Date(item.lastMessageAt))}</span></div>
      <p className="mt-3 line-clamp-3 whitespace-pre-wrap break-words text-sm leading-6 text-gray-600">{item.preview || "Customer sent an attachment."}</p>
      <div className="mt-4 flex justify-end"><Link href={`/conversations/${item.id}`} className={linkStyle}>Open conversation</Link></div>
    </li>)}</ul>}
  </>;
}

export function FollowUpQueue({ data, acting, errors, onAction }: {
  data: TodayData;
  acting: string | null;
  errors: Record<string, string>;
  onAction: (item: FollowUp, action: "complete" | "snooze") => void;
}) {
  const [dueFilter, setDueFilter] = useState("due");
  const [assignee, setAssignee] = useState("all");
  const now = Date.now();
  const items = data.followUps.filter((item) => {
    const isDue = new Date(item.due_at).getTime() <= now;
    return (dueFilter === "all" || (dueFilter === "due" ? isDue : !isDue)) && (assignee === "all" || item.assigned_to === assignee);
  });
  return <>
    <div className="flex flex-wrap gap-3 border-b border-gray-100 px-5 py-4">
      <Select id="today-due-filter" label="When" value={dueFilter} onChange={(event) => setDueFilter(event.target.value)} options={[{ value: "due", label: "Due now" }, { value: "upcoming", label: "Upcoming" }, { value: "all", label: "All pending" }]} />
      <Select id="today-owner-filter" label="Assigned to" value={assignee} onChange={(event) => setAssignee(event.target.value)} options={[{ value: "all", label: "Everyone" }, ...data.assignees.map((person) => ({ value: person.id, label: person.name }))]} />
    </div>
    {items.length === 0 ? <EmptyQueue icon={<ListTodo className="h-5 w-5" />} title={dueFilter === "due" ? "No follow-ups due here" : "No follow-ups in this view"}><p>{dueFilter === "due" ? "Your next steps are clear for now. Check upcoming work or plan the next action for a contact." : "Choose another filter or open a contact to schedule their next step."}</p><Link href="/contacts" className="mt-3 inline-block font-medium text-blue-700 hover:underline">Choose a contact</Link></EmptyQueue> : <ul className="divide-y divide-gray-100">{items.map((item) => {
      const overdue = new Date(item.due_at).getTime() < now;
      return <li key={item.id} className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words font-semibold text-gray-900">{item.title}</h3><Link href={`/contacts/${item.contact_id}`} className="mt-1 inline-block text-sm text-blue-700 hover:underline">{item.contact?.name ?? item.contact?.email ?? item.contact?.phone ?? "Contact"}</Link></div><span className={cn("rounded-md px-2 py-1 text-xs font-medium", overdue ? "bg-amber-50 text-amber-800" : "bg-gray-100 text-gray-600")}>{overdue ? "Overdue" : "Upcoming"}</span></div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500"><span>Due {displayDate(item.due_at, data.timezone)}</span><span>Assigned to {data.assignees.find((person) => person.id === item.assigned_to)?.name ?? "Former team member"}</span></div>
        {errors[item.id] && <p role="alert" className="mt-3 text-sm text-red-700">{errors[item.id]}</p>}
        <div className="mt-4 flex flex-wrap items-center justify-end gap-2"><Link href={`/contacts/${item.contact_id}`} className="mr-auto text-sm font-medium text-gray-600 hover:text-blue-700 hover:underline">{data.canEdit ? "Edit next step" : "View next step"}</Link>{data.canEdit && <><Button size="sm" variant="outline" disabled={!!acting} onClick={() => onAction(item, "snooze")} aria-label={`Snooze ${item.title} for 24 hours`}><Clock3 className="mr-1.5 h-4 w-4" />Snooze 24h</Button><Button size="sm" loading={acting === item.id} disabled={!!acting} onClick={() => onAction(item, "complete")} aria-label={`Complete ${item.title}`}><Check className="mr-1.5 h-4 w-4" />Complete</Button></>}</div>
      </li>;
    })}</ul>}
  </>;
}

export function ApprovalQueue({ data, drafts, acting, errors, onChangeDraft, onAction }: {
  data: TodayData;
  drafts: Record<string, string>;
  acting: string | null;
  errors: Record<string, string>;
  onChangeDraft: (id: string, value: string) => void;
  onAction: (item: TodayApproval, action: "approve" | "reject") => void;
}) {
  return <>
    <div className="border-b border-gray-100 px-5 py-3 text-xs leading-5 text-gray-500">Review each draft before approving. Web chat replies are made available to the customer after approval.</div>
    {data.approvals.length === 0 ? <EmptyQueue icon={<ShieldCheck className="h-5 w-5" />} title="No replies need approval"><p>Drafts waiting for your review will appear here. You control approval rules in AI settings.</p><Link href="/settings/ai-quality" className="mt-3 inline-block font-medium text-blue-700 hover:underline">Review approval settings</Link></EmptyQueue> : <ul className="divide-y divide-gray-100">{data.approvals.map((item) => <li key={item.id} className="space-y-4 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold text-gray-900">{item.contactName}</h3><p className="mt-1 text-xs text-gray-500">{channelLabels[item.channel] ?? item.channel} • Drafted {displayDate(item.createdAt, data.timezone)}</p></div>{item.conversationId && <Link href={`/conversations/${item.conversationId}`} className="text-sm font-medium text-blue-700 hover:underline">Open conversation</Link>}</div>
      {item.reasoning && <p className="rounded-lg bg-blue-50/70 px-3 py-2 text-sm leading-6 text-blue-900">{item.reasoning}</p>}
      <Textarea id={`today-draft-${item.id}`} label="Reply to customer" value={drafts[item.id] ?? item.draftContent} onChange={(event) => onChangeDraft(item.id, event.target.value)} disabled={!data.canEdit || acting === item.id} maxLength={10000} rows={4} />
      {item.channel !== "web_chat" && <p className="text-sm text-amber-800">Sending approved replies is not available for this channel yet. You can still review or reject this draft.</p>}
      {errors[item.id] && <p role="alert" className="text-sm text-red-700">{errors[item.id]}</p>}
      {data.canEdit && <div className="flex flex-wrap justify-end gap-2"><Button variant="outline" size="sm" onClick={() => onAction(item, "reject")} disabled={!!acting}>Reject draft</Button><Button size="sm" onClick={() => onAction(item, "approve")} loading={acting === item.id} disabled={!!acting || item.channel !== "web_chat" || !(drafts[item.id] ?? item.draftContent).trim()}>Approve reply</Button></div>}
    </li>)}</ul>}
  </>;
}
