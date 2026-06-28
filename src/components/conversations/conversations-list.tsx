"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { MessageCircle, MessageSquare } from "lucide-react";
import type { Conversation } from "@/types";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "closed", label: "Closed" },
  { value: "archived", label: "Archived" },
];

const CHANNEL_OPTIONS = [
  { value: "", label: "All Channels" },
  { value: "web_chat", label: "Web Chat" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "sms", label: "SMS" },
  { value: "voice", label: "Voice" },
];

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  sms: "SMS",
  voice: "Voice",
  web_chat: "Web Chat",
};

const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  paused: "bg-yellow-100 text-yellow-800",
  closed: "bg-gray-100 text-gray-800",
  archived: "bg-red-100 text-red-800",
};

/**
 * SLA timer — returns elapsed time string + urgency color class.
 * Green < 1h, amber < 4h, red >= 4h.
 */
function getSlaInfo(lastMessageAt: string | null | undefined): {
  label: string;
  colorClass: string;
} | null {
  if (!lastMessageAt) return null;
  const diffMs = Date.now() - new Date(lastMessageAt).getTime();
  const diffMins = Math.floor(diffMs / 60000);

  let label: string;
  if (diffMins < 1) label = "Just now";
  else if (diffMins < 60) label = `${diffMins}m ago`;
  else if (diffMins < 1440) label = `${Math.floor(diffMins / 60)}h ago`;
  else label = `${Math.floor(diffMins / 1440)}d ago`;

  const colorClass =
    diffMins < 60
      ? "text-green-600"
      : diffMins < 240
      ? "text-amber-500"
      : "text-red-500 font-medium";

  return { label, colorClass };
}

export function ConversationsList() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [channel, setChannel] = useState(
    searchParams.get("channel_type") ?? ""
  );
  const [page, setPage] = useState(Number(searchParams.get("page") ?? "1"));

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (channel) params.set("channel_type", channel);
      params.set("page", String(page));
      params.set("limit", "25");

      const res = await fetch(`/api/conversations?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch conversations");
      const json = await res.json();
      setConversations(json.data ?? []);
      setPagination(
        json.pagination ?? { page: 1, limit: 25, total: 0, totalPages: 0 }
      );
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, channel, page]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Sync to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (channel) params.set("channel_type", channel);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace(`/conversations${qs ? `?${qs}` : ""}` as any, {
      scroll: false,
    });
  }, [search, status, channel, page, router]);

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handleStatus(val: string) {
    setStatus(val);
    setPage(1);
  }

  function handleChannel(val: string) {
    setChannel(val);
    setPage(1);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Conversations</h1>
            <p className="text-sm text-gray-500">
              {pagination.total} conversation
              {pagination.total !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search conversations..."
          className="w-full sm:w-72"
        />
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => handleStatus(e.target.value)}
          className="w-full sm:w-44"
        />
        <Select
          options={CHANNEL_OPTIONS}
          value={channel}
          onChange={(e) => handleChannel(e.target.value)}
          className="w-full sm:w-44"
        />
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm animate-pulse"
            >
              <div className="h-10 w-10 rounded-full bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 bg-gray-200 rounded" />
                <div className="h-3 w-64 bg-gray-200 rounded" />
              </div>
              <div className="h-5 w-5 rounded-full bg-gray-200" />
            </div>
          ))}
        </div>
      ) : conversations.length > 0 ? (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/conversations/${conv.id}` as never}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-blue-100 to-purple-100 text-blue-600 shrink-0">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-950 truncate">
                    {conv.contact?.name ?? "Unknown Contact"}
                  </p>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full shrink-0 ${
                      STATUS_COLORS[conv.status] ?? "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {conv.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate mt-0.5">
                  <span className="text-xs font-medium text-gray-400 mr-1">
                    {CHANNEL_LABELS[conv.channel_type] ?? conv.channel_type}
                  </span>
                  &middot; {conv.summary ?? "No messages yet"}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {(conv.unread_count ?? 0) > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                    {conv.unread_count}
                  </span>
                )}
                {conv.is_ai_active && (
                  <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                    AI
                  </span>
                )}
                {(() => {
                  const sla = getSlaInfo(conv.last_message_at);
                  return sla ? (
                    <p className={`text-xs ${sla.colorClass}`}>{sla.label}</p>
                  ) : null;
                })()}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <EmptyState
            icon={<MessageSquare className="h-10 w-10" />}
            title="No conversations found"
            description={
              search || status || channel
                ? "Try adjusting your filters."
                : "Conversations will appear here when leads message you."
            }
          />
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
