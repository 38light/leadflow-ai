import Link from "next/link";
import {
  Heart,
  Car,
  Camera,
  Home,
  PartyPopper,
  Dumbbell,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SectionHeroDark,
  ScrollReveal,
  SpotlightCard,
} from "@/components/marketing";

/* ------------------------------------------------------------------ */
/*  Main Use Case Cards                                                */
/* ------------------------------------------------------------------ */

const mainUseCases = [
  {
    icon: Heart,
    title: "For Marriage Celebrants",
    description:
      "Never miss a wedding inquiry again. AI responds to DMs while you\u2019re at ceremonies, qualifies leads, checks your calendar, sends brochures, and collects deposits \u2014 all automatically.",
    stats:
      "58% conversion rate \u00b7 12s avg response \u00b7 $47K additional revenue/year",
    href: "/solutions/marriage-celebrants",
    iconBg: "bg-pink-500/15 text-pink-300 ring-1 ring-pink-400/30",
    statsColor: "text-pink-300",
  },
  {
    icon: Car,
    title: "For Driving Instructors",
    description:
      "Fill your lesson calendar on autopilot. AI handles booking inquiries, checks availability, schedules lessons, and follows up with students \u2014 across WhatsApp, SMS, and your website.",
    stats: "3x more bookings \u00b7 8s avg response \u00b7 15hrs saved/week",
    href: "/solutions/driving-instructors",
    iconBg: "bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/30",
    statsColor: "text-cyan-300",
  },
] as const;

function MainUseCases() {
  return (
    <section className="bg-slate-950 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {mainUseCases.map((uc, i) => (
            <ScrollReveal key={uc.title} delay={i * 80}>
              <SpotlightCard className="h-full">
                <div className="p-8 sm:p-10">
                  <div
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan-400 to-violet-400"
                  />
                  <div
                    className={cn(
                      "mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl",
                      uc.iconBg
                    )}
                  >
                    <uc.icon className="h-7 w-7" />
                  </div>

                  <h2 className="text-2xl font-bold text-white sm:text-3xl">
                    {uc.title}
                  </h2>

                  <p className="mt-4 text-lg leading-relaxed text-slate-300">
                    {uc.description}
                  </p>

                  <div
                    className={cn(
                      "mt-6 inline-flex rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold",
                      uc.statsColor
                    )}
                  >
                    {uc.stats}
                  </div>

                  <div className="mt-8">
                    <Link
                      href={uc.href}
                      className="group/link inline-flex items-center gap-2 text-lg font-semibold text-white transition"
                    >
                      See how it works
                      <ArrowRight className="h-5 w-5 transition-transform group-hover/link:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </SpotlightCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Coming Soon                                                        */
/* ------------------------------------------------------------------ */

const comingSoon = [
  {
    icon: Camera,
    title: "Photographers",
    description:
      "Automate session bookings, send portfolios, and collect retainers.",
  },
  {
    icon: Home,
    title: "Real Estate Agents",
    description:
      "Qualify buyer leads, schedule inspections, and follow up automatically.",
  },
  {
    icon: PartyPopper,
    title: "Event Planners",
    description:
      "Manage event inquiries, share packages, and lock in dates instantly.",
  },
  {
    icon: Dumbbell,
    title: "Personal Trainers",
    description:
      "Fill your roster, handle scheduling, and onboard new clients via chat.",
  },
] as const;

function ComingSoon() {
  return (
    <section className="bg-slate-950 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            More industries coming soon
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            We&apos;re building tailored solutions for even more service
            businesses.
          </p>
        </div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {comingSoon.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 80}>
              <SpotlightCard>
                <div className="relative p-6">
                  <div className="absolute right-4 top-4">
                    <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-slate-400">
                      Coming soon
                    </span>
                  </div>

                  <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400">
                    <item.icon className="h-6 w-6" />
                  </div>

                  <h3 className="text-lg font-semibold text-slate-200">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    {item.description}
                  </p>
                </div>
              </SpotlightCard>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Bottom CTA                                                         */
/* ------------------------------------------------------------------ */

function BottomCTA() {
  return (
    <section className="relative overflow-hidden bg-slate-950 py-24">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-cyan-500/10" />
      <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Don&apos;t see your industry?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-300">
          LeadFlow AI works for any service business. Connect your channels,
          upload your knowledge base, and start converting leads today.
        </p>
        <div className="mt-10">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-10 py-4 text-lg font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-violet-400"
          >
            Start Free Trial
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
        <p className="mt-4 text-sm text-slate-400">
          No credit card required &middot; Setup in 5 minutes
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SolutionsPage() {
  return (
    <div className="bg-slate-950">
      <SectionHeroDark
        eyebrow="Solutions"
        title={
          <>
            Built for{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              service businesses
            </span>
          </>
        }
        subtitle="LeadFlow AI adapts to your industry. See how businesses like yours capture more leads, respond faster, and convert more clients."
      />
      <MainUseCases />
      <ComingSoon />
      <BottomCTA />
    </div>
  );
}
