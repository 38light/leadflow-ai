import Link from "next/link";
import { Zap, Heart, Shield, Globe } from "lucide-react";

const values = [
  {
    icon: Zap,
    title: "Speed Wins",
    description: "In service businesses, the first to respond wins the client. We built LeadFlow to make sure that first responder is always you — powered by AI that never sleeps.",
  },
  {
    icon: Heart,
    title: "Human at Heart",
    description: "AI should enhance human connection, not replace it. Our human-in-the-loop design means you stay in control. AI handles the repetitive; you handle the personal.",
  },
  {
    icon: Shield,
    title: "Trust & Transparency",
    description: "Our AI identifies itself. Your data stays in Australia. Leads can opt out anytime. We believe automation and ethics aren't mutually exclusive.",
  },
  {
    icon: Globe,
    title: "Built for Australia",
    description: "From APP compliance to ACCC guidelines, LeadFlow is built from the ground up for Australian service businesses. Sydney-hosted, AUD-first, timezone-aware.",
  },
];

const stats = [
  { value: "15s", label: "Average AI response time" },
  { value: "500+", label: "Businesses using LeadFlow" },
  { value: "2.4M", label: "Messages processed" },
  { value: "94%", label: "Lead satisfaction rate" },
];

export default function AboutPage() {
  return (
    <div className="py-20">
      {/* Hero */}
      <div className="max-w-4xl mx-auto text-center px-4 mb-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          We&apos;re building the future of{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            service business automation
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          LeadFlow AI was born from a simple observation: service businesses lose
          clients because they can&apos;t respond fast enough. We&apos;re fixing that with
          intelligent AI that works 24/7 as your Chief of Staff.
        </p>
      </div>

      {/* Stats */}
      <div className="max-w-5xl mx-auto px-4 mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Story */}
      <div className="max-w-3xl mx-auto px-4 mb-20">
        <h2 className="text-3xl font-bold mb-6">Our Story</h2>
        <div className="prose prose-lg text-gray-600 space-y-4">
          <p>
            It started with a missed Instagram DM. A marriage celebrant in Sydney
            lost a $3,000 booking because she didn&apos;t see the message until Monday
            morning — by then, the couple had booked someone else.
          </p>
          <p>
            That moment sparked a question: what if every service business had an
            AI assistant that could respond instantly, qualify leads intelligently,
            and even close the sale — all while the business owner was doing what
            they do best: serving their clients?
          </p>
          <p>
            LeadFlow AI is the answer. We combine the reasoning power of Claude AI
            with omni-channel messaging, CRM integration, and payment processing to
            create an autonomous &quot;Chief of Staff&quot; for service businesses.
          </p>
          <p>
            Today, hundreds of Australian businesses use LeadFlow to capture, qualify,
            and convert leads across WhatsApp, Instagram, SMS, Voice, and Web Chat —
            automatically, ethically, and compliantly.
          </p>
        </div>
      </div>

      {/* Values */}
      <div className="bg-gray-50 py-20 mb-20">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {values.map((value) => {
              const Icon = value.icon;
              return (
                <div key={value.title} className="bg-white rounded-2xl p-8 border">
                  <Icon className="w-8 h-8 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-3">{value.title}</h3>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto text-center px-4">
        <h2 className="text-3xl font-bold mb-4">Join the movement</h2>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">
          Start converting leads on autopilot. Free 14-day trial, no credit card required.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Get Started Free
        </Link>
      </div>
    </div>
  );
}
