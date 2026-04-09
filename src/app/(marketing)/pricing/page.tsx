import Link from "next/link";
import { Check, X, Zap, HelpCircle } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "/mo",
    tagline: "Perfect for trying out LeadFlow",
    features: [
      { label: "1 channel", included: true },
      { label: "50 messages/month", included: true },
      { label: "25 AI responses/month", included: true },
      { label: "Basic lead capture", included: true },
      { label: "Web chat widget", included: true },
      { label: "HubSpot sync", included: false },
      { label: "Calendar integration", included: false },
      { label: "Voice channel", included: false },
      { label: "Priority support", included: false },
    ],
    cta: "Get Started",
    href: "/register" as const,
    style: "outline" as const,
  },
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
    tagline: "For solo operators ready to automate",
    features: [
      { label: "3 channels", included: true },
      { label: "500 messages/month", included: true },
      { label: "250 AI responses/month", included: true },
      { label: "Smart qualification", included: true },
      { label: "Knowledge base (3 docs)", included: true },
      { label: "Calendar integration", included: true },
      { label: "Stripe payments", included: true },
      { label: "HubSpot sync", included: false },
      { label: "Voice channel", included: false },
      { label: "Priority support", included: false },
    ],
    cta: "Start Free Trial",
    href: "/register" as const,
    style: "solid" as const,
  },
  {
    name: "Pro",
    price: "$149",
    period: "/mo",
    tagline: "For growing businesses that want it all",
    popular: true,
    features: [
      { label: "All 6 channels", included: true },
      { label: "5,000 messages/month", included: true },
      { label: "2,500 AI responses/month", included: true },
      { label: "Advanced AI agents", included: true },
      { label: "Unlimited knowledge base", included: true },
      { label: "HubSpot bidirectional sync", included: true },
      { label: "Calendar + booking", included: true },
      { label: "Stripe payments", included: true },
      { label: "Priority support", included: true },
      { label: "Custom AI prompts", included: true },
    ],
    cta: "Start Free Trial",
    href: "/register" as const,
    style: "gradient" as const,
  },
  {
    name: "Enterprise",
    price: "Custom",
    tagline: "For teams and agencies at scale",
    features: [
      { label: "Unlimited everything", included: true },
      { label: "Custom integrations", included: true },
      { label: "Dedicated account manager", included: true },
      { label: "SLA guarantee (99.99%)", included: true },
      { label: "Custom AI training", included: true },
      { label: "White-label option", included: true },
      { label: "Data sovereignty controls", included: true },
      { label: "SSO & team management", included: true },
    ],
    cta: "Contact Sales",
    href: "mailto:sales@leadflow.ai",
    style: "dark" as const,
  },
];

const comparisonRows = [
  { feature: "Channels", free: "1", starter: "3", pro: "6", enterprise: "Unlimited" },
  { feature: "Messages / month", free: "50", starter: "500", pro: "5,000", enterprise: "Unlimited" },
  { feature: "AI Responses / month", free: "25", starter: "250", pro: "2,500", enterprise: "Unlimited" },
  { feature: "Knowledge Base", free: false, starter: "3 docs", pro: "Unlimited", enterprise: "Unlimited" },
  { feature: "Calendar Integration", free: false, starter: true, pro: true, enterprise: true },
  { feature: "Stripe Payments", free: false, starter: true, pro: true, enterprise: true },
  { feature: "HubSpot Sync", free: false, starter: false, pro: true, enterprise: true },
  { feature: "Voice Channel", free: false, starter: false, pro: true, enterprise: true },
  { feature: "Custom AI Prompts", free: false, starter: false, pro: true, enterprise: true },
  { feature: "Priority Support", free: false, starter: false, pro: true, enterprise: true },
  { feature: "API Access", free: false, starter: "Read-only", pro: "Full", enterprise: "Full" },
  { feature: "White Label", free: false, starter: false, pro: false, enterprise: true },
];

const faqs = [
  {
    q: "Can I change plans anytime?",
    a: "Yes. Upgrade or downgrade at any time. Changes take effect at the next billing cycle. If you upgrade mid-cycle, you'll be charged the prorated difference.",
  },
  {
    q: "What happens when I hit my message limit?",
    a: "We'll notify you at 80% and 100% of your limit. You can upgrade instantly or wait for the next billing cycle. We never cut off active conversations mid-flow.",
  },
  {
    q: "Do you offer annual billing?",
    a: "Yes! Save 20% with annual billing on Starter and Pro plans. Contact us at billing@leadflow.ai for details.",
  },
  {
    q: "Is there a setup fee?",
    a: "No. All plans are self-service with zero setup fees. Enterprise plans include complimentary onboarding and white-glove setup.",
  },
  {
    q: "Can I try Pro features before committing?",
    a: "Every plan comes with a 14-day free trial of Pro features. No credit card required. After 14 days, you choose the plan that fits.",
  },
];

function CellContent({ value }: { value: string | boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-50">
        <Check className="w-4 h-4 text-green-600" />
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-50">
        <X className="w-4 h-4 text-gray-300" />
      </span>
    );
  }
  return <span className="text-sm font-semibold text-gray-900">{value}</span>;
}

