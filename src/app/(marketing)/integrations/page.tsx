import Link from "next/link";
import {
  MessageCircle, Instagram, Smartphone, Phone, Globe,
  RefreshCw, Calendar, CreditCard, Mail, Database, Zap,
} from "lucide-react";

const channels = [
  {
    icon: MessageCircle,
    name: "WhatsApp",
    description: "Two-way encrypted messaging via Twilio. Send and receive text, images, documents, and voice notes.",
    color: "bg-green-100 text-green-600",
    features: ["Automated responses", "Media sharing", "Delivery receipts", "Opt-out handling"],
    setup: "Connect via Twilio in 5 minutes",
  },
  {
    icon: Instagram,
    name: "Instagram DMs",
    description: "Monitor DMs and Story mentions in real-time via Meta Graph API. Reply instantly to every inquiry.",
    color: "bg-pink-100 text-pink-600",
    features: ["DM monitoring", "Story mention alerts", "Image sharing", "Rate-limited queuing"],
    setup: "Connect via Meta Business Suite",
  },
  {
    icon: Smartphone,
    name: "SMS",
    description: "Two-way SMS messaging via Twilio. Automatic opt-out compliance for Australian anti-spam laws.",
    color: "bg-blue-100 text-blue-600",
    features: ["Two-way messaging", "Anti-spam compliance", "STOP keyword handling", "Delivery status"],
    setup: "Connect via Twilio in 5 minutes",
  },
  {
    icon: Phone,
    name: "Voice",
    description: "AI-powered voice calls via Vapi. Answer calls, transcribe conversations, and qualify leads verbally.",
    color: "bg-orange-100 text-orange-600",
    features: ["AI voice answering", "Real-time transcription", "Call recording", "Verbal qualification"],
    setup: "Connect via Vapi integration",
  },
  {
    icon: Globe,
    name: "Web Chat",
    description: "Embeddable chat widget for your website. Capture leads 24/7 with a beautiful, customizable interface.",
    color: "bg-teal-100 text-teal-600",
    features: ["One-line embed code", "Custom branding", "Mobile responsive", "Lead capture forms"],
    setup: "Copy & paste one script tag",
  },
];

const integrations = [
  {
    icon: RefreshCw,
    name: "HubSpot",
    description: "Bidirectional CRM sync. Contacts, deals, and properties stay in perfect sync between LeadFlow and HubSpot.",
    color: "bg-orange-100 text-orange-600",
    features: ["Contact sync", "Deal creation", "Property mapping", "Entity extraction"],
    category: "CRM",
  },
  {
    icon: Calendar,
    name: "Google Calendar",
    description: "Real-time availability checking and appointment booking. AI proposes times and creates events automatically.",
    color: "bg-blue-100 text-blue-600",
    features: ["Availability checking", "Event creation", "Timezone handling", "Conflict detection"],
    category: "Scheduling",
  },
  {
    icon: Calendar,
    name: "Outlook Calendar",
    description: "Microsoft Calendar integration for businesses on the Microsoft ecosystem. Same features as Google Calendar.",
    color: "bg-indigo-100 text-indigo-600",
    features: ["Availability checking", "Event creation", "Microsoft 365 support", "Shared calendars"],
    category: "Scheduling",
  },
  {
    icon: CreditCard,
    name: "Stripe",
    description: "Generate payment links and collect deposits mid-conversation. AUD and multi-currency support.",
    color: "bg-purple-100 text-purple-600",
    features: ["Payment link generation", "Deposit collection", "Multi-currency", "Webhook notifications"],
    category: "Payments",
  },
  {
    icon: Zap,
    name: "Claude AI (Anthropic)",
    description: "Powered by Claude for intelligent, context-aware conversations. Not a chatbot — a reasoning engine.",
    color: "bg-amber-100 text-amber-600",
    features: ["Intent classification", "Sentiment analysis", "Tool calling", "Structured outputs"],
    category: "AI",
  },
  {
    icon: Database,
    name: "Supabase",
    description: "Real-time database, authentication, and storage. Australian-hosted for data sovereignty compliance.",
    color: "bg-emerald-100 text-emerald-600",
    features: ["Real-time updates", "Row Level Security", "Australian hosting", "File storage"],
    category: "Infrastructure",
  },
  {
    icon: Mail,
    name: "Resend",
    description: "Transactional email for notifications, booking confirmations, and system alerts.",
    color: "bg-cyan-100 text-cyan-600",
    features: ["Booking confirmations", "Lead notifications", "System alerts", "Custom templates"],
    category: "Email",
  },
];

export default function IntegrationsPage() {
  return (
    <div className="py-20">
      {/* Hero */}
      <div className="max-w-4xl mx-auto text-center px-4 mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Connects to{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            everything you use
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          LeadFlow AI integrates with your messaging channels, CRM, calendar,
          and payment processor — all working together seamlessly.
        </p>
      </div>

      {/* Channels Section */}
      <div className="max-w-6xl mx-auto px-4 mb-20">
        <h2 className="text-2xl font-bold mb-2">Messaging Channels</h2>
        <p className="text-gray-500 mb-8">Capture leads from every platform your clients use.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {channels.map((channel) => {
            const Icon = channel.icon;
            return (
              <div key={channel.name} className="bg-white border rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className={`w-12 h-12 rounded-xl ${channel.color} flex items-center justify-center mb-5`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{channel.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{channel.description}</p>
                <ul className="space-y-1.5 mb-4">
                  {channel.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-500">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      {f}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-blue-600 font-medium">{channel.setup}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Integrations Section */}
      <div className="bg-gray-50 py-20">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl font-bold mb-2">Platform Integrations</h2>
          <p className="text-gray-500 mb-8">Connect your existing tools and let AI bridge the gaps.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration) => {
              const Icon = integration.icon;
              return (
                <div key={integration.name} className="bg-white border rounded-2xl p-8 hover:shadow-lg transition-shadow">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-lg ${integration.color} flex items-center justify-center`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{integration.name}</h3>
                      <span className="text-xs text-gray-400">{integration.category}</span>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{integration.description}</p>
                  <ul className="space-y-1.5">
                    {integration.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-500">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* API Section */}
      <div className="max-w-4xl mx-auto text-center px-4 py-20">
        <h2 className="text-2xl font-bold mb-4">Build custom integrations</h2>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">
          Need something custom? Our REST API gives you full access to contacts,
          conversations, messages, and more.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/api-docs"
            className="inline-flex items-center justify-center px-6 py-3 border-2 border-gray-900 text-gray-900 rounded-xl font-semibold hover:bg-gray-900 hover:text-white transition-colors"
          >
            View API Docs
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Start Free Trial
          </Link>
        </div>
      </div>
    </div>
  );
}
