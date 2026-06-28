"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Stat = {
  value: number;
  label: string;
  suffix?: string;
  prefix?: string;
  decimals?: number;
};

const stats: Stat[] = [
  { value: 1247, label: "Leads handled today", suffix: "+" },
  { value: 8.2, label: "Avg response time", suffix: "s", decimals: 1 },
  { value: 94, label: "Booking conversion", suffix: "%" },
  { value: 500, label: "Businesses live", suffix: "+" },
];

function useCountUp(target: number, decimals = 0, duration = 1800) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          function tick(t: number) {
            const p = Math.min((t - start) / duration, 1);
            const eased = 1 - Math.pow(1 - p, 3);
            setValue(target * eased);
            if (p < 1) requestAnimationFrame(tick);
          }
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, duration]);

  return { ref, value: value.toFixed(decimals) };
}

function StatCell({ stat }: { stat: Stat }) {
  const { ref, value } = useCountUp(stat.value, stat.decimals ?? 0);
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm transition hover:border-cyan-400/40">
      <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent opacity-0 transition group-hover:opacity-100" />
      <div className="flex items-baseline gap-1 font-mono text-4xl font-bold tracking-tight text-white sm:text-5xl">
        {stat.prefix}
        <span ref={ref} className="tabular-nums">
          {value}
        </span>
        <span className="text-cyan-400">{stat.suffix}</span>
      </div>
      <p className="mt-2 text-sm text-slate-400">{stat.label}</p>
    </div>
  );
}

export function StatTicker({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-4 lg:grid-cols-4",
        className
      )}
    >
      {stats.map((s) => (
        <StatCell key={s.label} stat={s} />
      ))}
    </div>
  );
}
