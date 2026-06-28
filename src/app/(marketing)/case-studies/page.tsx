import Link from "next/link";
import {
  Clock,
  TrendingUp,
  DollarSign,
  Timer,
  Inbox,
  Bot,
  CalendarCheck,
  Users,
  FileText,
  RefreshCw,
  BarChart3,
  Quote,
  LucideIcon,
} from "lucide-react";
import {
  SectionHeroDark,
  ScrollReveal,
  SpotlightCard,
} from "@/components/marketing";

interface Metric {
  icon: LucideIcon;
  label: string;
  before: string;
  after: string;
}

interface CaseStudy {
  name: string;
  role: string;
  location: string;
  industry: string;
  challenge: string;
  solution: string;
  metrics: Metric[];
  quote: string;
  color: string;
  initials: string;
}

const caseStudies: CaseStudy[] = [
  {
    name: "Sarah Mitchell",
    role: "Marriage Celebrant",
    location: "Sydney",
    industry: "Wedding Services",
    initials: "SM",
    color: "bg-pink-500/15 text-pink-300 ring-1 ring-pink-400/30",
    challenge:
      "Missing 40% of Instagram DMs because she was performing ceremonies on weekends",
    solution:
      "LeadFlow AI monitors Instagram 24/7, responds in seconds, qualifies leads, and books consultations",
    metrics: [
      {
        icon: Clock,
        label: "Response time",
        before: "4 hours",
        after: "12 seconds",
      },
      {
        icon: TrendingUp,
        label: "Lead conversion",
        before: "23%",
        after: "58%",
      },
      {
        icon: DollarSign,
        label: "Revenue increase",
        before: "",
        after: "+$47,000/year",
      },
      {
        icon: Timer,
        label: "Hours saved",
        before: "",
        after: "15 hours/week",
      },
    ],
    quote:
      "LeadFlow paid for itself in the first week. I booked 3 weddings from Saturday night DMs I would have missed.",
  },
  {
    name: "James & Co Events",
    role: "Event Planning",
    location: "Melbourne",
    industry: "Events",
    initials: "JC",
    color: "bg-blue-500/15 text-blue-300 ring-1 ring-blue-400/30",
    challenge: "Managing inquiries across 4 channels with a team of 2",
    solution:
      "Unified inbox + AI qualification freed the team to focus on high-value leads",
    metrics: [
      {
        icon: Inbox,
        label: "Channels unified",
        before: "4 separate",
        after: "1 inbox",
      },
      {
        icon: Bot,
        label: "AI-handled conversations",
        before: "0%",
        after: "78%",
      },
      {
        icon: CalendarCheck,
        label: "Booking rate",
        before: "",
        after: "2x increase",
      },
      {
        icon: Users,
        label: "Team productivity",
        before: "",
        after: "+40%",
      },
    ],
    quote:
      "The AI handles routine questions perfectly. We only step in for complex requests.",
  },
  {
    name: "Priya's Photography",
    role: "Photography Studio",
    location: "Brisbane",
    industry: "Photography",
    initials: "PP",
    color: "bg-purple-500/15 text-purple-300 ring-1 ring-purple-400/30",
    challenge:
      "Losing leads to competitors who responded faster to wedding inquiries",
    solution:
      "AI responds instantly with pricing, availability, and portfolio links from knowledge base",
    metrics: [
      {
        icon: Clock,
        label: "First response",
        before: "2 days",
        after: "8 seconds",
      },
      {
        icon: FileText,
        label: "Knowledge base",
        before: "",
        after: "12 documents",
      },
      {
        icon: RefreshCw,
        label: "HubSpot sync",
        before: "Manual",
        after: "100% auto",
      },
      {
        icon: BarChart3,
        label: "Monthly bookings",
        before: "",
        after: "+65%",
      },
    ],
    quote:
      "The HubSpot sync alone saved us 5 hours a week. The AI is like having a full-time receptionist.",
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="bg-slate-950 text-white">
      <SectionHeroDark
        eyebrow="Customer Stories"
        title={
          <>
            Real businesses.{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
              Real numbers.
            </span>
          </>
        }
        subtitle="See how service businesses across Australia are converting more leads, saving hours every week, and growing revenue with LeadFlow AI."
      />

      {/* Case Studies */}
      <div className="mx-auto max-w-5xl space-y-12 px-4 py-24 sm:px-6 lg:px-8">
        {caseStudies.map((study, i) => (
          <ScrollReveal key={study.name} delay={i * 100}>
            <SpotlightCard>
              {/* Header */}
              <div className="border-b border-white/10 bg-white/[0.03] px-8 py-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold ${study.color}`}
                  >
                    {study.initials}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {study.name}
                    </h2>
                    <p className="text-sm text-slate-400">
                      {study.role} &mdash; {study.location} &mdash;{" "}
                      {study.industry}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-8">
                {/* Challenge & Solution */}
                <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
                  <div>
                    <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-rose-300">
                      Challenge
                    </h3>
                    <p className="text-slate-300">{study.challenge}</p>
                  </div>
                  <div>
                    <h3 className="mb-2 font-mono text-xs font-semibold uppercase tracking-wider text-emerald-300">
                      Solution
                    </h3>
                    <p className="text-slate-300">{study.solution}</p>
                  </div>
                </div>

                {/* Metrics */}
                <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
                  {study.metrics.map((metric, mi) => {
                    const Icon = metric.icon;
                    return (
                      <ScrollReveal key={metric.label} delay={i * 100 + mi * 60}>
                        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-slate-900/60 p-4 text-center">
                          <div
                            aria-hidden
                            className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-cyan-400 to-violet-400"
                          />
                          <Icon className="mx-auto mb-2 h-5 w-5 text-cyan-300" />
                          <div className="mb-1 bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-2xl font-bold text-transparent">
                            {metric.after}
                          </div>
                          <div className="text-xs text-slate-400">
                            {metric.label}
                          </div>
                          {metric.before && (
                            <div className="mt-1 text-xs text-slate-500 line-through">
                              was {metric.before}
                            </div>
                          )}
                        </div>
                      </ScrollReveal>
                    );
                  })}
                </div>

                {/* Quote */}
                <div className="rounded-xl border border-cyan-400/20 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 p-6">
                  <div className="flex gap-3">
                    <Quote className="mt-0.5 h-6 w-6 shrink-0 text-cyan-300" />
                    <div>
                      <p className="text-lg italic leading-relaxed text-slate-100">
                        &ldquo;{study.quote}&rdquo;
                      </p>
                      <p className="mt-3 text-sm font-medium text-slate-400">
                        &mdash; {study.name}, {study.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </ScrollReveal>
        ))}
      </div>

      {/* CTA */}
      <div className="mx-auto max-w-4xl px-4 pb-24 text-center">
        <h2 className="mb-4 text-3xl font-bold text-white">
          Ready to write your success story?
        </h2>
        <p className="mx-auto mb-8 max-w-xl text-slate-400">
          Join hundreds of Australian service businesses converting more leads
          with AI. Start your free trial today.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-cyan-500/20 transition-all hover:from-cyan-400 hover:to-violet-400"
        >
          Start Free Trial
        </Link>
      </div>
    </div>
  );
}
