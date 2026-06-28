"use client";

import Link from "next/link";
import { useState } from "react";
import { Check, X, Zap, HelpCircle } from "lucide-react";
import {
  ScrollReveal,
  SectionHeroDark,
  SpotlightCard,
} from "@/components/marketing";

type BillingPeriod = "monthly" | "yearly";

interface PlanFeature {
  label: string;
  included: boolean;
}

interface PlanDef {
  name: string;
  monthlyPriceCents: number | null; // null => "Custom"
  tagline: string;
  popular?: boolean;
  features: PlanFeature[];
  cta: string;
  href: string;
  style: "outline" | "solid" | "gradient" | "dark";
}

const plans: PlanDef[] = [
  {
    name: "Free",
    monthlyPriceCents: 0,
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
    href: "/register",
    style: "outline",
  },
  {
    name: "Starter",
    monthlyPriceCents: 4900,
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
    href: "/register",
    style: "solid",
  },
  {
    name: "Pro",
    monthlyPriceCents: 14900,
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
    href: "/register",
    style: "gradient",
  },
  {
    name: "Enterprise",
    monthlyPriceCents: null,
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
    style: "dark",
  },
];

const ANNUAL_DISCOUNT = 0.2; // 20% off annual

function formatDollars(cents: number): string {
  const dollars = cents / 100;
  return Number.isInteger(dollars)
    ? `$${dollars}`
    : `$${dollars.toFixed(2).replace(/\.00$/, "")}`;
}

interface PriceDisplay {
  price: string;
  period: string | null;
  savingsLabel: string | null;
  monthlyEquivalentLabel: string | null;
}

function getPriceDisplay(plan: PlanDef, billing: BillingPeriod): PriceDisplay {
  if (plan.monthlyPriceCents === null) {
    return { price: "Custom", period: null, savingsLabel: null, monthlyEquivalentLabel: null };
  }
  if (plan.monthlyPriceCents === 0) {
    return { price: "$0", period: "/mo", savingsLabel: null, monthlyEquivalentLabel: null };
  }
  if (billing === "monthly") {
    return {
      price: formatDollars(plan.monthlyPriceCents),
      period: "/mo",
      savingsLabel: null,
      monthlyEquivalentLabel: null,
    };
  }
  // yearly: same monthly tier with 20% off, billed annually
  const discountedMonthly = Math.round(plan.monthlyPriceCents * (1 - ANNUAL_DISCOUNT));
  const annualSavingsCents = (plan.monthlyPriceCents - discountedMonthly) * 12;
  const annualTotalCents = discountedMonthly * 12;
  return {
    price: formatDollars(discountedMonthly),
    period: "/mo",
    savingsLabel: `Save ${formatDollars(annualSavingsCents)}/year`,
    monthlyEquivalentLabel: `${formatDollars(annualTotalCents)} billed yearly`,
  };
}

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
      return `${base} bg-gradient-to-r from-cyan-500 to-violet-600 text-white hover:from-cyan-600 hover:to-violet-700 shadow-lg shadow-cyan-500/25 hover:shadow-xl hover:shadow-violet-500/30 ${popular ? "py-4 text-base" : ""}`;
    case "dark":
      return `${base} bg-gray-900 text-white hover:bg-gray-800 shadow-sm`;
    default:
      return base;
  }
}

