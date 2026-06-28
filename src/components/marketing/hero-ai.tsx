"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  MessageSquare,
  Phone,
  Instagram,
  Sparkles,
  CheckCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Sender = "lead" | "ai";
type ChatMsg = { sender: Sender; text: string; cta?: string };
type Scenario = {
  channel: "whatsapp" | "sms" | "instagram" | "voice";
  business: string;
  leadName: string;
  leadInitials: string;
  accent: string;
  messages: ChatMsg[];
};

const scenarios: Scenario[] = [
  {
    channel: "whatsapp",
    business: "Sarah · Marriage Celebrant",
    leadName: "Ellie Chen",
    leadInitials: "EC",
    accent: "from-emerald-400 to-teal-500",
    messages: [
      { sender: "lead", text: "Hi! Are you free for a wedding Oct 12?" },
      {
        sender: "ai",
        text: "Hi Ellie — I'm Sarah's AI. Checking her calendar… ✨ Oct 12 is open. Her 'Love Story' package is popular for 2026. Want the brochure?",
      },
      { sender: "lead", text: "Yes please! What paperwork is needed?" },
      {
        sender: "ai",
        text: "For NSW you'll need a NOIM filed 1 month+ ahead. Lock the date with a $200 deposit:",
        cta: "Pay deposit →",
      },
    ],
  },
  {
    channel: "instagram",
    business: "Drive-Safe Academy",
    leadName: "Marcus R.",
    leadInitials: "MR",
    accent: "from-fuchsia-400 to-pink-500",
    messages: [
      { sender: "lead", text: "How much for 10 lessons? I'm a beginner 🚗" },
      {
        sender: "ai",
        text: "Beginner pack of 10 × 60min = $590 (save $60). First lesson free if you book 5+. Sydney or Inner West?",
      },
      { sender: "lead", text: "Inner West. Saturdays only if possible." },
      {
        sender: "ai",
        text: "Got it. Next Saturday 10am with Instructor Liam is open. Shall I hold it?",
        cta: "Book slot →",
      },
    ],
  },
  {
    channel: "voice",
    business: "Northside Photography",
    leadName: "Inbound call · +61 4…",
    leadInitials: "📞",
    accent: "from-amber-400 to-orange-500",
    messages: [
      { sender: "lead", text: "*Voicemail transcribed:* Need a photographer for a corporate event Nov 3…" },
      {
        sender: "ai",
        text: "Hi! I'm James's AI agent — transcribed your voicemail. Nov 3 is open. Corporate half-day is $1,400. Sending details + callback slot now.",
      },
      { sender: "lead", text: "Perfect — can you book the callback?" },
      {
        sender: "ai",
        text: "Done. Tue 2pm with James locked. Calendar invite sent.",
        cta: "View booking →",
      },
    ],
  },
];

const CHANNEL_META: Record<Scenario["channel"], { label: string; Icon: React.ComponentType<{ className?: string }>; dot: string }> = {
  whatsapp: { label: "WhatsApp", Icon: MessageSquare, dot: "bg-emerald-400" },
  sms: { label: "SMS", Icon: MessageSquare, dot: "bg-blue-400" },
  instagram: { label: "Instagram", Icon: Instagram, dot: "bg-pink-400" },
  voice: { label: "Voice", Icon: Phone, dot: "bg-amber-400" },
};

function useChatAnimation() {
  const [scenarioIdx, setScenarioIdx] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [typed, setTyped] = useState("");
  const [thinking, setThinking] = useState(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const scenario = scenarios[scenarioIdx];
    const msg = scenario.messages[msgIdx];
    function push(t: ReturnType<typeof setTimeout>) {
      timers.current.push(t);
    }

    if (!msg) {
      // scenario complete
      const t = setTimeout(() => {
        setScenarioIdx((i) => (i + 1) % scenarios.length);
        setMsgIdx(0);
        setTyped("");
      }, 2400);
      push(t);
      return () => {
        clearTimeout(t);
      };
    }

    if (msg.sender === "lead") {
      // Show lead message instantly, then move on
      setTyped(msg.text);
      const t = setTimeout(() => {
        setMsgIdx((i) => i + 1);
        setTyped("");
      }, 900);
      push(t);
      return () => {
        clearTimeout(t);
      };
    }

    // AI: thinking → typewriter
    setThinking(true);
    setTyped("");
    const thinkT = setTimeout(() => {
      setThinking(false);
      let i = 0;
      function step() {
        i += 1;
        setTyped(msg.text.slice(0, i));
        if (i < msg.text.length) {
          const t = setTimeout(step, 22);
          push(t);
        } else {
          const t = setTimeout(() => {
            setMsgIdx((j) => j + 1);
            setTyped("");
          }, 1100);
          push(t);
        }
      }
      step();
    }, 850);
    push(thinkT);

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
  }, [scenarioIdx, msgIdx]);

  return {
    scenario: scenarios[scenarioIdx],
    msgIdx,
    typed,
    thinking,
  };
}

