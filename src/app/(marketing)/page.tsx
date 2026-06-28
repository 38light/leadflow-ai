import Link from "next/link";
import {
  Radio,
  Sparkles,
  Filter,
  Calendar,
  CreditCard,
  RefreshCw,
  Star,
  ChevronDown,
  ArrowRight,
  Brain,
  Target,
  Users,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HeroAI, StatTicker, AgentFlow } from "@/components/marketing";

/* ------------------------------------------------------------------ */
/*  Stats band (dark, continues hero theme)                            */
/* ------------------------------------------------------------------ */

function StatsBand() {
  return (
    <section className="relative border-y border-white/10 bg-slate-950 py-16 text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px)",
          backgroundSize: "48px 100%",
        }}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center gap-3 text-xs font-mono uppercase tracking-wider text-slate-500">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/10" />
          <span>Live telemetry · across 500+ businesses</span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/10" />
        </div>
        <StatTicker />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Social Proof Bar                                                   */
/* ------------------------------------------------------------------ */

function SocialProof() {
  const logos = ["Celebrant Co", "WedPlan", "EventPro", "ServiceHub", "BookEasy"];

  return (
    <section className="border-b border-gray-100 bg-gray-50/50 py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <p className="mb-8 text-center text-sm font-medium tracking-wide text-gray-500 uppercase">
          Trusted by 500+ service businesses across Australia
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {logos.map((name) => (
            <span
              key={name}
              className="text-xl font-bold tracking-tight text-gray-300 select-none"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Features                                                           */
/* ------------------------------------------------------------------ */

const features = [
  {
    icon: Radio,
    title: "Omni-Channel Capture",
    description:
      "Monitor WhatsApp, Instagram, SMS, Voice, and Web Chat from one unified inbox.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Responses",
    description:
      "Intelligent AI responds to leads in under 15 seconds with personalized, context-aware messages.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Filter,
    title: "Smart Qualification",
    description:
      "AI classifies intent, sentiment, and urgency. Hot leads get priority — cold leads get nurtured.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: Calendar,
    title: "One-Click Booking",
    description:
      "AI checks your calendar and proposes times. Leads book without leaving the chat.",
    color: "bg-orange-100 text-orange-600",
  },
  {
    icon: CreditCard,
    title: "Instant Payments",
    description:
      "Generate Stripe deposit links mid-conversation. Secure the sale before they shop around.",
    color: "bg-pink-100 text-pink-600",
  },
  {
    icon: RefreshCw,
    title: "CRM Sync",
    description:
      "Bidirectional HubSpot sync. Every conversation auto-populates contact fields.",
    color: "bg-indigo-100 text-indigo-600",
  },
] as const;

function Features() {
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to convert leads on autopilot
          </h2>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-gray-200 bg-white p-8 transition hover:border-gray-300 hover:shadow-lg"
            >
              <div
                className={cn(
                  "mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl",
                  f.color
                )}
              >
                <f.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">{f.title}</h3>
              <p className="mt-2 leading-relaxed text-gray-600">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  How It Works                                                       */
/* ------------------------------------------------------------------ */

const steps = [
  {
    title: "Lead Messages You",
    description:
      "A potential client DMs you on Instagram, sends a WhatsApp, or calls your number. LeadFlow captures it instantly.",
  },
  {
    title: "AI Takes Over",
    description:
      "Your AI concierge identifies intent, checks your knowledge base, and crafts a perfect response — in seconds.",
  },
  {
    title: "Qualify & Book",
    description:
      "AI qualifies the lead, checks your calendar, proposes available times, and books the appointment.",
  },
  {
    title: "Secure the Sale",
    description:
      "AI sends a Stripe payment link for the deposit. The lead pays, and you get notified. Done.",
  },
];

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            From first message to deposit in minutes
          </h2>
        </div>

        <div className="mx-auto mt-16 max-w-2xl">
          {steps.map((step, i) => (
            <div key={step.title} className="relative flex gap-6 pb-12 last:pb-0">
              {i < steps.length - 1 && (
                <div className="absolute left-5 top-12 bottom-0 w-px border-l-2 border-dashed border-blue-200" />
              )}
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-bold text-white shadow-md">
                {i + 1}
              </div>
              <div className="pt-0.5">
                <h3 className="text-lg font-semibold text-gray-900">
                  {step.title}
                </h3>
                <p className="mt-1 leading-relaxed text-gray-600">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  AI Agents                                                          */
/* ------------------------------------------------------------------ */

const agents = [
  {
    name: "The Concierge",
    icon: Users,
    accent: "from-purple-500 to-purple-700",
    accentLight: "bg-purple-50 text-purple-700",
    description:
      "Your front desk. Greets every lead, understands what they need, detects urgency and sentiment, routes to the right agent.",
    capabilities: [
      "Instant greeting in under 15 seconds",
      "Intent & sentiment detection",
      "Urgency classification (hot / warm / cold)",
      "Smart routing to the right specialist",
    ],
  },
  {
    name: "The Knowledge Expert",
    icon: Brain,
    accent: "from-blue-500 to-blue-700",
    accentLight: "bg-blue-50 text-blue-700",
    description:
      "Your FAQ specialist. Trained on your documents, pricing, legal requirements. Answers questions accurately with citations.",
    capabilities: [
      "RAG-powered answers from your docs",
      "Pricing & availability lookups",
      "Legal & compliance knowledge",
      "Citation-backed responses",
    ],
  },
  {
    name: "The Closer",
    icon: Target,
    accent: "from-green-500 to-green-700",
    accentLight: "bg-green-50 text-green-700",
    description:
      "Your sales assistant. Checks calendars, books appointments, generates payment links, updates your CRM. Gets deals done.",
    capabilities: [
      "Calendar availability checking",
      "One-tap appointment booking",
      "Stripe deposit link generation",
      "Automatic CRM updates",
    ],
  },
];

function AIAgents() {
  return (
    <section id="ai-agents" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Three AI agents working as your team
          </h2>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {agents.map((agent) => (
            <div
              key={agent.name}
              className="relative overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:shadow-lg"
            >
              <div
                className={cn(
                  "h-1.5 w-full bg-gradient-to-r",
                  agent.accent
                )}
              />
              <div className="p-8">
                <div
                  className={cn(
                    "mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl",
                    agent.accentLight
                  )}
                >
                  <agent.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">
                  {agent.name}
                </h3>
                <p className="mt-2 leading-relaxed text-gray-600">
                  {agent.description}
                </p>
                <ul className="mt-5 space-y-2">
                  {agent.capabilities.map((cap) => (
                    <li
                      key={cap}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      {cap}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Use Case — The Celebrant Story                                     */
/* ------------------------------------------------------------------ */

const chatMessages = [
  {
    sender: "lead" as const,
    text: "Hi! Are you available Oct 12, 2026?",
  },
  {
    sender: "ai" as const,
    text: "Hi! I'm Sarah's AI assistant. Let me check\u2026 Sarah is free on Oct 12! Her 'Love Story' package is very popular for 2026 weddings. Would you like the brochure?",
  },
  {
    sender: "lead" as const,
    text: "Yes please! What's the legal paperwork?",
  },
  {
    sender: "ai" as const,
    text: "Great question! For NSW weddings, you'll need a Notice of Intended Marriage (NOIM) filed at least 1 month before. I've sent the brochure to your DMs. Ready to lock in the date? Here's a $200 deposit link:",
    cta: "Pay Now",
  },
];

function UseCaseStory() {
  return (
    <section className="bg-blue-50/60 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            See it in action: A wedding inquiry
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-lg">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-xl">
            <div className="flex items-center gap-3 rounded-t-2xl border-b border-gray-100 bg-gray-50 px-5 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-xs font-bold text-white">
                AI
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  Sarah&apos;s AI Assistant
                </p>
                <p className="text-xs text-green-600">Online</p>
              </div>
            </div>

            <div className="space-y-4 p-5">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex",
                    msg.sender === "lead" ? "justify-start" : "justify-end"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                      msg.sender === "lead"
                        ? "rounded-tl-sm bg-gray-100 text-gray-800"
                        : "rounded-tr-sm bg-gradient-to-br from-blue-600 to-purple-600 text-white"
                    )}
                  >
                    {msg.text}
                    {msg.cta && (
                      <span className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white/20 px-4 py-1.5 text-sm font-semibold">
                        {msg.cta} &rarr;
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-8 text-center text-sm leading-relaxed text-gray-600 italic">
            From inquiry to deposit in under 5 minutes — while Sarah was at
            another wedding.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonials                                                       */
/* ------------------------------------------------------------------ */

const testimonials = [
  {
    quote:
      "LeadFlow responded to a Saturday night inquiry while I was at a wedding. By Sunday morning, the deposit was paid.",
    name: "Sarah M.",
    role: "Marriage Celebrant",
    city: "Sydney",
    initials: "SM",
    color: "bg-purple-500",
  },
  {
    quote:
      "We used to lose 40% of leads to slow response times. Now our AI responds in 10 seconds and our conversion rate doubled.",
    name: "James K.",
    role: "Event Planner",
    city: "Melbourne",
    initials: "JK",
    color: "bg-blue-500",
  },
  {
    quote:
      "The HubSpot sync alone saved us 5 hours a week. The AI qualification is a game-changer.",
    name: "Priya R.",
    role: "Photography Studio",
    city: "Brisbane",
    initials: "PR",
    color: "bg-green-500",
  },
];

function Testimonials() {
  return (
    <section id="testimonials" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Loved by service businesses
          </h2>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="rounded-xl border border-gray-200 bg-white p-8 transition hover:shadow-lg"
            >
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-5 w-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>
              <p className="leading-relaxed text-gray-700 italic">
                &ldquo;{t.quote}&rdquo;
              </p>
              <div className="mt-6 flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white",
                    t.color
                  )}
                >
                  {t.initials}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {t.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    {t.role}, {t.city}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                                */
/* ------------------------------------------------------------------ */

const faqs = [
  {
    q: "How does the AI know about my business?",
    a: "You upload your documents, pricing sheets, and FAQs to the Knowledge Base. The AI trains on your specific data using RAG (Retrieval Augmented Generation).",
  },
  {
    q: "Will leads know they're talking to an AI?",
    a: "Yes. We comply with Australian consumer protection guidelines. The AI identifies itself in the first message. Leads can request a human at any time.",
  },
  {
    q: "What channels are supported?",
    a: "WhatsApp, Instagram DMs, Facebook Messenger, SMS, Voice calls, and an embeddable Web Chat widget for your website.",
  },
  {
    q: "Can I take over a conversation?",
    a: "Absolutely. Toggle 'Human Mode' on any conversation. The AI will even draft suggested replies for you to send with one tap.",
  },
  {
    q: "How does billing work?",
    a: "We offer Free, Starter ($49/mo), Pro ($149/mo), and Enterprise plans. All plans include a 14-day free trial.",
  },
  {
    q: "Is my data secure?",
    a: "Yes. All data is stored in Australia (Supabase Sydney region) for APP compliance. We use RLS, encryption, and never share your data.",
  },
];

function FAQ() {
  return (
    <section id="faq" className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-2xl divide-y divide-gray-200">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group py-5 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-lg font-medium text-gray-900 marker:content-none">
                {faq.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition group-open:rotate-180" />
              </summary>
              <p className="mt-3 leading-relaxed text-gray-600">{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Final CTA                                                          */
/* ------------------------------------------------------------------ */

function FinalCTA() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-purple-600 py-24">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to never miss a lead again?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
          Join 500+ service businesses using LeadFlow AI to respond faster,
          convert more, and work less.
        </p>
        <div className="mt-10">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-10 py-4 text-lg font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50 hover:shadow-xl"
          >
            Start Your Free Trial
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
        <p className="mt-4 text-sm text-blue-200">
          No credit card required &middot; Setup in 5 minutes
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  return (
    <>
      <HeroAI />
      <StatsBand />
      <SocialProof />
      <Features />
      <HowItWorks />
      <AIAgents />
      <AgentFlow />
      <UseCaseStory />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </>
  );
}
