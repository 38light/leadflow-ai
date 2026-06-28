import Link from "next/link";
import {
  Radio, Sparkles, Filter, Calendar, CreditCard, RefreshCw,
  MessageSquare, Shield, Zap, BarChart3, Users, Globe,
  ArrowRight,
} from "lucide-react";
import {
  SectionHeroDark,
  ScrollReveal,
  SpotlightCard,
} from "@/components/marketing";

const features = [
  {
    icon: Radio,
    title: "Omni-Channel Capture",
    description: "Monitor WhatsApp, Instagram DMs, Facebook Messenger, SMS, Voice calls, and Web Chat — all from one unified inbox. Never miss a lead regardless of where they reach out.",
    color: "bg-blue-100 text-blue-600",
    details: [
      "Automatic channel detection and routing",
      "Unified contact timeline across channels",
      "Real-time message notifications",
      "Media support (images, documents, voice notes)",
    ],
  },
  {
    icon: Sparkles,
    title: "AI-Powered Responses",
    description: "Claude-powered AI responds to leads in under 15 seconds with personalized, context-aware messages. Your leads never wait.",
    color: "bg-purple-100 text-purple-600",
    details: [
      "Sub-15-second response time",
      "Context-aware from conversation history",
      "Sentiment and intent detection",
      "Natural, human-like conversation",
    ],
  },
  {
    icon: Filter,
    title: "Smart Lead Qualification",
    description: "AI automatically classifies every lead by intent, sentiment, and urgency. Hot leads get priority treatment, cold leads get nurtured.",
    color: "bg-orange-100 text-orange-600",
    details: [
      "Automatic lead scoring",
      "Intent classification (booking, pricing, info)",
      "Temperature tracking (hot/warm/cold)",
      "Smart routing to human when needed",
    ],
  },
  {
    icon: Calendar,
    title: "One-Click Booking",
    description: "AI checks your Google or Outlook calendar in real-time and proposes available times. Leads book appointments without leaving the chat.",
    color: "bg-green-100 text-green-600",
    details: [
      "Real-time availability checking",
      "Timezone-aware scheduling",
      "Google Calendar + Outlook integration",
      "Automatic confirmation messages",
    ],
  },
  {
    icon: CreditCard,
    title: "Instant Payments",
    description: "Generate Stripe payment links mid-conversation. Collect deposits and secure sales before leads shop around.",
    color: "bg-pink-100 text-pink-600",
    details: [
      "On-demand Stripe payment link generation",
      "Customizable deposit amounts",
      "Payment confirmation in chat",
      "AUD and multi-currency support",
    ],
  },
  {
    icon: RefreshCw,
    title: "CRM Sync",
    description: "Bidirectional HubSpot sync keeps everything in one place. AI automatically fills contact fields from conversations.",
    color: "bg-indigo-100 text-indigo-600",
    details: [
      "Bidirectional HubSpot sync",
      "Auto-fill contact properties",
      "Deal creation and stage updates",
      "Entity extraction (dates, venues, names)",
    ],
  },
  {
    icon: MessageSquare,
    title: "Human-in-the-Loop",
    description: "Take over any conversation with one tap. AI provides ghostwritten suggestions you can send instantly or edit first.",
    color: "bg-teal-100 text-teal-600",
    details: [
      "One-tap conversation takeover",
      "AI ghostwritten reply suggestions",
      "Seamless AI-to-human handoff",
      "Conversation context preserved",
    ],
  },
  {
    icon: Shield,
    title: "Australian Compliance",
    description: "Built for Australian Privacy Principles. AI identifies itself, honors opt-outs, and stores data in Australian regions.",
    color: "bg-red-100 text-red-600",
    details: [
      "APP-compliant data handling",
      "AI transparency (self-identifies)",
      "Automatic opt-out processing",
      "Sydney-region data storage",
    ],
  },
  {
    icon: Zap,
    title: "RAG Knowledge Base",
    description: "Upload your pricing sheets, brochures, legal documents, and FAQs. AI learns your business and answers questions accurately.",
    color: "bg-amber-100 text-amber-600",
    details: [
      "PDF, text, and document uploads",
      "Automatic chunking and embedding",
      "Retrieval-augmented generation",
      "Accurate, citation-backed answers",
    ],
  },
  {
    icon: BarChart3,
    title: "Analytics Dashboard",
    description: "Track response times, conversion rates, channel performance, and AI accuracy. Know exactly what's working.",
    color: "bg-cyan-100 text-cyan-600",
    details: [
      "Response latency tracking",
      "Conversion funnel visualization",
      "Channel performance comparison",
      "AI handoff rate metrics",
    ],
  },
  {
    icon: Users,
    title: "Lead Temperature",
    description: "Real-time lead temperature tracking. See which leads are hot (active in last 10 minutes) and need attention right now.",
    color: "bg-rose-100 text-rose-600",
    details: [
      "Real-time temperature indicators",
      "Pulse animation on hot leads",
      "Automatic temperature decay",
      "Priority notification for hot leads",
    ],
  },
  {
    icon: Globe,
    title: "Embeddable Web Chat",
    description: "Add a beautiful chat widget to your website with one line of code. Capture leads 24/7 even while you sleep.",
    color: "bg-emerald-100 text-emerald-600",
    details: [
      "One-line embed code",
      "Customizable colors and branding",
      "Mobile-responsive design",
      "Lead capture form built in",
    ],
  },
];

