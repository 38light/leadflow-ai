"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, X, Loader2, MessageCircle } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
  timestamp: Date;
}

interface ChatWidgetProps {
  businessId: string;
}

interface InitResponse {
  sessionId: string;
  businessName: string;
}

interface MessageApiResponse {
  data?: { message: string; isOptOut?: boolean };
  error?: string;
}

function generateId() {
  return Math.random().toString(36).slice(2, 11);
}

export function ChatWidget({ businessId }: ChatWidgetProps) {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("Chat Support");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialising, setInitialising] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Visitor identity (pre-chat form)
  const [showPreChat, setShowPreChat] = useState(false);
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [preChatSubmitted, setPreChatSubmitted] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initialise session
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/chat/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessId }),
        });
        const json = (await res.json()) as InitResponse;
        if (!res.ok) throw new Error("Failed to start chat");
        setSessionId(json.sessionId);
        setBusinessName(json.businessName);
        setShowPreChat(true);
      } catch {
        setError("Couldn't connect. Please try again.");
      } finally {
        setInitialising(false);
      }
    }
    init();
  }, [businessId]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleClose() {
    window.parent.postMessage("lf:close", "*");
  }

  function handlePreChatSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPreChatSubmitted(true);
    setShowPreChat(false);
    // Add greeting
    setMessages([
      {
        id: generateId(),
        role: "ai",
        content: `Hi${visitorName ? ` ${visitorName}` : ""}! Welcome to ${businessName}. How can I help you today?`,
        timestamp: new Date(),
      },
    ]);
    inputRef.current?.focus();
  }

  const sendMessage = useCallback(
    async (text: string) => {
      if (!sessionId || !text.trim() || loading) return;

      const userMessage: Message = {
        id: generateId(),
        role: "user",
        content: text.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/chat/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            content: text.trim(),
            businessId,
            senderName: visitorName || undefined,
            senderEmail: visitorEmail || undefined,
          }),
        });

        const json = (await res.json()) as MessageApiResponse;

        if (!res.ok || !json.data) {
          throw new Error(json.error ?? "Failed to send message");
        }

        const aiMessage: Message = {
          id: generateId(),
          role: "ai",
          content: json.data.message,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, aiMessage]);
      } catch {
        setError("Message failed. Please try again.");
        // Remove optimistic user message on error
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      } finally {
        setLoading(false);
      }
    },
    [sessionId, loading, businessId, visitorName, visitorEmail]
  );

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function formatTime(date: Date) {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div className="flex flex-col h-screen bg-white font-sans">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
            <MessageCircle className="h-4 w-4" />
          </div>
          <div>
            <p className="font-semibold text-sm leading-tight">{businessName}</p>
            <p className="text-xs text-indigo-200">Typically replies instantly</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Close chat"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-50">
        {initialising && (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
          </div>
        )}

        {/* Pre-chat form */}
        {showPreChat && !initialising && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Before we start — tell us a bit about you (optional):
            </p>
            <form onSubmit={handlePreChatSubmit} className="space-y-2">
              <input
                type="text"
                placeholder="Your name"
                value={visitorName}
                onChange={(e) => setVisitorName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <input
                type="email"
                placeholder="Email address"
                value={visitorEmail}
                onChange={(e) => setVisitorEmail(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              <button
                type="submit"
                className="w-full rounded-lg bg-indigo-600 text-white py-2 text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Start Chat
              </button>
              <button
                type="button"
                onClick={() => {
                  setPreChatSubmitted(true);
                  setShowPreChat(false);
                  setMessages([
                    {
                      id: generateId(),
                      role: "ai",
                      content: `Welcome to ${businessName}! How can I help you today?`,
                      timestamp: new Date(),
                    },
                  ]);
                }}
                className="w-full text-xs text-gray-400 hover:text-gray-600 py-1"
              >
                Skip
              </button>
            </form>
          </div>
        )}

        {/* Messages */}
        {preChatSubmitted &&
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-indigo-600 text-white rounded-br-sm"
                    : "bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.role === "user" ? "text-indigo-200" : "text-gray-400"
                  }`}
                >
                  {formatTime(msg.timestamp)}
                </p>
              </div>
            </div>
          ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-xs text-red-500">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {preChatSubmitted && (
        <div className="px-3 py-3 border-t border-gray-100 bg-white shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message…"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 max-h-32 overflow-y-auto"
              style={{ minHeight: "42px" }}
              disabled={loading}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || loading}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-300 mt-2">Powered by LeadFlow AI</p>
        </div>
      )}
    </div>
  );
}
