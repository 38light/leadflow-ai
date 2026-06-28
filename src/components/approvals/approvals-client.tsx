"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import { EmptyState } from "@/components/ui/empty-state";

interface ApprovalContact {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
}

interface ApprovalConversation {
  id: string;
  channel_type: string | null;
  summary: string | null;
}

interface ApprovalRow {
  id: string;
  conversation_id: string | null;
  contact_id: string | null;
  draft_content: string;
  confidence: number | null;
  reasoning: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  contact: ApprovalContact | null;
  conversation: ApprovalConversation | null;
}

function formatPercent(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  return `${Math.round(value * 100)}%`;
}

function confidenceClass(value: number | null): string {
  if (value === null) return "bg-gray-100 text-gray-700";
  if (value >= 0.8) return "bg-green-100 text-green-800";
  if (value >= 0.5) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

export function ApprovalsClient() {
  const { toast } = useToast();
  const [items, setItems] = useState<ApprovalRow[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/approvals?status=pending");
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "Failed to load approvals", "error");
        return;
      }
      const rows = (json.data ?? []) as ApprovalRow[];
      setItems(rows);
      const initial: Record<string, string> = {};
      for (const r of rows) initial[r.id] = r.draft_content;
      setDrafts(initial);
    } catch {
      toast("Failed to load approvals", "error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function act(id: string, action: "approve" | "reject") {
    setActing(id);
    try {
      const body: { action: "approve" | "reject"; edited_content?: string } = { action };
      if (action === "approve") {
        body.edited_content = drafts[id];
      }
      const res = await fetch(`/api/ai/approvals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? `Failed to ${action}`, "error");
        return;
      }
      toast(action === "approve" ? "Reply sent" : "Draft rejected", "success");
      setItems((prev) => prev.filter((row) => row.id !== id));
    } catch {
      toast(`Failed to ${action}`, "error");
    } finally {
      setActing(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white border rounded-lg p-6 animate-pulse h-48"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing pending"
        description="When AI confidence is below your threshold, drafts will appear here for you to approve."
      />
    );
  }

  return (
    <div className="space-y-4">
      {items.map((row) => {
        const contactLabel =
          row.contact?.name ??
          row.contact?.email ??
          row.contact?.phone ??
          "Unknown contact";
        const channel = row.conversation?.channel_type ?? "—";
        const created = new Date(row.created_at).toLocaleString();

        return (
          <div
            key={row.id}
            className="bg-white border rounded-lg p-5 space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold truncate">{contactLabel}</span>
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-700 uppercase tracking-wide">
                    {channel}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded ${confidenceClass(row.confidence)}`}
                  >
                    {formatPercent(row.confidence)} confidence
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">Drafted {created}</p>
              </div>
              {row.conversation_id && (
                <Link
                  href={`/conversations/${row.conversation_id}`}
                  className="text-sm text-blue-600 hover:underline whitespace-nowrap"
                >
                  Open thread →
                </Link>
              )}
            </div>

            {row.conversation?.summary && (
              <div className="text-sm text-gray-600 bg-gray-50 border rounded p-3">
                <span className="font-medium text-gray-700">Conversation:</span>{" "}
                {row.conversation.summary}
              </div>
            )}

            {row.reasoning && (
              <div className="text-xs text-gray-500 italic">
                AI reasoning: {row.reasoning}
              </div>
            )}

            <Textarea
              id={`draft-${row.id}`}
              label="AI draft (edit before approving)"
              rows={5}
              value={drafts[row.id] ?? ""}
              onChange={(e) =>
                setDrafts((d) => ({ ...d, [row.id]: e.target.value }))
              }
            />

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => act(row.id, "reject")}
                disabled={acting === row.id}
              >
                Reject
              </Button>
              <Button
                onClick={() => act(row.id, "approve")}
                loading={acting === row.id}
                disabled={acting === row.id || !(drafts[row.id] ?? "").trim()}
              >
                Approve & send
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
