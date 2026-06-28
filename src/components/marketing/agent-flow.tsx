"use client";

import { cn } from "@/lib/utils";
import {
  Brain,
  Calendar,
  CheckCircle2,
  CreditCard,
  Globe,
  Instagram,
  MessageSquare,
  Phone,
} from "lucide-react";

type Node = {
  id: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  x: number;
  y: number;
  accent: string;
};

const channels: Node[] = [
  { id: "wa", label: "WhatsApp", Icon: MessageSquare, x: 80, y: 80, accent: "from-emerald-400 to-teal-500" },
  { id: "ig", label: "Instagram", Icon: Instagram, x: 80, y: 180, accent: "from-fuchsia-400 to-pink-500" },
  { id: "sms", label: "SMS", Icon: MessageSquare, x: 80, y: 280, accent: "from-blue-400 to-indigo-500" },
  { id: "voice", label: "Voice", Icon: Phone, x: 80, y: 380, accent: "from-amber-400 to-orange-500" },
  { id: "web", label: "Web Chat", Icon: Globe, x: 80, y: 480, accent: "from-teal-400 to-cyan-500" },
];

const outcomes: Node[] = [
  { id: "qualified", label: "Qualified", Icon: CheckCircle2, x: 920, y: 150, accent: "from-green-400 to-emerald-500" },
  { id: "booked", label: "Booked", Icon: Calendar, x: 920, y: 280, accent: "from-cyan-400 to-blue-500" },
  { id: "paid", label: "Paid", Icon: CreditCard, x: 920, y: 410, accent: "from-violet-400 to-purple-500" },
];

const hub = { x: 500, y: 280 };

function curve(from: { x: number; y: number }, to: { x: number; y: number }) {
  const midX = (from.x + to.x) / 2;
  return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
}

export function AgentFlow() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-24 text-white">
      <div
        aria-hidden
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(ellipse 70% 70% at 50% 50%, black 30%, transparent 85%)",
        }}
      />
      <div className="pointer-events-none absolute left-1/3 top-1/3 h-[420px] w-[420px] rounded-full bg-violet-600/20 blur-[100px]" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/40 px-3 py-1 text-xs font-medium text-cyan-300 backdrop-blur">
            <span className="font-mono uppercase tracking-wider">Agent Topology</span>
          </div>
          <h2 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            One AI brain.{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Every channel.
            </span>
          </h2>
          <p className="mt-4 text-slate-400">
            Inbound from any surface flows through a single orchestrator →
            qualified, booked, paid. No handoffs. No dropped threads.
          </p>
        </div>

        <div className="relative mx-auto aspect-[2/1] w-full max-w-5xl">
          <svg
            viewBox="0 0 1000 560"
            className="absolute inset-0 h-full w-full"
            aria-hidden
          >
            <defs>
              <linearGradient id="flow-in" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.8" />
              </linearGradient>
              <linearGradient id="flow-out" x1="0%" x2="100%">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#22d3ee" stopOpacity="0.3" />
              </linearGradient>
              <radialGradient id="hub-glow">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
              </radialGradient>
              <filter id="soft-glow">
                <feGaussianBlur stdDeviation="3" />
              </filter>
            </defs>

            {/* Hub glow */}
            <circle cx={hub.x} cy={hub.y} r="110" fill="url(#hub-glow)" />

            {/* Channel → hub paths + animated dots */}
            {channels.map((ch, i) => {
              const d = curve({ x: ch.x + 30, y: ch.y }, { x: hub.x - 60, y: hub.y });
              return (
                <g key={ch.id}>
                  <path d={d} stroke="url(#flow-in)" strokeWidth="1.5" fill="none" />
                  <circle r="3.5" fill="#22d3ee">
                    <animateMotion dur="3.2s" begin={`${i * 0.5}s`} repeatCount="indefinite" path={d} />
                  </circle>
                </g>
              );
            })}

            {/* Hub → outcome paths + animated dots */}
            {outcomes.map((out, i) => {
              const d = curve({ x: hub.x + 60, y: hub.y }, { x: out.x - 30, y: out.y });
              return (
                <g key={out.id}>
                  <path d={d} stroke="url(#flow-out)" strokeWidth="1.5" fill="none" />
                  <circle r="3.5" fill="#a855f7">
                    <animateMotion
                      dur="2.6s"
                      begin={`${1.5 + i * 0.6}s`}
                      repeatCount="indefinite"
                      path={d}
                    />
                  </circle>
                </g>
              );
            })}
          </svg>

          {/* Hub */}
          <div
            className="absolute"
            style={{
              left: `${(hub.x / 1000) * 100}%`,
              top: `${(hub.y / 560) * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="relative">
              <div className="absolute inset-0 animate-ping rounded-3xl bg-violet-500/20" />
              <div className="relative flex h-28 w-28 items-center justify-center rounded-3xl border border-white/10 bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 shadow-[0_0_60px_-5px_rgba(168,85,247,0.6)]">
                <Brain className="h-12 w-12 text-white" />
              </div>
              <p className="mt-3 text-center font-mono text-xs uppercase tracking-wider text-slate-400">
                AI Orchestrator
              </p>
            </div>
          </div>

          {/* Channel pills */}
          {channels.map((ch) => (
            <NodePill key={ch.id} node={ch} />
          ))}

          {/* Outcome pills */}
          {outcomes.map((out) => (
            <NodePill key={out.id} node={out} />
          ))}
        </div>
      </div>
    </section>
  );
}

function NodePill({ node }: { node: Node }) {
  return (
    <div
      className="absolute"
      style={{
        left: `${(node.x / 1000) * 100}%`,
        top: `${(node.y / 560) * 100}%`,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className="flex items-center gap-2 rounded-full border border-white/10 bg-slate-900/80 px-3 py-2 shadow-lg backdrop-blur">
        <div
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-white",
            node.accent
          )}
        >
          <node.Icon className="h-3.5 w-3.5" />
        </div>
        <span className="pr-1 text-xs font-medium text-slate-200">{node.label}</span>
      </div>
    </div>
  );
}
