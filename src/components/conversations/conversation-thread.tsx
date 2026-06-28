"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Send, Bot, User, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useConversationStore } from "@/stores/conversation-store";
import { useRealtimeMessages } from "@/hooks/use-realtime-messages";
import { useToast } from "@/components/ui/toast";
import type { Message } from "@/types";

interface ConversationThreadProps {
  conversationId: string;
  initialMessages: Message[];
  contact: { name: string | null; email: string | null };
  channel: string;
  isAiEnabled: boolean;
}

function MessageBubble({ msg }: { msg: Message }) {
  const isOutbound = msg.direction === "outbound";
  const isAi = msg.sender_type === "ai";

  return (
    <div
      className={cn(
        "flex gap-2",
        isOutbound ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar for inbound */}
      {!isOutbound && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-200 text-gray-500 mt-1">
          <User className="h-4 w-4" />
        </div>
      )}

      <div className="flex flex-col gap-1 max-w-[70%]">
        <div
          className={cn(
            "rounded-2xl px-4 py-2 text-sm",
            isOutbound
              ? isAi
                ? "bg-purple-100 text-purple-900 rounded-br-sm"
                : "bg-blue-600 text-white rounded-br-sm"
              : "bg-gray-100 text-gray-900 rounded-bl-sm"
          )}
        >
          <p className="whitespace-pre-wrap break-words">{msg.content ?? ""}</p>
        </div>
        <p
          className={cn(
            "text-xs text-gray-400",
            isOutbound ? "text-right" : "text-left"
          )}
        >
          {isAi ? (
            <span className="inline-flex items-center gap-1">
              <Bot className="h-3 w-3" />
              AI
            </span>
          ) : isOutbound ? (
            "You"
          ) : null}
          {msg.created_at && (
            <span>
              {(isAi || isOutbound) && " · "}
              {formatDistanceToNow(new Date(msg.created_at), {
                addSuffix: true,
              })}
            </span>
          )}
        </p>
      </div>

      {/* Avatar for outbound */}
      {isOutbound && !isAi && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white mt-1">
          <User className="h-4 w-4" />
        </div>
      )}
      {isOutbound && isAi && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600 mt-1">
          <Bot className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

const CHANNEL_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  facebook: "Facebook",
  sms: "SMS",
  voice: "Voice",
  web_chat: "Web Chat",
};

export function ConversationThread({
  conversationId,
  initialMessages,
  contact,
  channel,
  isAiEnabled,
}: ConversationThreadProps) {
  const { messages, setMessages, setActiveConversation, addMessage } =
    useConversationStore();
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Initialise store once on mount
  useEffect(() => {
    setActiveConversation(conversationId);
    setMessages(initialMessages);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Subscribe to realtime inserts
  useRealtimeMessages(conversationId);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content || isSending) return;

    // Optimistic update — create a local message to show immediately
    const tempMessage: Message = {
      id: crypto.randomUUID(),
      user_id: "",
      conversation_id: conversationId,
      contact_id: "",
      direction: "outbound",
      sender_type: "human",
      content,
      content_type: "text",
      channel_type: channel,
      external_message_id: null,
      media_url: null,
      media_storage_path: null,
      ai_model: null,
      ai_confidence: null,
      ai_tokens_used: null,
      metadata: {},
      delivered_at: null,
      read_at: null,
      created_at: new Date().toISOString(),
    };

    addMessage(tempMessage);
    setText("");
    setIsSending(true);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, role: "user" }),
      });

      if (!res.ok) {
        const json = (await res.json()) as { error?: string };
        throw new Error(json.error ?? "Failed to send message");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send message";
      toast(message, "error");
      // Remove the optimistic message on failure
      setMessages(
        useConversationStore
          .getState()
          .messages.filter((m) => m.id !== tempMessage.id)
      );
    } finally {
      setIsSending(false);
    }
  }, [
    text,
    isSending,
    conversationId,
    channel,
    addMessage,
    setMessages,
    toast,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const channelLabel = CHANNEL_LABELS[channel] ?? channel;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b bg-white shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 shrink-0">
          <MessageCircle className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-gray-950 truncate">
            {contact.name ?? "Unknown"}
          </h2>
          {contact.email && (
            <p className="text-xs text-gray-500 truncate">{contact.email}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-medium">
            {channelLabel}
          </span>
          <span
            className={cn(
              "text-xs px-2 py-1 rounded-full font-medium",
              isAiEnabled
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            )}
          >
            {isAiEnabled ? "AI Active" : "Human Mode"}
          </span>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 ? (
          <p className="text-center text-gray-400 py-8 text-sm">
            No messages in this conversation yet.
          </p>
        ) : (
          messages.map((msg) => <MessageBubble key={msg.id} msg={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-4 py-3 border-t bg-white shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={2}
            disabled={isSending}
            className={cn(
              "flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm",
              "placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
              "disabled:bg-gray-50 disabled:opacity-60",
              "max-h-32 overflow-y-auto"
            )}
          />
          <button
            onClick={() => void handleSend()}
            disabled={!text.trim() || isSending}
            aria-label="Send message"
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors",
              "bg-blue-600 text-white hover:bg-blue-700",
              "disabled:opacity-40 disabled:cursor-not-allowed"
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
        <p className="mt-1.5 text-xs text-gray-400">
          Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
