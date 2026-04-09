import Link from "next/link";

const settingsSections = [
  { href: "/settings/profile" as const, title: "Profile", description: "Business name, timezone, and contact info" },
  { href: "/settings/integrations" as const, title: "Integrations", description: "Connect HubSpot, Twilio, Meta, and more" },
  { href: "/settings/ai" as const, title: "AI Configuration", description: "Customize AI agent behavior and prompts" },
  { href: "/settings/billing" as const, title: "Billing", description: "Manage your subscription and usage" },
  { href: "/settings/compliance" as const, title: "Compliance", description: "Opt-out rules, AI transparency, and data sovereignty" },
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
