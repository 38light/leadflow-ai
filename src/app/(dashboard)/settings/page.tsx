import Link from "next/link";

const settingsSections = [
  { href: "/settings/profile" as const, title: "Profile", description: "Business name, timezone, and contact info" },
  { href: "/settings/integrations" as const, title: "Integrations", description: "Connect HubSpot, Twilio, Meta, and more" },
  { href: "/settings/ai" as const, title: "AI Configuration", description: "Customize AI agent behavior and prompts" },
  { href: "/settings/billing" as const, title: "Billing", description: "Manage your subscription and usage" },
  { href: "/settings/compliance" as const, title: "Compliance", description: "Opt-out rules, AI transparency, and data sovereignty" },
  { href: "/settings/team" as const, title: "Team", description: "Invite team members and manage their roles" },
  { href: "/settings/api-keys" as const, title: "API Keys", description: "Integrate LeadFlow AI with your own apps and tools" },
  { href: "/settings/webhooks" as const, title: "Webhooks", description: "Receive real-time events in your own systems" },
  { href: "/settings/slack" as const, title: "Slack", description: "Get notified in Slack when hot leads or bookings come in" },
  { href: "/settings/agency" as const, title: "Agency", description: "Manage client sub-accounts under your agency plan" },
  { href: "/settings/widget" as const, title: "Chat Widget", description: "Embed the web chat widget on your website" },
  { href: "/settings/automation" as const, title: "Automation", description: "Follow-up waterfall rules for stalled contacts" },
  { href: "/referrals" as const, title: "Referrals", description: "Invite friends and earn credits when they sign up" },
];

export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Settings</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {settingsSections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="bg-white border rounded-lg p-6 hover:shadow-sm transition-shadow"
          >
            <h3 className="font-semibold">{section.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{section.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
