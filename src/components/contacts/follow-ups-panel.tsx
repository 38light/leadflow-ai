"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { CalendarClock, Check, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { FollowUp, FollowUpsResponse } from "@/types/today";

function localDateTime(value: Date) {
  const local = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function FollowUpsPanel({ contactId }: { contactId: string }) {
  const [data, setData] = useState<FollowUpsResponse | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<FollowUp | null>(null);
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const [assignee, setAssignee] = useState("");
  const [timezone, setTimezone] = useState("");
  const requestSequence = useRef(0);
  const busy = useRef(false);

  const load = useCallback(async () => {
    const sequence = ++requestSequence.current;
    try {
      const responses = await Promise.all(["pending", "completed"].map(async (status) => {
        const res = await fetch(`/api/follow-ups?contact_id=${encodeURIComponent(contactId)}&status=${status}`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Could not load follow-ups. Try again.");
        return json as FollowUpsResponse;
      }));
      if (sequence !== requestSequence.current) return;
      const [pending, completed] = responses;
      setData({ ...pending, data: [...pending.data, ...completed.data], total: pending.total + completed.total, truncated: pending.truncated || completed.truncated });
      setError("");
    } catch (err) {
      if (sequence === requestSequence.current) setError(err instanceof Error ? err.message : "Could not load follow-ups. Try again.");
    } finally {
      if (sequence === requestSequence.current) setLoading(false);
    }
  }, [contactId]);

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
    void load();
    return () => { requestSequence.current += 1; };
  }, [load]);

  function openForm(item?: FollowUp) {
    setEditing(item ?? null);
    setTitle(item?.title ?? "");
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    setDue(localDateTime(item ? new Date(item.due_at) : tomorrow));
    const defaultOwner = data?.assignees.some((person) => person.id === data.currentUserId)
      ? data.currentUserId : data?.assignees[0]?.id ?? "";
    setAssignee(item?.assigned_to ?? defaultOwner);
    setError("");
    setSuccess("");
    setFormOpen(true);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy.current) return;
    const date = new Date(due);
    if (!title.trim() || !assignee || Number.isNaN(date.getTime())) {
      setError("Enter a next action, a valid due date, and an owner.");
      return;
    }
    busy.current = true;
    setSaving("form");
    setError("");
    setSuccess("");
    try {
      const res = await fetch(editing ? `/api/follow-ups/${editing.id}` : "/api/follow-ups", {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(editing ? { expected_updated_at: editing.updated_at } : { contact_id: contactId }),
          title: title.trim(), due_at: date.toISOString(), assigned_to: assignee,
        }),
      });
      const json = await res.json();
      if (res.status === 409) {
        setFormOpen(false);
        setEditing(null);
        await load();
        throw new Error("This follow-up changed. Your edit was not saved. Reopen Edit / reschedule to review the latest version.");
      }
      if (!res.ok) throw new Error(json.error ?? "Could not save the follow-up. Try again.");
      setFormOpen(false);
      setSuccess(editing ? "Follow-up updated." : "Follow-up added to Today.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the follow-up. Try again.");
    } finally {
      setSaving(null);
      busy.current = false;
    }
  }

  async function changeStatus(item: FollowUp, status: "completed" | "cancelled") {
    if (busy.current) return;
    busy.current = true;
    setSaving(item.id);
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/follow-ups/${item.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, expected_updated_at: item.updated_at }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not update the follow-up. Refresh and try again.");
      setSuccess(status === "completed" ? "Follow-up completed." : "Follow-up cancelled.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update the follow-up. Refresh and try again.");
    } finally {
      setSaving(null);
      busy.current = false;
    }
  }

  const pending = data?.data.filter((item) => item.status === "pending") ?? [];
  const completed = data?.data.filter((item) => item.status === "completed") ?? [];

  return (
    <section className="my-6 rounded-xl border border-blue-100 bg-white" aria-labelledby="follow-ups-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-blue-100 px-5 py-4">
        <div>
          <h2 id="follow-ups-heading" className="flex items-center gap-2 font-semibold text-gray-950"><CalendarClock className="h-5 w-5 text-blue-600" /> Next steps</h2>
          <p className="mt-1 text-sm text-gray-500">Keep the next action, its owner, and its deadline together.</p>
        </div>
        {data?.canEdit && !formOpen && <Button size="sm" onClick={() => openForm()} disabled={!!saving}><Plus className="mr-1.5 h-4 w-4" /> Add follow-up</Button>}
      </div>
      <div className="space-y-4 p-5">
        {error && <div role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error} <button type="button" className="ml-1 underline" onClick={() => void load()}>Refresh follow-ups</button></div>}
        {success && <p role="status" className="text-sm text-green-700">{success}</p>}
        {loading && <p className="text-sm text-gray-500" role="status">Loading next steps…</p>}
        {data?.truncated && <p className="text-sm text-amber-800">Showing {data.data.length} of {data.total} follow-ups for this contact.</p>}
        {formOpen && (
          <form onSubmit={save} className="space-y-4 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
            <Input id={`follow-title-${contactId}`} label="Next action" placeholder="Follow up on the quote" maxLength={200} required value={title} onChange={(event) => setTitle(event.target.value)} disabled={!!saving} />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id={`follow-due-${contactId}`} type="datetime-local" label="Due date and time" required value={due} onChange={(event) => setDue(event.target.value)} disabled={!!saving} />
              <Select id={`follow-owner-${contactId}`} label="Assigned to" required options={(data?.assignees ?? []).map((person) => ({ value: person.id, label: person.name }))} value={assignee} onChange={(event) => setAssignee(event.target.value)} disabled={!!saving} />
            </div>
            <p className="text-xs text-gray-500">Times use your device timezone{timezone ? ` (${timezone})` : ""}.</p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" disabled={!!saving} onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button type="submit" loading={saving === "form"} disabled={!!saving}>{editing ? "Save follow-up" : "Add follow-up"}</Button>
            </div>
          </form>
        )}
        {!loading && data && pending.length === 0 && <p className="text-sm text-gray-500">No follow-up scheduled. Add the next action to keep this conversation moving.</p>}
        <ul className="divide-y divide-gray-100">
          {pending.map((item) => (
            <li key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="break-words font-medium text-gray-900">{item.title}</p>
                <p className="mt-1 text-sm text-gray-500">{data?.assignees.find((person) => person.id === item.assigned_to)?.name ?? "Former team member"}</p>
                <p className={`mt-1 text-xs ${new Date(item.due_at).getTime() < Date.now() ? "font-medium text-amber-700" : "text-gray-500"}`}>Due {new Date(item.due_at).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
              </div>
              {data?.canEdit && <div className="flex flex-wrap gap-1">
                <Button size="sm" variant="outline" disabled={!!saving || formOpen} loading={saving === item.id} onClick={() => void changeStatus(item, "completed")}><Check className="mr-1 h-4 w-4" /> Complete</Button>
                <Button size="sm" variant="ghost" disabled={!!saving || formOpen} onClick={() => openForm(item)}>Edit / reschedule</Button>
                <Button size="sm" variant="ghost" disabled={!!saving || formOpen} aria-label={`Cancel follow-up: ${item.title}`} onClick={() => void changeStatus(item, "cancelled")}><X className="h-4 w-4" /></Button>
              </div>}
            </li>
          ))}
        </ul>
        {completed.length > 0 && <details className="border-t border-gray-100 pt-3"><summary className="cursor-pointer text-sm text-gray-500">{completed.length} completed follow-up{completed.length === 1 ? "" : "s"}</summary><ul className="mt-3 space-y-2">{completed.map((item) => <li key={item.id} className="text-sm text-gray-500"><Check className="mr-2 inline h-3.5 w-3.5 text-green-600" />{item.title}</li>)}</ul></details>}
      </div>
    </section>
  );
}
