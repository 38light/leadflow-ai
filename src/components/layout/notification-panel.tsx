"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  MessageSquare,
  UserPlus,
  CalendarCheck,
  CalendarX,
  Info,
  CheckCheck,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { useNotificationStore } from "@/stores/notification-store";
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications";
import type { Notification, NotificationType } from "@/types";

// ─── Icon by notification type ───────────────────────────────────────────────

function NotificationIcon({ type }: { type: NotificationType }) {
  const base = "h-4 w-4 shrink-0";
  switch (type) {
    case "new_message":
      return <MessageSquare className={cn(base, "text-blue-500")} />;
    case "new_lead":
      return <UserPlus className={cn(base, "text-green-500")} />;
    case "booking_confirmed":
      return <CalendarCheck className={cn(base, "text-emerald-500")} />;
    case "booking_cancelled":
      return <CalendarX className={cn(base, "text-red-500")} />;
    case "system":
    default:
      return <Info className={cn(base, "text-gray-400")} />;
  }
}

// ─── Individual notification row ─────────────────────────────────────────────

function NotificationRow({
  notification,
  onClose,
}: {
  notification: Notification;
  onClose: () => void;
}) {
  const router = useRouter();
  const markRead = useNotificationStore((s) => s.markRead);

  async function handleClick() {
    if (!notification.read) {
      markRead(notification.id);
      // Persist to server (fire-and-forget; store is already updated optimistically)
      fetch("/api/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notification.id }),
      }).catch(() => {
        // Best-effort — don't throw on network failure
      });
    }
    onClose();
    if (notification.link) {
      router.push(notification.link as never);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50",
        !notification.read && "bg-blue-50 hover:bg-blue-50/80"
      )}
    >
      <div className="mt-0.5">
        <NotificationIcon type={notification.type} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-gray-900">
          {notification.title}
        </p>
        {notification.body && (
          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
            {notification.body}
          </p>
        )}
        <p className="mt-1 text-xs text-gray-400">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
          })}
        </p>
      </div>
      {!notification.read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
      )}
    </button>
  );
}

// ─── Main panel ──────────────────────────────────────────────────────────────

export function NotificationPanel({ userId }: { userId: string | null }) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, setNotifications, markAllRead } =
    useNotificationStore();

  // Subscribe to realtime inserts
  useRealtimeNotifications(userId);

  // Fetch initial notifications on mount
  useEffect(() => {
    fetch("/api/notifications?limit=20")
      .then((res) => res.json())
      .then((json: { data?: Notification[] }) => {
        if (json.data) {
          setNotifications(json.data);
        }
      })
      .catch(() => {
        // Silently ignore fetch errors — panel shows empty state
      });
  }, [setNotifications]);

  // Close panel on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = useCallback(async () => {
    markAllRead();
    fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    }).catch(() => {
      // Best-effort
    });
  }, [markAllRead]);

  return (
    <div ref={panelRef} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
        aria-label="Notifications"
        aria-expanded={open}
        aria-haspopup="true"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold leading-none text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-80 rounded-lg border border-gray-200 bg-white shadow-lg z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-900">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                <Bell className="h-8 w-8 text-gray-300" />
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onClose={() => setOpen(false)}
                />
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