function getButtonClasses(style: string, popular: boolean) {
  const base = "mt-8 block w-full rounded-xl py-3.5 text-center text-sm font-semibold transition-all duration-200";
  switch (style) {
    case "outline":
      return `${base} border-2 border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50`;
    case "solid":
      return `${base} bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow-md`;
    case "gradient":
      return `${base} bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 ${popular ? "py-4 text-base" : ""}`;
    case "dark":
      return `${base} bg-gray-900 text-white hover:bg-gray-800 shadow-sm`;
    default:
      return base;
  }
}

export default function PricingPage() {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative pt-20 pb-8 text-center px-4 overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-blue-50 via-purple-50/30 to-transparent rounded-full blur-3xl" />
        </div>
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 text-blue-700 text-sm font-medium mb-6">
          <Zap className="w-4 h-4" />
          14-day free trial on all plans
        </div>
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900">
          Simple, transparent pricing
        </h1>
        <p className="mt-5 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
          Start free. Upgrade when you&apos;re ready. No surprises, no hidden fees.
        </p>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 pt-8 pb-24">
        <div className="mx-auto max-w-7xl grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-2xl p-8 transition-all duration-200 ${
                plan.popular
                  ? "bg-white ring-2 ring-blue-600 shadow-2xl shadow-blue-500/10 scale-[1.02] z-10"
                  : "bg-white ring-1 ring-gray-200 shadow-sm hover:shadow-lg hover:ring-gray-300"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-1.5 text-xs font-bold tracking-wide text-white uppercase shadow-md">
                    <Zap className="w-3.5 h-3.5" />
                    Most Popular
                  </span>
                </div>
              )}

              <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>

              <div className="mt-5 flex items-baseline gap-1">
                <span
                  className={`text-5xl font-extrabold tracking-tight ${
                    plan.popular
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
                      : "text-gray-900"
                  }`}
                >
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-lg text-gray-400 font-medium">{plan.period}</span>
                )}
              </div>

              <p className="mt-2 text-sm text-gray-500">{plan.tagline}</p>

              <div className="my-6 h-px bg-gray-100" />

              <ul className="flex-1 space-y-3">
                {plan.features.map((f) => (
                  <li
                    key={f.label}
                    className={`flex items-start gap-3 text-sm ${
                      f.included ? "text-gray-700" : "text-gray-400"
                    }`}
                  >
                    {f.included ? (
                      <Check className="mt-0.5 w-4 h-4 shrink-0 text-green-500" />
                    ) : (
                      <X className="mt-0.5 w-4 h-4 shrink-0 text-gray-300" />
                    )}
                    <span>{f.label}</span>
                  </li>
                ))}
              </ul>

              {plan.href.startsWith("mailto:") ? (
                <a href={plan.href} className={getButtonClasses(plan.style, !!plan.popular)}>
                  {plan.cta}
                </a>
              ) : (
                <Link href={plan.href as "/register"} className={getButtonClasses(plan.style, !!plan.popular)}>
                  {plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>

        <p className="text-center text-sm text-gray-400 mt-8">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </section>

      {/* Feature Comparison Table */}
      <section className="bg-gray-50 py-24 px-4">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-2">
            Compare plans in detail
          </h2>
          <p className="text-center text-gray-500 mb-12">
            Everything you need at every stage of growth.
          </p>

          <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="py-5 px-6 text-left text-sm font-semibold text-gray-500 w-[200px]">
                    Feature
                  </th>
                  <th className="py-5 px-6 text-center text-sm font-semibold text-gray-500">Free</th>
                  <th className="py-5 px-6 text-center text-sm font-semibold text-gray-500">Starter</th>
                  <th className="py-5 px-6 text-center text-sm font-semibold text-blue-600">
                    <div className="flex items-center justify-center gap-1">
                      Pro
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold uppercase">Popular</span>
                    </div>
                  </th>
                  <th className="py-5 px-6 text-center text-sm font-semibold text-gray-500">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="py-4 px-6 text-sm font-medium text-gray-700">
                      {row.feature}
                    </td>
                    {([row.free, row.starter, row.pro, row.enterprise] as (string | boolean)[]).map((val, ci) => (
                      <td key={ci} className="py-4 px-6 text-center">
                        <CellContent value={val} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-24 px-4">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-center gap-2 mb-2">
            <HelpCircle className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">FAQ</span>
          </div>
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
            Frequently asked questions
          </h2>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-gray-300 transition-colors"
              >
                <summary className="flex cursor-pointer items-center justify-between px-6 py-5 text-sm font-semibold text-gray-900 select-none list-none [&::-webkit-details-marker]:hidden">
                  <span>{faq.q}</span>
                  <span className="ml-4 shrink-0 w-6 h-6 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all duration-200 group-open:rotate-45 group-open:bg-blue-100 group-open:text-blue-600">
                    <span className="text-lg leading-none">+</span>
                  </span>
                </summary>
                <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-3xl text-center rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 px-8 py-16 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white">
              Still not sure? Start with Free.
            </h2>
            <p className="mt-3 text-blue-100 max-w-md mx-auto">
              No credit card required. Full access to core features. Upgrade anytime.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-gray-900 shadow-lg hover:bg-gray-50 transition-all hover:shadow-xl"
            >
              Create Free Account
              <Zap className="w-4 h-4 text-blue-600" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
