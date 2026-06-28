"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { formatDistanceToNow } from "date-fns";
import {
  Activity,
  Calendar,
  MessageCircle,
  UserCheck,
  UserPlus,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  ActivityEvent,
  ActivityEventType,
  ActivityResponse,
} from "@/app/api/dashboard/activity/route";

interface ActivityFeedProps {
  ownerId: string;
}

interface ContactInsertPayload {
  id: string;
  name: string | null;
  source_channel: string | null;
  created_at: string;
  user_id: string;
}

interface MessageInsertPayload {
  id: string;
  conversation_id: string;
  contact_id: string | null;
  content: string | null;
  channel_type: string | null;
  direction: string;
  created_at: string;
  user_id: string;
}

interface BookingInsertPayload {
  id: string;
  client_name: string;
  contact_id: string | null;
  booking_date: string;
  start_time: string;
  created_at: string;
  user_id: string;
}

const MAX_EVENTS = 20;

const TYPE_STYLES: Record<
  ActivityEventType,
  { icon: typeof UserPlus; bg: string; fg: string }
> = {
  contact_created: {
    icon: UserPlus,
    bg: "bg-blue-100",
    fg: "text-blue-600",
  },
  message_received: {
    icon: MessageCircle,
    bg: "bg-emerald-100",
    fg: "text-emerald-600",
  },
  booking_created: {
    icon: Calendar,
    bg: "bg-purple-100",
    fg: "text-purple-600",
  },
  ai_handoff: {
    icon: UserCheck,
    bg: "bg-amber-100",
    fg: "text-amber-600",
  },
};

function getRelativeTime(ts: string): string {
  try {
    const delta = Date.now() - new Date(ts).getTime();
    if (delta < 45_000) return "just now";
    return formatDistanceToNow(new Date(ts), { addSuffix: true });
  } catch {
    return "";
  }
}

function EventIcon({ type }: { type: ActivityEventType }) {
  const { icon: Icon, bg, fg } = TYPE_STYLES[type];
  return (
    <span
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        bg
      )}
    >
      <Icon className={cn("h-4 w-4", fg)} />
    </span>
  );
}

export function ActivityFeed({ ownerId }: ActivityFeedProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const ownerIdRef = useRef(ownerId);

  useEffect(() => {
    ownerIdRef.current = ownerId;
  }, [ownerId]);

  // Prepend a new event, dedupe by id, trim to MAX_EVENTS.
  const prependEvent = useCallback((ev: ActivityEvent) => {
    let inserted = false;
    setEvents((prev) => {
      if (prev.some((p) => p.id === ev.id)) return prev;
      inserted = true;
      return [ev, ...prev].slice(0, MAX_EVENTS);
    });
    if (!inserted) return;
    // Mark as "new" so it mounts in the pre-animation state, then flip on
    // the next frame so the transition plays.
    setNewIds((prev) => {
      const next = new Set(prev);
      next.add(ev.id);
      return next;
    });
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        setNewIds((prev) => {
          if (!prev.has(ev.id)) return prev;
          const next = new Set(prev);
          next.delete(ev.id);
          return next;
        });
      });
    });
  }, []);

  // Initial load.
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/dashboard/activity?limit=20", {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json: ActivityResponse = await res.json();
        if (!cancelled) {
          setEvents(json.data ?? []);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Realtime subscriptions (INSERT only, filtered by user_id).
  useEffect(() => {
    if (!ownerId) return;
    const supabase = createClient();
    const channel = supabase.channel(`dashboard-activity-${ownerId}`);

    channel
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "contacts",
          filter: `user_id=eq.${ownerId}`,
        } as never,
        ((payload: { new: ContactInsertPayload }) => {
          const row = payload.new;
          if (!row) return;
          prependEvent({
            id: `contact:${row.id}`,
            type: "contact_created",
            timestamp: row.created_at,
            primaryText: `${row.name ?? "New contact"} added`,
            secondaryText: row.source_channel
              ? `via ${row.source_channel}`
              : null,
            href: `/contacts/${row.id}`,
            contactId: row.id,
            conversationId: null,
          });
        }) as never
      )
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `user_id=eq.${ownerId}`,
        } as never,
        ((payload: { new: MessageInsertPayload }) => {
          const row = payload.new;
          if (!row || row.direction !== "inbound") return;
          const snippet = (row.content ?? "").trim().slice(0, 60);
          prependEvent({
            id: `message:${row.id}`,
            type: "message_received",
            timestamp: row.created_at,
            primaryText: "New inbound message",
            secondaryText: snippet
              ? `${row.channel_type ?? "message"} \u2022 ${snippet}`
              : row.channel_type,
            href: `/conversations/${row.conversation_id}`,
            contactId: row.contact_id,
            conversationId: row.conversation_id,
          });
        }) as never
      )
      .on(
        "postgres_changes" as never,
        {
          event: "INSERT",
          schema: "public",
          table: "bookings",
          filter: `user_id=eq.${ownerId}`,
        } as never,
        ((payload: { new: BookingInsertPayload }) => {
          const row = payload.new;
          if (!row) return;
          prependEvent({
            id: `booking:${row.id}`,
            type: "booking_created",
            timestamp: row.created_at,
            primaryText: `${row.client_name} booked an appointment`,
            secondaryText: `${row.booking_date} at ${row.start_time}`,
            href: row.contact_id ? `/contacts/${row.contact_id}` : `/bookings`,
            contactId: row.contact_id,
            conversationId: null,
          });
        }) as never
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [ownerId, prependEvent]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span>Live Activity</span>
          <span className="relative inline-flex h-2.5 w-2.5" aria-label="Live">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-green-500" />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-3 w-16 shrink-0" />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
              <Activity className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-sm text-gray-500">No activity yet.</p>
            <p className="mt-1 text-xs text-gray-400">
              Events will appear here in realtime as they happen.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {events.map((ev) => {
              const isNew = newIds.has(ev.id);
              return (
                <li
                  key={ev.id}
                  className={cn(
                    "transition-all duration-500 ease-out",
                    isNew
                      ? "-translate-y-2 opacity-0"
                      : "translate-y-0 opacity-100"
                  )}
                >
                  <Link
                    href={ev.href as Route}
                    className="flex items-start gap-3 rounded-md p-2 -m-2 hover:bg-gray-50 transition-colors"
                  >
                    <EventIcon type={ev.type} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {ev.primaryText}
                      </p>
                      {ev.secondaryText ? (
                        <p className="mt-0.5 truncate text-xs text-gray-500">
                          {ev.secondaryText}
                        </p>
                      ) : null}
                    </div>
                    <time className="shrink-0 whitespace-nowrap text-xs text-gray-400">
                      {getRelativeTime(ev.timestamp)}
                    </time>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
