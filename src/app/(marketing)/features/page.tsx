import Link from "next/link";
import {
  Radio, Sparkles, Filter, Calendar, CreditCard, RefreshCw,
  MessageSquare, Shield, Zap, BarChart3, Users, Globe,
} from "lucide-react";

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
    <div className="py-20">
      {/* Header */}
      <div className="max-w-4xl mx-auto text-center px-4 mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Every feature you need to{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            convert leads on autopilot
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          LeadFlow AI combines omni-channel messaging, intelligent AI agents,
          and powerful integrations into one platform.
        </p>
      </div>

      {/* Feature Grid */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-lg transition-shadow"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-5`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 mb-5">{feature.description}</p>
                <ul className="space-y-2">
                  {feature.details.map((detail) => (
                    <li key={detail} className="flex items-start gap-2 text-sm text-gray-500">
                      <Zap className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto text-center px-4 mt-20">
        <h2 className="text-3xl font-bold mb-4">Ready to see it in action?</h2>
        <p className="text-gray-600 mb-8">Start your free trial today. No credit card required.</p>
        <Link
          href="/register"
          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Start Free Trial
        </Link>
      </div>
    </div>
  );
}
