"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, X, Loader2, MessageCircle } from "lucide-react";

interface Message {
  id: string;
  content: string;
  direction: "inbound" | "outbound";
  createdAt: string;
  clientMessageId: string | null;
}
interface Cursor { createdAt: string; id: string }
interface SavedSession { sessionId: string; businessName: string; started: boolean; visitorName: string; visitorEmail: string }

export function ChatWidget({ businessId }: { businessId: string }) {
  const [session, setSession] = useState<SavedSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [initialising, setInitialising] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const cursorRef = useRef<Cursor | null>(null);
  const pollingRef = useRef(false);
  const activeSessionRef = useRef<string | null>(null);
  const requestRef = useRef<{ id: string; content: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const storageKey = `leadflow-chat:${businessId}`;

  const saveSession = useCallback((value: SavedSession) => {
    activeSessionRef.current = value.sessionId;
    setSession(value);
    try { localStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* Chat still works when browser storage is disabled. */ }
  }, [storageKey]);

  const startNewChat = useCallback(async () => {
    setInitialising(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/init", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Unable to start chat.");
      cursorRef.current = null;
      requestRef.current = null;
      setMessages([]);
      setNotice(null);
      setSyncError(null);
      setExpired(false);
      setInput("");
      saveSession({ sessionId: json.sessionId, businessName: json.businessName, started: false, visitorName: "", visitorEmail: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to connect. Please retry.");
    } finally { setInitialising(false); }
  }, [businessId, saveSession]);

  useEffect(() => {
    try {
      const stored: unknown = JSON.parse(localStorage.getItem(storageKey) ?? "null");
      if (stored && typeof stored === "object" && "sessionId" in stored && typeof stored.sessionId === "string"
        && /^[A-Za-z0-9_-]{43}$/.test(stored.sessionId) && "businessName" in stored && typeof stored.businessName === "string") {
        const saved = stored as SavedSession;
        activeSessionRef.current = saved.sessionId;
        setSession({ ...saved, started: saved.started === true, visitorName: typeof saved.visitorName === "string" ? saved.visitorName : "", visitorEmail: typeof saved.visitorEmail === "string" ? saved.visitorEmail : "" });
        setInitialising(false);
        return;
      }
    } catch { /* A fresh session is safe when storage is unavailable or stale. */ }
    void startNewChat();
  }, [storageKey, startNewChat]);

  const syncMessages = useCallback(async () => {
    if (!session || expired || pollingRef.current) return;
    pollingRef.current = true;
    try {
      for (let page = 0; page < 5; page++) {
        const res = await fetch("/api/chat/messages", {
          method: "POST", headers: { "Content-Type": "application/json" }, cache: "no-store",
          body: JSON.stringify({ businessId, sessionId: session.sessionId, cursor: cursorRef.current ?? undefined }),
        });
        const json = await res.json();
        if (activeSessionRef.current !== session.sessionId) return;
        if (res.status === 401) { setExpired(true); throw new Error("This chat session has expired. Start a new chat below."); }
        if (!res.ok) throw new Error(json.error ?? "Unable to check for replies.");
        const incoming = json.data.messages as Message[];
        setMessages(previous => {
          const byId = new Map(previous.map(message => [message.id, message]));
          incoming.forEach(message => byId.set(message.id, message));
          return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
        });
        if (incoming.some(message => message.direction === "outbound")) setNotice(null);
        cursorRef.current = json.data.nextCursor;
        setSyncError(null);
        if (!json.data.hasMore) break;
      }
    } catch (err) {
      setSyncError(err instanceof Error ? err.message : "Unable to check for replies. Retrying shortly.");
    } finally { pollingRef.current = false; }
  }, [session, expired, businessId]);

  useEffect(() => {
    void syncMessages();
    const interval = window.setInterval(() => { if (document.visibilityState === "visible") void syncMessages(); }, 3000);
    return () => window.clearInterval(interval);
  }, [syncMessages]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, notice]);

  function beginChat() {
    if (!session) return;
    saveSession({ ...session, visitorName: visitorName.trim(), visitorEmail: visitorEmail.trim(), started: true });
    inputRef.current?.focus();
  }

  async function sendMessage() {
    const content = input.trim();
    if (!session || !content || loading || expired) return;
    const pending = requestRef.current?.content === content ? requestRef.current : { id: crypto.randomUUID(), content };
    requestRef.current = pending;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat/message", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, sessionId: session.sessionId, clientMessageId: pending.id,
          content, senderName: session.visitorName || undefined, senderEmail: session.visitorEmail || undefined }),
      });
      const json = await res.json();
      if (res.status === 401) setExpired(true);
      if (!res.ok || !json.data?.accepted) throw new Error(json.error ?? "Unable to send your message. Retry to check delivery.");
      setInput("");
      requestRef.current = null;
      setNotice(json.data.status === "awaiting_reply" ? "Your message is received. A team member will reply here." : null);
      await syncMessages();
    } catch (err) {
      // Keep both the draft and its request ID; a retry can't create a duplicate.
      setError(err instanceof Error ? err.message : "Delivery could not be confirmed. Retry safely using Send.");
    } finally { setLoading(false); }
  }

  return (
    <div className="flex h-dvh flex-col bg-white font-sans">
      <div className="flex shrink-0 items-center justify-between bg-indigo-600 px-4 py-3 text-white">
        <div className="flex items-center gap-2.5"><MessageCircle className="h-5 w-5" /><div>
          <p className="text-sm font-semibold">{session?.businessName ?? "Chat support"}</p>
          <p className="text-xs text-indigo-100">Replies from our team and AI assistant</p>
        </div></div>
        <button onClick={() => window.parent.postMessage("lf:close", "*")} aria-label="Close chat" className="rounded-full p-2 hover:bg-white/20"><X className="h-4 w-4" /></button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50 px-4 py-4" aria-live="polite">
        {initialising && <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-indigo-500" aria-label="Starting chat" /></div>}
        {!initialising && session && !session.started && !expired && <form onSubmit={event => { event.preventDefault(); beginChat(); }} className="space-y-3 rounded-xl border bg-white p-4">
          <p className="text-sm font-medium">How can we help? Your details are optional.</p>
          <label className="block text-xs text-gray-600">Name<input value={visitorName} onChange={event => setVisitorName(event.target.value)} maxLength={100} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></label>
          <label className="block text-xs text-gray-600">Email<input type="email" value={visitorEmail} onChange={event => setVisitorEmail(event.target.value)} maxLength={254} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" /></label>
          <button type="submit" className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white">Start chat</button>
        </form>}
        {session?.started && messages.length === 0 && !initialising && <p className="rounded-xl border bg-white p-4 text-sm text-gray-700">Welcome to {session.businessName}. Send a message to get started.</p>}
        {messages.map(message => <div key={message.id} className={`flex ${message.direction === "inbound" ? "justify-end" : "justify-start"}`}>
          <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${message.direction === "inbound" ? "rounded-br-sm bg-indigo-600 text-white" : "rounded-bl-sm border bg-white text-gray-800"}`}>
            <p className="whitespace-pre-wrap break-words">{message.content}</p>
            <p className={`mt-1 text-xs ${message.direction === "inbound" ? "text-indigo-100" : "text-gray-500"}`}>{new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
          </div>
        </div>)}
        {loading && <p className="flex items-center gap-2 text-xs text-gray-600"><Loader2 className="h-4 w-4 animate-spin" />Sending your message…</p>}
        {notice && <p className="text-sm text-gray-600">{notice}</p>}
        {(error || syncError) && <p role="alert" className="text-sm text-red-700">{error ?? syncError}</p>}
        {!initialising && (!session || expired) && <button onClick={() => void startNewChat()} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white">Start a new chat</button>}
        <div ref={bottomRef} />
      </div>
      {session?.started && !expired && <div className="shrink-0 border-t bg-white p-3">
        <div className="flex items-end gap-2">
          <textarea ref={inputRef} aria-label="Your message" value={input} onChange={event => setInput(event.target.value)}
            onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }}
            placeholder="Type a message…" rows={2} maxLength={5000} disabled={loading}
            className="min-w-0 flex-1 resize-none rounded-xl border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-60" />
          <button onClick={() => void sendMessage()} disabled={!input.trim() || loading} aria-label="Send message" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white disabled:opacity-40"><Send className="h-4 w-4" /></button>
        </div>
        <p className="mt-2 text-center text-xs text-gray-500">Powered by LeadFlow AI</p>
      </div>}
    </div>
  );
}
