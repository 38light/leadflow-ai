import Link from "next/link";
import {
  Check,
  X,
  Minus,
  Store,
  Brain,
  Flag,
  Banknote,
  UserPlus,
  Link2,
  Upload,
  ArrowRight,
} from "lucide-react";

type CellValue =
  | { type: "check"; text?: string }
  | { type: "x"; text?: string }
  | { type: "partial"; text?: string };

interface ComparisonRow {
  feature: string;
  leadflow: CellValue;
  traditional: CellValue;
  chatbots: CellValue;
  competitors: CellValue;
}

const comparisonData: ComparisonRow[] = [
  {
    feature: "AI Response Speed",
    leadflow: { type: "check", text: "< 15 seconds" },
    traditional: { type: "x", text: "Hours / days" },
    chatbots: { type: "check", text: "Instant" },
    competitors: { type: "check", text: "30-60 seconds" },
  },
  {
    feature: "Channel Coverage",
    leadflow: { type: "check", text: "7 channels" },
    traditional: { type: "partial", text: "1-2 channels" },
    chatbots: { type: "partial", text: "Web only" },
    competitors: { type: "partial", text: "2-3 channels" },
  },
  {
    feature: "Lead Qualification",
    leadflow: { type: "check", text: "AI-powered" },
    traditional: { type: "partial", text: "Manual" },
    chatbots: { type: "partial", text: "Rule-based" },
    competitors: { type: "partial", text: "Basic scoring" },
  },
  {
    feature: "Calendar Booking",
    leadflow: { type: "check", text: "In-chat booking" },
    traditional: { type: "x", text: "Separate tool" },
    chatbots: { type: "x", text: "No" },
    competitors: { type: "partial", text: "Link only" },
  },
  {
    feature: "CRM Sync",
    leadflow: { type: "check", text: "HubSpot bi-sync" },
    traditional: { type: "partial", text: "Manual entry" },
    chatbots: { type: "x", text: "No" },
    competitors: { type: "partial", text: "One-way" },
  },
  {
    feature: "Payment Collection",
    leadflow: { type: "check", text: "Stripe in-chat" },
    traditional: { type: "x", text: "Invoice later" },
    chatbots: { type: "x", text: "No" },
    competitors: { type: "x", text: "No" },
  },
  {
    feature: "Knowledge Base (RAG)",
    leadflow: { type: "check", text: "Upload docs" },
    traditional: { type: "x", text: "N/A" },
    chatbots: { type: "partial", text: "FAQ only" },
    competitors: { type: "partial", text: "Basic" },
  },
  {
    feature: "Human Handoff",
    leadflow: { type: "check", text: "One-tap takeover" },
    traditional: { type: "check", text: "Always human" },
    chatbots: { type: "partial", text: "Clunky" },
    competitors: { type: "check", text: "Supported" },
  },
  {
    feature: "Australian Compliance",
    leadflow: { type: "check", text: "APP-compliant" },
    traditional: { type: "partial", text: "Varies" },
    chatbots: { type: "x", text: "US-centric" },
    competitors: { type: "x", text: "US/EU only" },
  },
  {
    feature: "Pricing",
    leadflow: { type: "check", text: "From $99/mo AUD" },
    traditional: { type: "partial", text: "Staff costs" },
    chatbots: { type: "check", text: "Free / cheap" },
    competitors: { type: "partial", text: "$$$ USD" },
  },
];

const differentiators = [
  {
    icon: Store,
    title: "Built for service businesses, not SaaS",
    description:
      "We understand celebrants, photographers, planners, and trades. Our AI is trained for real service business conversations, not generic customer support.",
    color: "bg-pink-100 text-pink-600",
  },
  {
    icon: Brain,
    title: "Real AI, not decision trees",
    description:
      "Claude-powered reasoning means your AI understands context, intent, and nuance. No keyword matching. No rigid flows. Actual intelligence.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Flag,
    title: "Australian-first",
    description:
      "APP compliance, Sydney hosting, AUD pricing, local support, and timezone awareness. Built from the ground up for Australian businesses.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: Banknote,
    title: "Revenue-focused",
    description:
      "Calendar booking + Stripe payments built in, not bolted on. LeadFlow doesn't just capture leads — it closes them.",
    color: "bg-green-100 text-green-600",
  },
];