function Bubble({ msg, partial, isActive }: { msg: ChatMsg; partial?: string; isActive: boolean }) {
  const text = isActive && msg.sender === "ai" ? partial ?? "" : msg.text;
  return (
    <div
      className={cn(
        "flex animate-slide-up",
        msg.sender === "lead" ? "justify-start" : "justify-end"
      )}
    >
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
          msg.sender === "lead"
            ? "rounded-tl-sm bg-white/10 text-slate-100 backdrop-blur"
            : "rounded-tr-sm bg-gradient-to-br from-cyan-500 to-violet-600 text-white"
        )}
      >
        {text || <span className="opacity-0">·</span>}
        {isActive && msg.sender === "ai" && text.length < msg.text.length && (
          <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-white/80 align-middle" />
        )}
        {msg.cta && !isActive && (
          <div className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white/20 px-3 py-1 text-xs font-semibold">
            {msg.cta}
          </div>
        )}
        {msg.sender === "ai" && text === msg.text && (
          <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-white/70">
            <CheckCheck className="h-3 w-3" /> delivered
          </div>
        )}
      </div>
    </div>
  );
}

function ChatCard() {
  const { scenario, msgIdx, typed, thinking } = useChatAnimation();
  const ChannelIcon = CHANNEL_META[scenario.channel].Icon;

  return (
    <div className="relative w-full max-w-md">
      {/* Outer glow ring */}
      <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-pink-500/20 opacity-60 blur-2xl" />
      <div className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-900/80 shadow-2xl backdrop-blur-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 bg-slate-950/50 px-5 py-3">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br text-white shadow-md",
                scenario.accent
              )}
            >
              <span className="text-xs font-bold">{scenario.leadInitials}</span>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{scenario.leadName}</p>
              <p className="text-[11px] text-slate-400">{scenario.business}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-slate-300">
            <ChannelIcon className="h-3 w-3" />
            {CHANNEL_META[scenario.channel].label}
          </div>
        </div>

        {/* Messages */}
        <div className="min-h-[340px] space-y-3 p-5">
          {scenario.messages.slice(0, msgIdx + 1).map((m, i) => (
            <Bubble
              key={`${scenario.business}-${i}`}
              msg={m}
              partial={typed}
              isActive={i === msgIdx}
            />
          ))}
          {thinking && (
            <div className="flex justify-end">
              <div className="flex items-center gap-1 rounded-2xl rounded-tr-sm bg-gradient-to-br from-cyan-500 to-violet-600 px-4 py-3 shadow-sm">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white [animation-delay:300ms]" />
              </div>
            </div>
          )}
        </div>

        {/* Footer status */}
        <div className="flex items-center justify-between border-t border-white/10 bg-slate-950/50 px-5 py-3 text-[11px]">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            AI agent active
          </div>
          <span className="font-mono text-slate-500">
            latency <span className="text-cyan-400">8.2s</span>
          </span>
        </div>
      </div>

      {/* Floating telemetry chips */}
      <div className="absolute -bottom-3 -left-3 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-950/80 px-3 py-1.5 text-xs font-medium text-emerald-300 shadow-xl backdrop-blur-md">
        <Sparkles className="h-3.5 w-3.5" />
        Deposit captured
      </div>
      <div className="absolute -top-3 -right-3 hidden items-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-950/80 px-3 py-1.5 text-xs font-medium text-cyan-300 shadow-xl backdrop-blur-md sm:flex">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
        Booking confirmed
      </div>
    </div>
  );
}

function LiveBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/50 px-3 py-1 text-xs font-medium text-cyan-300 backdrop-blur">
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-400" />
      </span>
      <span className="font-mono uppercase tracking-wider">Live · AI Operating</span>
    </div>
  );
}

export function HeroAI() {
  return (
    <section
      id="hero"
      className="relative isolate overflow-hidden bg-slate-950 text-white"
    >
      {/* Grid background */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage:
            "radial-gradient(ellipse 80% 60% at 50% 40%, black 40%, transparent 80%)",
        }}
      />
      {/* Aurora blobs */}
      <div className="pointer-events-none absolute -top-48 left-1/4 h-[520px] w-[520px] rounded-full bg-violet-600/30 blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 right-1/4 h-[520px] w-[520px] rounded-full bg-cyan-500/25 blur-[120px]" />
      <div className="pointer-events-none absolute top-1/3 right-0 h-[320px] w-[320px] rounded-full bg-fuchsia-500/20 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-36">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <LiveBadge />
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              The AI agent that{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                converts leads while you sleep
              </span>
              .
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
              WhatsApp, Instagram, SMS, Voice, Web Chat — one AI agent reads
              every message, qualifies intent, checks your calendar, takes
              deposits. Responds in <span className="text-cyan-400">8 seconds</span>,
              24/7.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-7 py-3.5 text-sm font-semibold text-white shadow-[0_0_40px_-8px_rgba(139,92,246,0.6)] transition hover:shadow-[0_0_60px_-6px_rgba(139,92,246,0.9)]"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transition duration-700 group-hover:translate-x-full" />
                Start free trial
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </Link>
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition hover:border-cyan-400/40 hover:bg-white/10"
              >
                <Sparkles className="h-4 w-4 text-cyan-400" />
                Talk to the AI now
              </Link>
            </div>

            <p className="mt-5 font-mono text-xs text-slate-500">
              {">"} no credit card · 14-day trial · cancel anytime
            </p>
          </div>

          <div className="relative flex justify-center lg:justify-end">
            <ChatCard />
          </div>
        </div>
      </div>
    </section>
  );
}