export default function FeaturesPage() {
  return (
    <div>
      <SectionHeroDark
        eyebrow="Feature Matrix"
        title={
          <>
            Every feature you need to{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              convert leads on autopilot
            </span>
          </>
        }
        subtitle="LeadFlow AI combines omni-channel messaging, intelligent AI agents, and powerful integrations into one platform."
      />

      {/* Feature Grid */}
      <section className="relative isolate overflow-hidden bg-slate-950 py-24 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 80%)",
          }}
        />
        <div className="pointer-events-none absolute top-1/4 left-0 h-[460px] w-[460px] rounded-full bg-violet-600/15 blur-[120px]" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[460px] w-[460px] rounded-full bg-cyan-500/15 blur-[120px]" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <ScrollReveal key={feature.title} delay={i * 80}>
                  <SpotlightCard className="h-full p-8">
                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-gradient-to-br from-cyan-500/20 to-violet-600/20 text-cyan-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-3 text-xl font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="mb-5 text-sm leading-relaxed text-slate-300">
                      {feature.description}
                    </p>
                    <ul className="space-y-2">
                      {feature.details.map((detail) => (
                        <li
                          key={detail}
                          className="flex items-start gap-2 text-sm text-slate-400"
                        >
                          <Zap className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </SpotlightCard>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate overflow-hidden bg-slate-950 py-24 text-white">
        <div
          aria-hidden
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(148,163,184,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 70% 60% at 50% 40%, black 40%, transparent 80%)",
          }}
        />
        <div className="pointer-events-none absolute -top-20 left-1/2 h-[360px] w-[360px] -translate-x-1/2 rounded-full bg-fuchsia-500/20 blur-[120px]" />

        <ScrollReveal>
          <div className="relative z-10 mx-auto max-w-4xl px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to see it{" "}
              <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                in action
              </span>
              ?
            </h2>
            <p className="mb-8 text-lg text-slate-300">
              Start your free trial today. No credit card required.
            </p>
            <Link
              href="/register"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-8 py-4 text-lg font-semibold text-white shadow-[0_0_40px_-8px_rgba(139,92,246,0.6)] transition hover:shadow-[0_0_60px_-6px_rgba(139,92,246,0.9)]"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transition duration-700 group-hover:translate-x-full" />
              Start Free Trial
              <ArrowRight className="h-5 w-5 transition group-hover:translate-x-0.5" />
            </Link>
          </div>
        </ScrollReveal>
      </section>
    </div>
  );
}
