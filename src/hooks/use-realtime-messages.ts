"use client";

import { useCallback } from "react";
import { useRealtime } from "./use-realtime";
import { useConversationStore } from "@/stores/conversation-store";
import type { Message } from "@/types";

export function useRealtimeMessages(conversationId: string | null) {
  const addMessage = useConversationStore((s) => s.addMessage);

  const handlePayload = useCallback(
    (payload: { new: Message }) => {
      if (payload.new) {
        addMessage(payload.new);
      }
    },
    [addMessage]
  );

  useRealtime<Record<string, unknown>>({
    table: "messages",
    event: "INSERT",
    filter: conversationId ? `conversation_id=eq.${conversationId}` : undefined,
    onPayload: handlePayload as never,
  });
}
