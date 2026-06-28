"use client";

import { useCallback } from "react";
import { useRealtime } from "./use-realtime";
import { useNotificationStore } from "@/stores/notification-store";
import type { Notification } from "@/types";

/**
 * Subscribe to realtime INSERT events on the notifications table for the
 * given userId and push new notifications into the Zustand store.
 */
export function useRealtimeNotifications(userId: string | null) {
  const addNotification = useNotificationStore((s) => s.addNotification);

  const handlePayload = useCallback(
    (payload: { new: Notification }) => {
      if (payload.new) {
        addNotification(payload.new);
      }
    },
    [addNotification]
  );

  useRealtime<Record<string, unknown>>({
    table: "notifications",
    event: "INSERT",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    onPayload: handlePayload as never,
  });
}
