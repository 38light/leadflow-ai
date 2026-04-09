"use client";

import { create } from "zustand";
import type { Message } from "@/types";

interface ConversationStore {
  activeConversationId: string | null;
  messages: Message[];
  isLoadingMessages: boolean;

  setActiveConversation: (id: string | null) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setLoadingMessages: (loading: boolean) => void;
  reset: () => void;
}

export const useConversationStore = create<ConversationStore>((set) => ({
  activeConversationId: null,
  messages: [],
  isLoadingMessages: false,

  setActiveConversation: (id) => set({ activeConversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),
  reset: () =>
    set({
      activeConversationId: null,
      messages: [],
      isLoadingMessages: false,
    }),
}));
