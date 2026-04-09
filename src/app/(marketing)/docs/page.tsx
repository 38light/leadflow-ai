import type { Metadata } from "next";
import Link from "next/link";
import {
  Search,
  BookOpen,
  Radio,
  Sparkles,
  BarChart3,
  CreditCard,
  Shield,
  Zap,
  ArrowRight,
  Clock,
  MessageSquare,
  Calendar,
  Globe,
  Settings,
  FileText,
  HelpCircle,
  ExternalLink,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Documentation — LeadFlow AI",
  description:
    "Everything you need to get started and succeed with LeadFlow AI. Guides, API docs, and more.",
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const quickStartCards = [
  {
    icon: BookOpen,
    title: "Getting Started",
    time: "10 min read",
    description:
      "Create your account, connect your first channel, and upload your knowledge base.",
    href: "/docs/getting-started",
    color: "bg-blue-100 text-blue-600",
    accent: "group-hover:border-blue-300",
  },
  {
    icon: Radio,
    title: "Channel Setup",
    time: "15 min read",
    description:
      "How to connect WhatsApp, Instagram, SMS, Voice, and Web Chat to your account.",
    href: "#",
    color: "bg-green-100 text-green-600",
    accent: "group-hover:border-green-300",
  },
  {
    icon: Sparkles,
    title: "AI Configuration",
    time: "12 min read",
    description:
      "Customize your AI agents, system prompts, and knowledge base for best results.",
    href: "#",
    color: "bg-purple-100 text-purple-600",
    accent: "group-hover:border-purple-300",
  },
  {
    icon: BarChart3,
    title: "Dashboard Guide",
    time: "8 min read",
    description:
      "Understanding your unified inbox, contacts, lead scoring, and analytics.",
    href: "#",
    color: "bg-orange-100 text-orange-600",
    accent: "group-hover:border-orange-300",
  },
];

interface DocLink {
  label: string;
  href: string;
}

interface DocCategory {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  color: string;
  links: DocLink[];
}

const categories: DocCategory[] = [
  {
    icon: Radio,
    title: "Channels",
    color: "bg-blue-100 text-blue-600",
    links: [
      { label: "WhatsApp Setup", href: "#" },
      { label: "Instagram & Facebook Setup", href: "#" },
      { label: "SMS Setup", href: "#" },
      { label: "Voice Setup", href: "#" },
      { label: "Web Chat Widget", href: "#" },
    ],
  },
  {
    icon: Sparkles,
    title: "AI & Automation",
    color: "bg-purple-100 text-purple-600",
    links: [
      { label: "Knowledge Base", href: "#" },
      { label: "AI Agent Configuration", href: "#" },
      { label: "Custom Prompts", href: "#" },
      { label: "Human-in-the-Loop Mode", href: "#" },
    ],
  },
  {
    icon: Calendar,
    title: "Integrations",
    color: "bg-green-100 text-green-600",
    links: [
      { label: "HubSpot Sync", href: "#" },
      { label: "Google Calendar", href: "#" },
      { label: "Outlook Calendar", href: "#" },
      { label: "Stripe Payments", href: "#" },
    ],
  },
  {
    icon: MessageSquare,
    title: "Dashboard",
    color: "bg-orange-100 text-orange-600",
    links: [
      { label: "Unified Inbox", href: "#" },
      { label: "Contact Management", href: "#" },
      { label: "Lead Scoring", href: "#" },
      { label: "Analytics & Reports", href: "#" },
    ],
  },
  {
    icon: Settings,
    title: "Account",
    color: "bg-indigo-100 text-indigo-600",
    links: [
      { label: "Billing & Plans", href: "#" },
      { label: "Team Management", href: "#" },
      { label: "Profile Settings", href: "#" },
      { label: "API Keys", href: "#" },
    ],
  },
  {
    icon: Shield,
    title: "Compliance",
    color: "bg-red-100 text-red-600",
    links: [
      { label: "Australian Privacy Principles", href: "#" },
      { label: "Data Export", href: "#" },
      { label: "Opt-Out Handling", href: "#" },
      { label: "AI Transparency", href: "#" },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DocsPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[80rem] h-[40rem] bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.06),transparent_70%)]"
      />

      {/* ---- Hero ---- */}
      <section className="relative pt-24 pb-16 text-center px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-1.5 text-sm font-medium text-blue-700">
            <FileText className="h-4 w-4" />
            Help Center
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
            Documentation
          </h1>
          <p className="mt-4 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto">
            Everything you need to get started and succeed with LeadFlow AI.
            Guides, tutorials, and API reference.
          </p>

          {/* Search bar */}
          <div className="mt-10 mx-auto max-w-xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search documentation..."
                className="w-full rounded-xl border border-gray-300 bg-white py-3.5 pl-12 pr-4 text-base text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
                readOnly
              />
              <kbd className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs font-medium text-gray-400">
                Ctrl K
              </kbd>
            </div>
          </div>
        </div>
      </section>

      {/* ---- Quick Start Guide ---- */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white">
              <Zap className="h-4 w-4" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Quick Start Guide
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {quickStartCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link
                  key={card.title}
                  href={card.href as never}
                  className={`group relative flex flex-col rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg ${card.accent}`}
                >
                  <div className="flex items-start justify-between">
                    <div
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-lg ${card.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                      <Clock className="h-3 w-3" />
                      {card.time}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {card.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-500 flex-1">
                    {card.description}
                  </p>
                  <div className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
                    Read guide
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---- Documentation Categories ---- */}
      <section className="bg-gray-50/80 px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 text-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Browse by Category
            </h2>
            <p className="mt-2 text-gray-500">
              Find exactly what you need in our organized documentation.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const Icon = cat.icon;
              return (
                <div
                  key={cat.title}
                  className="rounded-xl border border-gray-200 bg-white p-6 transition hover:shadow-md"
                >
                  <div className="flex items-center gap-3 mb-5">
                    <div
                      className={`inline-flex h-10 w-10 items-center justify-center rounded-lg ${cat.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {cat.title}
                    </h3>
                  </div>
                  <ul className="space-y-2.5">
                    {cat.links.map((link) => (
                      <li key={link.label}>
                        <a
                          href={link.href}
                          className="group/link flex items-center justify-between text-sm text-gray-600 hover:text-blue-600 transition-colors"
                        >
                          <span>{link.label}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-gray-300 transition-all group-hover/link:text-blue-500 group-hover/link:translate-x-0.5" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---- Popular Resources ---- */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-6 sm:grid-cols-3">
            <Link
              href="/api-docs"
              className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 transition hover:shadow-md hover:border-blue-200"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-600 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                <Globe className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  API Reference
                </h3>
                <p className="text-sm text-gray-500">
                  Build custom integrations
                </p>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
            </Link>

            <Link
              href="/blog"
              className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 transition hover:shadow-md hover:border-purple-200"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-600 group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-purple-600 transition-colors">
                  Blog
                </h3>
                <p className="text-sm text-gray-500">
                  Tips, guides, and insights
                </p>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 text-gray-300 group-hover:text-purple-500 transition-colors" />
            </Link>

            <Link
              href="/pricing"
              className="group flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-6 transition hover:shadow-md hover:border-green-200"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-600 transition-colors">
                <CreditCard className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors">
                  Pricing
                </h3>
                <p className="text-sm text-gray-500">
                  Plans and billing details
                </p>
              </div>
              <ExternalLink className="ml-auto h-4 w-4 text-gray-300 group-hover:text-green-500 transition-colors" />
            </Link>
          </div>
        </div>
      </section>

      {/* ---- Support CTA ---- */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl text-center rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 px-8 py-14 shadow-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <HelpCircle className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Can&apos;t find what you need?
          </h2>
          <p className="mt-2 text-gray-400 max-w-md mx-auto">
            Our support team is here to help. Reach out and we&apos;ll get you
            sorted within 24 hours.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-100"
            >
              <MessageSquare className="h-4 w-4" />
              Contact Support
            </Link>
            <a
              href="mailto:support@leadflow.ai"
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Email Us
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