export default function PricingPage() {
  const [billing, setBilling] = useState<BillingPeriod>("monthly");

  return (
    <div className="bg-white">
      <SectionHeroDark
        eyebrow="Pricing"
        title={<>Simple, transparent pricing</>}
        subtitle="Start free. Upgrade when you're ready. No surprises, no hidden fees."
      >
        <div className="flex flex-col items-center gap-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-950/40 px-4 py-1.5 text-sm font-medium text-cyan-200 backdrop-blur">
            <Zap className="h-4 w-4" />
            14-day free trial on all plans
          </div>

          {/* Billing toggle — dark theme */}
          <div
            role="tablist"
            aria-label="Billing period"
            className="relative inline-flex items-center rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur"
          >
            <button
              type="button"
              role="tab"
              aria-selected={billing === "monthly"}
              onClick={() => setBilling("monthly")}
              className={`relative z-10 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                billing === "monthly"
                  ? "bg-cyan-400/90 text-slate-950 shadow-sm shadow-cyan-500/30"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={billing === "yearly"}
              onClick={() => setBilling("yearly")}
              className={`relative z-10 inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                billing === "yearly"
                  ? "bg-cyan-400/90 text-slate-950 shadow-sm shadow-cyan-500/30"
                  : "text-slate-300 hover:text-white"
              }`}
            >
              Yearly
              <span className="inline-flex items-center rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </SectionHeroDark>

      {/* Pricing Cards */}
      <section className="px-4 pt-16 pb-24">
        <div className="mx-auto max-w-7xl grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4 items-stretch">
          {plans.map((plan, i) => {
            const display = getPriceDisplay(plan, billing);
            return (
              <ScrollReveal key={plan.name} delay={i * 100} className="h-full">
                <div className="relative h-full">
                  {plan.popular && (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute -inset-px rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 opacity-60 blur-sm -z-10 animate-pulse"
                    />
                  )}
                  <SpotlightCard
                    color="rgba(34,211,238,0.14)"
                    className={`h-full !border-gray-200 !bg-white hover:!border-gray-300 ${
                      plan.popular
                        ? "ring-2 ring-transparent shadow-2xl shadow-cyan-500/10"
                        : "shadow-sm hover:shadow-lg"
                    }`}
                  >
                    <div className="flex h-full flex-col p-8">
                      {plan.popular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-white shadow-md">
                            <Zap className="h-3.5 w-3.5" />
                            Most Popular
                          </span>
                        </div>
                      )}

                      <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>

                      <div className="mt-5 flex items-baseline gap-1">
                        <span
                          className={`text-5xl font-extrabold tracking-tight ${
                            plan.popular
                              ? "bg-gradient-to-r from-cyan-500 to-violet-600 bg-clip-text text-transparent"
                              : "text-gray-900"
                          }`}
                        >
                          {display.price}
                        </span>
                        {display.period && (
                          <span className="text-lg font-medium text-gray-400">{display.period}</span>
                        )}
                      </div>

                      {display.monthlyEquivalentLabel && (
                        <p className="mt-1 text-xs text-gray-500">{display.monthlyEquivalentLabel}</p>
                      )}
                      {display.savingsLabel && (
                        <p className="mt-1 inline-flex w-fit items-center rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 bg-clip-text px-0 text-xs font-bold text-transparent">
                          {display.savingsLabel}
                        </p>
                      )}

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
                              <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                            ) : (
                              <X className="mt-0.5 h-4 w-4 shrink-0 text-gray-300" />
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
                  </SpotlightCard>
                </div>
              </ScrollReveal>
            );
          })}
        </div>

        <p className="mt-8 text-center text-sm text-gray-400">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </section>

      {/* Feature Comparison Table */}
      <section className="bg-gray-50 px-4 py-24">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-3xl font-bold text-gray-900">
            Compare plans in detail
          </h2>
          <p className="mb-12 text-center text-gray-500">
            Everything you need at every stage of growth.
          </p>

          <div className="overflow-x-auto rounded-2xl bg-white ring-1 ring-gray-200 shadow-sm">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="w-[200px] px-6 py-5 text-left text-sm font-semibold text-gray-500">
                    Feature
                  </th>
                  <th className="px-6 py-5 text-center text-sm font-semibold text-gray-500">Free</th>
                  <th className="px-6 py-5 text-center text-sm font-semibold text-gray-500">Starter</th>
                  <th className="px-6 py-5 text-center text-sm font-semibold text-cyan-600">
                    <div className="flex items-center justify-center gap-1">
                      Pro
                      <span className="rounded-full bg-gradient-to-r from-cyan-500 to-violet-600 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                        Popular
                      </span>
                    </div>
                  </th>
                  <th className="px-6 py-5 text-center text-sm font-semibold text-gray-500">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-700">
                      {row.feature}
                    </td>
                    {([row.free, row.starter, row.pro, row.enterprise] as (string | boolean)[]).map((val, ci) => (
                      <td key={ci} className="px-6 py-4 text-center">
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
      <section className="px-4 py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-2 flex items-center justify-center gap-2">
            <HelpCircle className="h-5 w-5 text-cyan-600" />
            <span className="text-sm font-semibold uppercase tracking-wide text-cyan-600">FAQ</span>
          </div>
          <h2 className="mb-10 text-center text-3xl font-bold text-gray-900">
            Frequently asked questions
          </h2>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group overflow-hidden rounded-2xl border border-gray-200 bg-white transition-colors hover:border-gray-300"
              >
                <summary className="flex cursor-pointer select-none list-none items-center justify-between px-6 py-5 text-sm font-semibold text-gray-900 [&::-webkit-details-marker]:hidden">
                  <span>{faq.q}</span>
                  <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition-all duration-200 group-hover:bg-gray-200 group-open:rotate-45 group-open:bg-cyan-100 group-open:text-cyan-600">
                    <span className="text-lg leading-none">+</span>
                  </span>
                </summary>
                <div className="px-6 pb-5 text-sm leading-relaxed text-gray-600">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 pb-24">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500 via-blue-600 to-violet-700 px-8 py-16 text-center shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative">
            <h2 className="text-3xl font-bold text-white">
              Still not sure? Start with Free.
            </h2>
            <p className="mx-auto mt-3 max-w-md text-cyan-50">
              No credit card required. Full access to core features. Upgrade anytime.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-gray-900 shadow-lg transition-all hover:bg-gray-50 hover:shadow-xl"
            >
              Create Free Account
              <Zap className="h-4 w-4 text-cyan-600" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
