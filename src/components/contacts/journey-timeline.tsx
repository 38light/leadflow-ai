"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  MessageCircle,
  Send,
  Brain,
  User,
  ArrowRight,
  Calendar,
  CheckCircle,
  UserCheck,
  UserPlus,
  Activity,
} from "lucide-react";
import type { ComponentType, SVGProps } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

export type JourneyEventType =
  | "message_in"
  | "message_out"
  | "ai_reply"
  | "human_reply"
  | "status_change"
  | "booking_created"
  | "booking_completed"
  | "ai_handoff"
  | "contact_created";

export interface JourneyEvent {
  id: string;
  type: JourneyEventType;
  timestamp: string;
  title: string;
  preview?: string;
  channel?: string;
  metadata?: Record<string, unknown>;
}

interface JourneyTimelineProps {
  contactId: string;
}

type IconStyle = {
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  bg: string;
  color: string;
  label: string;
};

const TYPE_STYLES: Record<JourneyEventType, IconStyle> = {
  message_in: {
    icon: MessageCircle,
    bg: "bg-blue-100",
    color: "text-blue-600",
    label: "Inbound",
  },
  message_out: {
    icon: Send,
    bg: "bg-sky-100",
    color: "text-sky-600",
    label: "Outbound",
  },
  ai_reply: {
    icon: Brain,
    bg: "bg-purple-100",
    color: "text-purple-600",
    label: "AI Reply",
  },
  human_reply: {
    icon: User,
    bg: "bg-green-100",
    color: "text-green-600",
    label: "Human Reply",
  },
  status_change: {
    icon: ArrowRight,
    bg: "bg-gray-100",
    color: "text-gray-600",
    label: "Status",
  },
  booking_created: {
    icon: Calendar,
    bg: "bg-orange-100",
    color: "text-orange-600",
    label: "Booking",
  },
  booking_completed: {
    icon: CheckCircle,
    bg: "bg-green-100",
    color: "text-green-700",
    label: "Completed",
  },
  ai_handoff: {
    icon: UserCheck,
    bg: "bg-yellow-100",
    color: "text-yellow-700",
    label: "Handoff",
  },
  contact_created: {
    icon: UserPlus,
    bg: "bg-slate-100",
    color: "text-slate-600",
    label: "Created",
  },
};

const FILTER_ORDER: JourneyEventType[] = [
  "message_in",
  "message_out",
  "ai_reply",
  "human_reply",
  "status_change",
  "booking_created",
  "booking_completed",
  "ai_handoff",
  "contact_created",
];

const PAGE_SIZE = 50;

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function JourneyTimeline({ contactId }: JourneyTimelineProps) {
  const { toast } = useToast();
  const [events, setEvents] = useState<JourneyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hiddenTypes, setHiddenTypes] = useState<Set<JourneyEventType>>(
    new Set()
  );

  const fetchPage = useCallback(
    async (nextOffset: number, append: boolean) => {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      try {
        const res = await fetch(
          `/api/contacts/${contactId}/journey?limit=${PAGE_SIZE}&offset=${nextOffset}`
        );
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error ?? "Failed to load journey");
        }
        const json = (await res.json()) as {
          data: JourneyEvent[];
          pagination: { total: number; hasMore: boolean };
        };
        setEvents((prev) =>
          append ? [...prev, ...(json.data ?? [])] : json.data ?? []
        );
        setHasMore(json.pagination?.hasMore ?? false);
        setOffset(nextOffset + (json.data?.length ?? 0));
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to load journey";
        toast(msg, "error");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [contactId, toast]
  );

  useEffect(() => {
    void fetchPage(0, false);
  }, [fetchPage]);

  const toggleType = useCallback((type: JourneyEventType) => {
    setHiddenTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }, []);

  const visibleEvents = useMemo(
    () => events.filter((e) => !hiddenTypes.has(e.type)),
    [events, hiddenTypes]
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-3 items-start">
            <Skeleton className="h-9 w-9 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5 pt-1">
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Activity className="h-8 w-8 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">No journey events yet</p>
      </div>
    );
  }

  return (
    <div>
      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FILTER_ORDER.map((type) => {
          const style = TYPE_STYLES[type];
          const Icon = style.icon;
          const hidden = hiddenTypes.has(type);
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                hidden
                  ? "border-gray-200 bg-white text-gray-400 hover:text-gray-600"
                  : "border-gray-300 bg-gray-50 text-gray-800 hover:bg-gray-100"
              }`}
              aria-pressed={!hidden}
            >
              <Icon className={`h-3.5 w-3.5 ${hidden ? "" : style.color}`} />
              {style.label}
            </button>
          );
        })}
      </div>

      {visibleEvents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Activity className="h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">
            No events match the selected filters
          </p>
        </div>
      ) : (
        <ol className="relative">
          {visibleEvents.map((event, idx) => {
            const style = TYPE_STYLES[event.type];
            const Icon = style.icon;
            const isLast = idx === visibleEvents.length - 1;
            return (
              <li key={event.id} className="flex gap-3">
                {/* Icon + connector */}
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${style.bg}`}
                  >
                    <Icon className={`h-4 w-4 ${style.color}`} />
                  </div>
                  {!isLast && (
                    <div className="mt-1 w-px flex-1 bg-gray-200 min-h-[1.75rem]" />
                  )}
                </div>
                {/* Content */}
                <div
                  className={`flex-1 min-w-0 pt-1 ${isLast ? "pb-0" : "pb-5"}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {event.title}
                    </p>
                    <span className="text-xs text-gray-400 shrink-0">
                      {formatRelativeTime(event.timestamp)}
                    </span>
                  </div>
                  {event.preview && (
                    <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap break-words">
                      {event.preview}
                    </p>
                  )}
                  {event.channel && (
                    <p className="mt-0.5 text-xs text-gray-400">
                      Channel: {event.channel}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {hasMore && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            size="sm"
            loading={loadingMore}
            onClick={() => void fetchPage(offset, true)}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
