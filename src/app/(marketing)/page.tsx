import Link from "next/link";
import {
  Radio,
  Sparkles,
  Filter,
  Calendar,
  CreditCard,
  RefreshCw,
  MessageSquare,
  Phone,
  Globe,
  Star,
  ChevronDown,
  ArrowRight,
  Zap,

  Brain,
  Target,
  Users,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-gradient-to-b from-blue-50 via-blue-50/40 to-white"
    >
      {/* Decorative blobs */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-purple-200/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-60 -left-40 h-[500px] w-[500px] rounded-full bg-blue-200/20 blur-3xl" />

      <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 sm:py-32 lg:px-8 lg:py-40">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-blue-700 backdrop-blur">
              <Zap className="h-4 w-4" />
              AI-powered lead conversion
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
              Your AI Chief of Staff for{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Lead Conversion
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-gray-600 sm:text-xl">
              Capture, qualify, and convert leads across every channel —
              WhatsApp, Instagram, SMS, Voice, and Web Chat. Your AI never
              sleeps, never misses a lead, and responds in under 15 seconds.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110"
              >
                Start Free Trial
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 px-8 py-4 text-lg font-semibold text-gray-700 transition hover:border-gray-400 hover:bg-gray-50"
              >
                Watch Demo
              </Link>
            </div>

            <p className="mt-5 text-sm text-gray-500">
              No credit card required &middot; Free 14-day trial &middot;
              Cancel anytime
            </p>
          </div>

          {/* Chat mockup */}
          <div className="relative mx-auto w-full max-w-md lg:mx-0">
            <div className="rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-200/60">
              {/* Title bar */}
              <div className="flex items-center gap-3 rounded-t-2xl border-b border-gray-100 bg-gray-50 px-5 py-3">
                <div className="flex gap-1.5">
                  <span className="h-3 w-3 rounded-full bg-red-400" />
                  <span className="h-3 w-3 rounded-full bg-yellow-400" />
                  <span className="h-3 w-3 rounded-full bg-green-400" />
                </div>
                <span className="text-sm font-medium text-gray-500">
                  LeadFlow AI — Inbox
                </span>
              </div>

              <div className="space-y-4 p-5">
                {/* Lead message */}
                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 text-sm text-gray-800">
                    Hi! Are you available for a wedding on Oct 12?
                  </div>
                </div>
                {/* AI response */}
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-600 to-purple-600 px-4 py-3 text-sm text-white">
                    Hi! I&apos;m Sarah&apos;s AI assistant. Let me
                    check&hellip; Sarah is free on Oct 12! Want the brochure?
                  </div>
                </div>
                {/* Lead */}
                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 text-sm text-gray-800">
                    Yes please! How do I book?
                  </div>
                </div>
                {/* AI */}
                <div className="flex justify-end">
                  <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-600 to-purple-600 px-4 py-3 text-sm text-white">
                    Here&apos;s a $200 deposit link to lock in the date:{" "}
                    <span className="inline-block mt-1 rounded-lg bg-white/20 px-3 py-1 font-medium">
                      Pay Now &rarr;
                    </span>
                  </div>
                </div>
                {/* Typing indicator */}
                <div className="flex justify-end">
                  <div className="flex items-center gap-1 rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-600 to-purple-600 px-4 py-3">
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white/70" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white/70 [animation-delay:150ms]" />
                    <span className="h-2 w-2 animate-pulse rounded-full bg-white/70 [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Floating badge */}
            <div className="absolute -bottom-4 -left-4 flex items-center gap-2 rounded-xl border border-green-200 bg-white px-4 py-2 shadow-lg">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-green-500" />
              </span>
              <span className="text-sm font-medium text-gray-700">
                AI responded in 8s
              </span>
            </div>
          </div>
        </div>
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
    <section className="border-y border-gray-100 bg-gray-50/50 py-10">
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
              {/* Vertical connecting line */}
              {i < steps.length - 1 && (
                <div className="absolute left-5 top-12 bottom-0 w-px border-l-2 border-dashed border-blue-200" />
              )}
              {/* Number circle */}
              <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-bold text-white shadow-md">
                {i + 1}
              </div>
              {/* Content */}
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
              {/* Gradient top border */}
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
/*  Channel Visualization                                              */
/* ------------------------------------------------------------------ */

const channels = [
  { name: "WhatsApp", icon: MessageSquare, color: "bg-green-500", position: "top-0 left-1/2 -translate-x-1/2" },
  { name: "Instagram", icon: MessageSquare, color: "bg-gradient-to-br from-pink-500 to-purple-600", position: "top-1/4 right-0" },
  { name: "SMS", icon: MessageSquare, color: "bg-blue-500", position: "bottom-1/4 right-0" },
  { name: "Voice", icon: Phone, color: "bg-orange-500", position: "bottom-1/4 left-0" },
  { name: "Web Chat", icon: Globe, color: "bg-teal-500", position: "top-1/4 left-0" },
];

function ChannelVisualization() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            One inbox. Every channel.
          </h2>
        </div>

        {/* Channel arc */}
        <div className="mx-auto mt-16 max-w-3xl">
          <div className="flex flex-col items-center gap-8 sm:gap-10">
            {/* Channel icons row */}
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
              {channels.map((ch) => (
                <div key={ch.name} className="flex flex-col items-center gap-2">
                  <div
                    className={cn(
                      "flex h-16 w-16 items-center justify-center rounded-2xl text-white shadow-lg sm:h-20 sm:w-20",
                      ch.color
                    )}
                  >
                    <ch.icon className="h-7 w-7 sm:h-8 sm:w-8" />
                  </div>
                  <span className="text-xs font-medium text-gray-500 sm:text-sm">
                    {ch.name}
                  </span>
                </div>
              ))}
            </div>

            {/* Connecting arrows */}
            <div className="flex items-center gap-2 text-gray-300">
              <div className="h-px w-8 bg-gray-300" />
              <ArrowRight className="h-5 w-5 text-gray-400" />
              <div className="h-px w-8 bg-gray-300" />
            </div>

            {/* Unified inbox box */}
            <div className="flex items-center gap-4 rounded-2xl border-2 border-blue-200 bg-white px-8 py-5 shadow-xl shadow-blue-100/50">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white">
                <Zap className="h-7 w-7" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">Unified Inbox</p>
                <p className="text-sm text-gray-500">
                  All channels, one timeline
                </p>
              </div>
            </div>
          </div>

          <p className="mx-auto mt-10 max-w-lg text-center leading-relaxed text-gray-600">
            All messages merge into a single timeline per contact. No more
            switching between apps.
          </p>
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
            {/* Chat header */}
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

            {/* Messages */}
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
              {/* Stars */}
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
      <Hero />
      <SocialProof />
      <Features />
      <HowItWorks />
      <AIAgents />
      <ChannelVisualization />
      <UseCaseStory />
      <Testimonials />
      <FAQ />
      <FinalCTA />
    </>
  );
}
