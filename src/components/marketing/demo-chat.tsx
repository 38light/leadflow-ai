"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  Briefcase,
  Camera,
  Car,
  CheckCheck,
  Heart,
  RotateCcw,
  Send,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Scenario = "celebrant" | "driving" | "photography";

type Msg = {
  role: "user" | "assistant";
  content: string;
  at: number;
};

const SCENARIOS: Record<
  Scenario,
  {
    label: string;
    business: string;
    Icon: React.ComponentType<{ className?: string }>;
    accent: string;
    greeting: string;
    suggestions: string[];
  }
> = {
  celebrant: {
    label: "Marriage Celebrant",
    business: "Sarah's AI · Marriage Celebrant",
    Icon: Heart,
    accent: "from-fuchsia-400 to-pink-500",
    greeting:
      "Hi there! I'm Sarah's AI assistant — she's a Sydney-based marriage celebrant. What date are you thinking, and where will it be?",
    suggestions: [
      "Hi, are you free Oct 12 2026 in Sydney?",
      "What's included in the 'Love Story' package?",
      "How much is the deposit?",
    ],
  },
  driving: {
    label: "Driving Instructor",
    business: "Drive-Safe Academy AI",
    Icon: Car,
    accent: "from-blue-400 to-indigo-500",
    greeting:
      "G'day! I'm the Drive-Safe AI. Are you after beginner lessons or getting ready for the test? And what area do you live in?",
    suggestions: [
      "How much for 10 beginner lessons?",
      "I live in the Inner West, Saturdays preferred.",
      "Can I book a female instructor?",
    ],
  },
  photography: {
    label: "Photographer",
    business: "Northside Photography AI",
    Icon: Camera,
    accent: "from-amber-400 to-orange-500",
    greeting:
      "Hi! I'm James's AI — Sydney North Shore photographer. What kind of shoot are you planning and when?",
    suggestions: [
      "Need a photographer for a corporate event Nov 3.",
      "How much for a half-day corporate shoot?",
      "Do you do headshots for a team of 12?",
    ],
  },
};

function makeSessionId(): string {
  return (
    Math.random().toString(36).slice(2, 10) +
    Math.random().toString(36).slice(2, 10)
  );
}

export function DemoChat() {
  const [scenario, setScenario] = useState<Scenario>("celebrant");
  const [sessionId, setSessionId] = useState<string>("");
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSessionId(makeSessionId());
    setMessages([
      { role: "assistant", content: SCENARIOS[scenario].greeting, at: Date.now() },
    ]);
  }, [scenario]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);

  function resetChat() {
    setSessionId(makeSessionId());
    setMessages([
      { role: "assistant", content: SCENARIOS[scenario].greeting, at: Date.now() },
    ]);
    setInput("");
    setError(null);
    setRemaining(null);
    setLatency(null);
  }

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    setError(null);

    const userMsg: Msg = { role: "user", content: trimmed, at: Date.now() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/demo/message", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          sessionId,
          scenario,
          history: next.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = (await res.json()) as
        | { reply: string; latencyMs: number; remaining: number }
        | { error: string; remaining?: number };

      if (!res.ok || "error" in data) {
        setError("error" in data ? data.error : "Something went wrong.");
        if ("remaining" in data && typeof data.remaining === "number") {
          setRemaining(data.remaining);
        }
        return;
      }

      setMessages((m) => [
        ...m,
        { role: "assistant", content: data.reply, at: Date.now() },
      ]);
      setRemaining(data.remaining);
      setLatency(data.latencyMs);
    } catch {
      setError("Couldn't reach the AI. Try again.");
    } finally {
      setSending(false);
    }
  }

  const Icon = SCENARIOS[scenario].Icon;
  const capReached = remaining !== null && remaining <= 0;

  return (
    <div className="space-y-5">
      {/* Scenario chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
          Scenario
        </span>
        {(Object.keys(SCENARIOS) as Scenario[]).map((s) => {
          const SIcon = SCENARIOS[s].Icon;
          const active = s === scenario;
          return (
            <button
              key={s}
              onClick={() => setScenario(s)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition",
                active
                  ? "border-cyan-400/60 bg-cyan-950/60 text-cyan-200 shadow-[0_0_30px_-8px_rgba(34,211,238,0.5)]"
                  : "border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:text-white"
              )}
            >
              <SIcon className="h-3.5 w-3.5" />
              {SCENARIOS[s].label}
            </button>
          );
        })}
      </div>

      {/* Chat card */}
      <div className="relative">
        <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-cyan-500/15 via-violet-500/15 to-fuchsia-500/15 opacity-70 blur-2xl" />
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/50 px-5 py-3">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-white shadow",
                  SCENARIOS[scenario].accent
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  {SCENARIOS[scenario].business}
                </p>
                <p className="text-[11px] text-slate-400">
                  Powered by Claude · you roleplay as the lead
                </p>
              </div>
            </div>
            <button
              onClick={resetChat}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-300 transition hover:border-white/30 hover:text-white"
            >
              <RotateCcw className="h-3 w-3" />
              Reset
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="h-[420px] space-y-3 overflow-y-auto p-5 scroll-smooth"
          >
            {messages.map((m, i) => (
              <Bubble key={i} msg={m} />
            ))}
            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-white/10 px-4 py-3 backdrop-blur">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}
            {error && (
              <div className="rounded-lg border border-rose-400/30 bg-rose-950/40 px-3 py-2 text-xs text-rose-300">
                {error}
              </div>
            )}
          </div>

          {/* Suggestion chips */}
          {messages.length <= 1 && !capReached && (
            <div className="flex flex-wrap gap-2 border-t border-white/10 bg-slate-950/30 px-5 py-3">
              <span className="mr-1 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                Try
              </span>
              {SCENARIOS[scenario].suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  disabled={sending}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300 transition hover:border-cyan-400/40 hover:text-white disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <form
            className="flex items-center gap-2 border-t border-white/10 bg-slate-950/50 px-3 py-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                capReached
                  ? "Session cap reached — sign up for the real thing →"
                  : "Type as the lead…"
              }
              disabled={sending || capReached}
              maxLength={500}
              className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400/40 focus:outline-none disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || capReached || !input.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_0_30px_-8px_rgba(139,92,246,0.6)] transition hover:shadow-[0_0_40px_-4px_rgba(139,92,246,0.8)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </button>
          </form>

          {/* Status bar */}
          <div className="flex items-center justify-between border-t border-white/10 bg-slate-950/60 px-5 py-2 text-[11px] text-slate-500">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
                </span>
                live
              </span>
              {latency !== null && (
                <span className="font-mono">
                  latency <span className="text-cyan-400">{(latency / 1000).toFixed(1)}s</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono">
                messages left{" "}
                <span className={cn(capReached ? "text-rose-400" : "text-cyan-400")}>
                  {remaining ?? "—"}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
        <p className="flex items-center gap-2 text-sm text-slate-300">
          <Brain className="h-4 w-4 text-cyan-400" />
          Impressed? This is the same engine running across all your channels.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          <Briefcase className="h-3.5 w-3.5" />
          Start free trial
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}

function Bubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <div
      className={cn(
        "flex animate-slide-up",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          isUser
            ? "rounded-tr-sm bg-gradient-to-br from-cyan-500 to-violet-600 text-white"
            : "rounded-tl-sm bg-white/10 text-slate-100 backdrop-blur"
        )}
      >
        {msg.content}
        {isUser && (
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/70">
            <CheckCheck className="h-3 w-3" /> sent
          </div>
        )}
      </div>
    </div>
  );
}