const migrationSteps = [
  {
    step: "1",
    icon: UserPlus,
    title: "Sign up",
    description: "Create your account in 30 seconds. Free 14-day trial, no credit card required.",
  },
  {
    step: "2",
    icon: Link2,
    title: "Connect channels",
    description:
      "Link WhatsApp, Instagram, SMS, or Web Chat with guided setup wizards.",
  },
  {
    step: "3",
    icon: Upload,
    title: "Upload docs",
    description:
      "Upload your pricing, FAQs, and brochures. AI handles the rest — you're live in minutes.",
  },
];

function CellIcon({ value }: { value: CellValue }) {
  if (value.type === "check") {
    return (
      <div className="flex flex-col items-center gap-1">
        <Check className="w-5 h-5 text-green-600" />
        {value.text && (
          <span className="text-xs text-gray-600">{value.text}</span>
        )}
      </div>
    );
  }
  if (value.type === "x") {
    return (
      <div className="flex flex-col items-center gap-1">
        <X className="w-5 h-5 text-red-400" />
        {value.text && (
          <span className="text-xs text-gray-400">{value.text}</span>
        )}
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <Minus className="w-5 h-5 text-amber-500" />
      {value.text && (
        <span className="text-xs text-gray-500">{value.text}</span>
      )}
    </div>
  );
}

export default function ComparePage() {
  return (
    <div className="py-20">
      {/* Hero */}
      <div className="max-w-4xl mx-auto text-center px-4 mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Why teams choose{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            LeadFlow AI
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          See how LeadFlow stacks up against the alternatives.
        </p>
      </div>

      {/* Comparison Table */}
      <div className="max-w-5xl mx-auto px-4 mb-20">
        <div className="overflow-x-auto">
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden min-w-[640px]">
            {/* Header */}
            <div className="grid grid-cols-5 bg-gray-50 border-b border-gray-200">
              <div className="px-6 py-4 font-semibold text-gray-700">
                Feature
              </div>
              <div className="px-4 py-4 text-center">
                <span className="font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  LeadFlow AI
                </span>
              </div>
              <div className="px-4 py-4 text-center font-semibold text-gray-500 text-sm">
                Traditional Methods
              </div>
              <div className="px-4 py-4 text-center font-semibold text-gray-500 text-sm">
                Generic Chatbots
              </div>
              <div className="px-4 py-4 text-center font-semibold text-gray-500 text-sm">
                Competitors
              </div>
            </div>

            {/* Rows */}
            {comparisonData.map((row, index) => (
              <div
                key={row.feature}
                className={`grid grid-cols-5 ${
                  index < comparisonData.length - 1
                    ? "border-b border-gray-100"
                    : ""
                }`}
              >
                <div className="px-6 py-4 font-medium text-gray-900 text-sm">
                  {row.feature}
                </div>
                <div className="px-4 py-4 flex justify-center bg-blue-50/30">
                  <CellIcon value={row.leadflow} />
                </div>
                <div className="px-4 py-4 flex justify-center">
                  <CellIcon value={row.traditional} />
                </div>
                <div className="px-4 py-4 flex justify-center">
                  <CellIcon value={row.chatbots} />
                </div>
                <div className="px-4 py-4 flex justify-center">
                  <CellIcon value={row.competitors} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What Makes LeadFlow Different */}
      <div className="bg-gray-50 py-20 mb-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            What makes LeadFlow different
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {differentiators.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="bg-white rounded-2xl p-8 border hover:shadow-lg transition-shadow"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center mb-4`}
                  >
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Migration Section */}
      <div className="max-w-4xl mx-auto px-4 mb-20">
        <h2 className="text-3xl font-bold text-center mb-4">
          Switching is easy
        </h2>
        <p className="text-gray-600 text-center mb-12 max-w-xl mx-auto">
          Get up and running in under 10 minutes. No developer needed.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {migrationSteps.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.step} className="text-center">
                <div className="w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <Icon className="w-6 h-6 text-blue-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto text-center px-4">
        <h2 className="text-3xl font-bold mb-4">
          See the difference yourself
        </h2>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">
          Start your free 14-day trial. No credit card required.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Start Free Trial
          <ArrowRight className="w-5 h-5" />
        </Link>
      </div>
    </div>
  );
}
