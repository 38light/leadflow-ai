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
  canReply?: boolean;
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
  canReply = true,
}: ConversationThreadProps) {
  const { messages, setMessages, setActiveConversation, addMessage } =
    useConversationStore();
  const { toast } = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [aiActive, setAiActive] = useState(isAiEnabled);
  const [sendError, setSendError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState(false);
  const pendingRequest = useRef<{ id: string; content: string } | null>(null);
  const writable = canReply && channel === "web_chat";

  // Initialise store once on mount
  useEffect(() => {
    setActiveConversation(conversationId);
    setMessages(initialMessages);
    setAiActive(isAiEnabled);
    pendingRequest.current = null;
    setText("");
    setSendError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Subscribe to realtime inserts
  useRealtimeMessages(conversationId);

  // Polling also works when realtime is unavailable (including local dev auth).
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    async function refresh() {
      if (inFlight || document.visibilityState !== "visible") return;
      inFlight = true;
      try {
        const res = await fetch(`/api/conversations/${conversationId}/messages?limit=100&latest=true`, { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error("Unable to refresh messages");
        if (!cancelled && useConversationStore.getState().activeConversationId === conversationId) {
          const merged = new Map(useConversationStore.getState().messages.map(message => [message.id, message]));
          (json.data as Message[]).forEach(message => merged.set(message.id, message));
          setMessages([...merged.values()].sort((a, b) => a.created_at.localeCompare(b.created_at) || a.id.localeCompare(b.id)));
          setSyncError(false);
        }
      } catch { if (!cancelled) setSyncError(true); }
      finally { inFlight = false; }
    }
    const interval = window.setInterval(() => void refresh(), 5000);
    return () => { cancelled = true; window.clearInterval(interval); };
  }, [conversationId, setMessages]);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content || isSending || !writable) return;
    const pending = pendingRequest.current?.content === content ? pendingRequest.current : { id: crypto.randomUUID(), content };
    pendingRequest.current = pending;
    setSendError(null);
    setIsSending(true);

    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, client_message_id: pending.id }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to send message");
      }
      if (useConversationStore.getState().activeConversationId === conversationId) {
        addMessage(json.data as Message);
        setText("");
        setAiActive(false);
        pendingRequest.current = null;
      }
      toast("Reply available in the visitor's chat", "success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to send message";
      toast(message, "error");
      setSendError(message);
    } finally {
      setIsSending(false);
    }
  }, [
    text,
    isSending,
    conversationId,
    writable,
    addMessage,
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
              aiActive
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-600"
            )}
          >
            {aiActive ? "AI Active" : "Human Mode"}
          </span>
        </div>
      </div>

      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {syncError && <p role="status" className="text-sm text-amber-700">Live updates are delayed. Retrying automatically.</p>}
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
        {sendError && <p role="alert" className="mb-2 text-sm text-red-700">{sendError}</p>}
        {!writable && <p className="mb-2 text-sm text-gray-600">{canReply ? "Live replies are currently available for web chat only." : "You have read-only access to this conversation."}</p>}
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
            rows={2}
            disabled={isSending || !writable}
            maxLength={10000}
            className={cn(
              "flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm",
              "placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500",
              "disabled:bg-gray-50 disabled:opacity-60",
              "max-h-32 overflow-y-auto"
            )}
          />
          <button
            onClick={() => void handleSend()}
            disabled={!text.trim() || isSending || !writable}
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
          {isSending ? "Sending reply…" : "Sending a reply switches this conversation to human mode."}
        </p>
      </div>
    </div>
  );
}
