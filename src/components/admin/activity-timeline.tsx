"use client";

import { useState, useEffect, useCallback } from "react";
import { UserPlus, MessageSquare, Calendar, Mail, Shield, Activity } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

interface ActivityEvent {
  id: string;
  action: string;
  label: string;
  created_at: string;
  icon_type: "contact" | "conversation" | "booking" | "message" | "admin";
}

interface ActivityTimelineProps {
  userId: string;
}

const ICON_MAP: Record<
  ActivityEvent["icon_type"],
  { icon: React.ElementType; bg: string; color: string }
> = {
  contact: { icon: UserPlus, bg: "bg-green-100", color: "text-green-600" },
  conversation: { icon: MessageSquare, bg: "bg-blue-100", color: "text-blue-600" },
  booking: { icon: Calendar, bg: "bg-purple-100", color: "text-purple-600" },
  message: { icon: Mail, bg: "bg-orange-100", color: "text-orange-600" },
  admin: { icon: Shield, bg: "bg-red-100", color: "text-red-600" },
};

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
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function ActivityTimeline({ userId }: ActivityTimelineProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchActivity = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/activity`);
      if (!res.ok) throw new Error("Failed to load activity");
      const { data } = await res.json();
      setEvents(data ?? []);
    } catch {
      toast("Failed to load activity timeline", "error");
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-3 items-start">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-1.5 pt-1">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Activity className="h-8 w-8 text-gray-300 mb-2" />
        <p className="text-sm text-gray-500">No activity recorded yet</p>
      </div>
    );
  }

  return (
    <ol className="relative space-y-0">
      {events.map((event, idx) => {
        const iconDef = ICON_MAP[event.icon_type] ?? ICON_MAP.admin;
        const IconComp = iconDef.icon;
        const isLast = idx === events.length - 1;

        return (
          <li key={event.id} className="flex gap-3">
            {/* Icon + vertical line */}
            <div className="flex flex-col items-center">
              <div
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${iconDef.bg}`}
              >
                <IconComp className={`h-4 w-4 ${iconDef.color}`} />
              </div>
              {!isLast && <div className="mt-1 w-px flex-1 bg-gray-200 min-h-[1.5rem]" />}
            </div>

            {/* Event details */}
            <div className={`flex-1 pb-4 min-w-0 pt-1 ${isLast ? "pb-0" : ""}`}>
              <p className="text-sm text-gray-800 leading-snug">{event.label}</p>
              <p className="mt-0.5 text-xs text-gray-400">{formatRelativeTime(event.created_at)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
