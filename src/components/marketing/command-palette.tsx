"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Brain,
  Calendar,
  CreditCard,
  Globe,
  Home,
  Instagram,
  MessageSquare,
  Phone,
  Search,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Cmd = {
  id: string;
  label: string;
  hint?: string;
  group: "navigate" | "try" | "ai";
  Icon: React.ComponentType<{ className?: string }>;
  action: () => void;
};

const aiAnswers: Record<string, string> = {
  default:
    "I'm the LeadFlow AI. I handle WhatsApp, Instagram, SMS, Voice and Web Chat messages for you — 24/7. Try asking about pricing or booking.",
  pricing:
    "Starter $49/mo, Pro $149/mo, Enterprise custom. 20% off annual. All plans include 14-day free trial, no credit card.",
  book:
    "Yes — I can check your calendar, propose slots, send a deposit link, and confirm the booking. The lead never leaves the chat.",
  whatsapp:
    "Native WhatsApp Business API integration. Inbound messages hit the AI within 8s. Outbound replies sent from your verified number.",
  integrations:
    "WhatsApp, Instagram, SMS (Twilio), Voice (Vapi), Web Chat widget. Plus HubSpot, Stripe, Google Calendar, Resend, Slack.",
  demo: "Hit the 'Try the AI' button on the hero — you can roleplay as a lead and the real AI replies in-context.",
};

function matchAnswer(q: string): string {
  const lower = q.toLowerCase();
  for (const key of Object.keys(aiAnswers)) {
    if (key !== "default" && lower.includes(key)) return aiAnswers[key];
  }
  return aiAnswers.default;
}

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [aiThinking, setAiThinking] = useState(false);
  const [aiReply, setAiReply] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setAiReply("");
      setAiThinking(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  const commands: Cmd[] = [
    { id: "home", label: "Home", hint: "/", group: "navigate", Icon: Home, action: () => router.push("/") },
    { id: "features", label: "Features", hint: "/features", group: "navigate", Icon: Sparkles, action: () => router.push("/features") },
    { id: "pricing", label: "Pricing", hint: "/pricing", group: "navigate", Icon: CreditCard, action: () => router.push("/pricing") },
    { id: "integrations", label: "Integrations", hint: "/integrations", group: "navigate", Icon: Globe, action: () => router.push("/integrations") },
    { id: "compare", label: "Compare to others", hint: "/compare", group: "navigate", Icon: ArrowRight, action: () => router.push("/compare") },
    { id: "demo", label: "Try the AI live", hint: "real Claude roleplay", group: "try", Icon: Brain, action: () => router.push("/demo") },
    { id: "book-demo", label: "Book a demo call", hint: "15 min slot", group: "try", Icon: Calendar, action: () => router.push("/contact") },
    { id: "whatsapp", label: "See WhatsApp playbook", hint: "flows + template", group: "try", Icon: MessageSquare, action: () => router.push("/solutions/marriage-celebrants") },
    { id: "voice", label: "Voice agent example", hint: "transcribed call", group: "try", Icon: Phone, action: () => router.push("/features") },
    { id: "ig", label: "Instagram DM flow", hint: "auto-qualify", group: "try", Icon: Instagram, action: () => router.push("/solutions/driving-instructors") },
  ];

  const filtered = query
    ? commands.filter(
        (c) =>
          c.label.toLowerCase().includes(query.toLowerCase()) ||
          c.hint?.toLowerCase().includes(query.toLowerCase())
      )
    : commands;

  function runAI() {
    if (!query.trim()) return;
    setAiThinking(true);
    setAiReply("");
    const answer = matchAnswer(query);
    setTimeout(() => {
      setAiThinking(false);
      let i = 0;
      function step() {
        i += 1;
        setAiReply(answer.slice(0, i));
        if (i < answer.length) setTimeout(step, 18);
      }
      step();
    }, 700);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (filtered.length > 0) {
      filtered[0].action();
      setOpen(false);
    } else {
      runAI();
    }
  }

  return (
    <>
      {/* Floating trigger button — bottom right */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 hidden items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-4 py-2.5 text-xs font-medium text-slate-200 shadow-xl backdrop-blur-md transition hover:border-cyan-400/40 hover:text-white lg:flex"
        aria-label="Open command palette"
      >
        <Search className="h-3.5 w-3.5 text-cyan-400" />
        Search or ask AI
        <kbd className="ml-2 rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
          ⌘K
        </kbd>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center bg-slate-950/70 p-4 pt-24 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl animate-zoom-in"
            onClick={(e) => e.stopPropagation()}
          >
            <form
              onSubmit={onSubmit}
              className="flex items-center gap-3 border-b border-white/10 px-5 py-4"
            >
              <Search className="h-4 w-4 text-cyan-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search pages, or ask the AI anything…"
                className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
              />
              <kbd className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                ESC
              </kbd>
            </form>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {(["navigate", "try"] as const).map((group) => {
                const items = filtered.filter((c) => c.group === group);
                if (items.length === 0) return null;
                return (
                  <div key={group} className="mb-2">
                    <div className="px-3 pb-1 pt-2 font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      {group === "navigate" ? "Navigate" : "Try it"}
                    </div>
                    {items.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          c.action();
                          setOpen(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-200 transition hover:bg-white/5 hover:text-white"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-white/5 text-cyan-400">
                          <c.Icon className="h-3.5 w-3.5" />
                        </div>
                        <span className="flex-1">{c.label}</span>
                        {c.hint && (
                          <span className="font-mono text-[11px] text-slate-500">{c.hint}</span>
                        )}
                      </button>
                    ))}
                  </div>
                );
              })}

              {filtered.length === 0 && query && (
                <div className="p-4">
                  <button
                    onClick={runAI}
                    className="flex w-full items-center gap-3 rounded-lg border border-cyan-400/20 bg-cyan-950/30 px-4 py-3 text-left text-sm text-cyan-100 transition hover:border-cyan-400/50"
                  >
                    <Brain className="h-4 w-4 text-cyan-400" />
                    Ask the AI: <span className="font-medium text-white">&ldquo;{query}&rdquo;</span>
                  </button>
                </div>
              )}

              {(aiThinking || aiReply) && (
                <div className="mx-2 mt-2 rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-950/40 to-cyan-950/40 p-4">
                  <div className="mb-2 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-violet-300">
                    <Zap className="h-3 w-3" /> AI response
                  </div>
                  {aiThinking ? (
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400 [animation-delay:300ms]" />
                    </div>
                  ) : (
                    <p className="text-sm leading-relaxed text-slate-200">
                      {aiReply}
                      <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-cyan-400 align-middle" />
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-white/10 bg-slate-950/40 px-5 py-2.5 text-[10px] font-mono text-slate-500">
              <div className="flex items-center gap-3">
                <span>↵ select</span>
                <span>↑↓ navigate</span>
              </div>
              <div className={cn("flex items-center gap-1.5")}>
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                AI online
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
