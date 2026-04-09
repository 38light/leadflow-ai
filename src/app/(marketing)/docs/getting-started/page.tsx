import type { Metadata } from "next";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  User,
  Building,
  Globe,
  FileText,
  MessageSquare,
  Rocket,
  AlertCircle,
  Copy,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Getting Started — LeadFlow AI Documentation",
  description:
    "Step-by-step guide to setting up your LeadFlow AI account, connecting channels, and going live in 10 minutes.",
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const tocItems = [
  { id: "prerequisites", label: "Prerequisites" },
  { id: "step-1", label: "Step 1: Create Your Account" },
  { id: "step-2", label: "Step 2: Business Profile" },
  { id: "step-3", label: "Step 3: Connect a Channel" },
  { id: "step-4", label: "Step 4: Knowledge Base" },
  { id: "step-5", label: "Step 5: Test Your AI" },
  { id: "step-6", label: "Step 6: Go Live" },
  { id: "whats-next", label: "What's Next" },
];

const nextSteps = [
  {
    title: "Channel Setup Deep Dive",
    description: "Connect WhatsApp, Instagram, SMS, Voice, and more.",
    href: "#",
  },
  {
    title: "AI Configuration",
    description: "Customize prompts, personas, and response style.",
    href: "#",
  },
  {
    title: "Dashboard Guide",
    description: "Master your inbox, contacts, and analytics.",
    href: "#",
  },
  {
    title: "API Reference",
    description: "Build custom integrations with the LeadFlow API.",
    href: "/api-docs",
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function GettingStartedPage() {
  return (
    <div className="relative">
      {/* Breadcrumb */}
      <div className="border-b border-gray-100 bg-gray-50/60">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link
              href="/docs"
              className="hover:text-blue-600 transition-colors"
            >
              Docs
            </Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 font-medium">Getting Started</span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="lg:grid lg:grid-cols-[1fr_260px] lg:gap-12">
          {/* ---- Main Content ---- */}
          <article className="max-w-3xl">
            {/* Header */}
            <div className="mb-10">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                <BookOpen className="h-3.5 w-3.5" />
                Guide
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900">
                Getting Started with LeadFlow AI
              </h1>
              <p className="mt-3 text-lg text-gray-500">
                Go from zero to your first AI-powered conversation in 10
                minutes. This guide walks you through every step.
              </p>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-400">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  10 min read
                </span>
                <span>Last updated: March 2026</span>
              </div>
            </div>

            {/* ---- Prerequisites ---- */}
            <section id="prerequisites" className="mb-12 scroll-mt-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Prerequisites
              </h2>
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-amber-800 mb-2">
                      Before you begin, make sure you have:
                    </p>
                    <ul className="space-y-1.5 text-sm text-amber-700">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                        A business email address (Gmail, Outlook, or custom
                        domain)
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                        A phone number for channel verification (WhatsApp, SMS)
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                        At least one document about your business (pricing
                        sheet, FAQ, brochure) for the knowledge base
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
                        5-10 minutes of uninterrupted time
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* ---- Step 1 ---- */}
            <section id="step-1" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-bold text-white">
                  1
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Create Your Account
                </h2>
              </div>

              <p className="text-gray-600 leading-relaxed mb-4">
                Head to{" "}
                <Link
                  href="/register"
                  className="text-blue-600 font-medium hover:underline"
                >
                  leadflow.ai/register
                </Link>{" "}
                and sign up with your business email. You can also use Google or
                Microsoft SSO for one-click sign-up.
              </p>

              {/* Screenshot placeholder */}
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 mb-4">
                <div className="flex flex-col items-center justify-center text-center">
                  <User className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400 font-medium">
                    Registration form screenshot
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Enter your email, full name, and password
                  </p>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed">
                After signing up, you&apos;ll receive a verification email.
                Click the link to verify your account and you&apos;ll be
                redirected to the onboarding flow.
              </p>
            </section>

            {/* ---- Step 2 ---- */}
            <section id="step-2" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-bold text-white">
                  2
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Complete Your Business Profile
                </h2>
              </div>

              <p className="text-gray-600 leading-relaxed mb-4">
                Your business profile helps the AI understand your business
                context. The more detail you provide, the better your AI
                responses will be.
              </p>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 mb-4">
                <div className="flex flex-col items-center justify-center text-center">
                  <Building className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400 font-medium">
                    Business profile form screenshot
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Business name, industry, and timezone fields
                  </p>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-3">
                Fill in the following fields:
              </p>
              <ul className="space-y-2 text-gray-600 text-sm mb-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                  <span>
                    <strong>Business name</strong> — Your trading name as
                    customers know it
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                  <span>
                    <strong>Business type</strong> — Select your industry
                    (celebrant, photographer, planner, etc.)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                  <span>
                    <strong>Timezone</strong> — Set to your local timezone
                    (defaults to AEST)
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                  <span>
                    <strong>Business description</strong> — A brief paragraph
                    about what you do (used by the AI for context)
                  </span>
                </li>
              </ul>

              <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
                <strong>Tip:</strong> Include your service area, specialties,
                and price range in the business description. The AI uses this to
                answer lead inquiries accurately.
              </div>
            </section>

            {/* ---- Step 3 ---- */}
            <section id="step-3" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-bold text-white">
                  3
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Connect Your First Channel
                </h2>
              </div>

              <p className="text-gray-600 leading-relaxed mb-4">
                We recommend starting with{" "}
                <strong>Web Chat</strong> as your first channel. It requires
                no external account setup and can be tested immediately on your
                own website.
              </p>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 mb-4">
                <div className="flex flex-col items-center justify-center text-center">
                  <Globe className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400 font-medium">
                    Channel selection screen screenshot
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Choose from WhatsApp, Instagram, SMS, Voice, Web Chat
                  </p>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-3">
                To add the Web Chat widget to your website, copy and paste this
                embed snippet before your closing{" "}
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono text-gray-800">
                  &lt;/body&gt;
                </code>{" "}
                tag:
              </p>

              {/* Code block */}
              <div className="relative rounded-xl border border-gray-200 bg-gray-950 overflow-hidden mb-4">
                <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
                  <span className="text-xs font-mono text-gray-400">
                    HTML
                  </span>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </button>
                </div>
                <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
                  <code className="text-gray-300">
                    <span className="text-gray-500">
                      &lt;!-- LeadFlow AI Web Chat Widget --&gt;
                    </span>
                    {"\n"}
                    <span className="text-blue-400">&lt;script</span>
                    {"\n"}
                    {"  "}
                    <span className="text-purple-400">src</span>
                    <span className="text-gray-500">=</span>
                    <span className="text-green-400">
                      &quot;https://cdn.leadflow.ai/widget.js&quot;
                    </span>
                    {"\n"}
                    {"  "}
                    <span className="text-purple-400">data-workspace-id</span>
                    <span className="text-gray-500">=</span>
                    <span className="text-green-400">
                      &quot;YOUR_WORKSPACE_ID&quot;
                    </span>
                    {"\n"}
                    {"  "}
                    <span className="text-purple-400">data-theme</span>
                    <span className="text-gray-500">=</span>
                    <span className="text-green-400">&quot;auto&quot;</span>
                    {"\n"}
                    {"  "}
                    <span className="text-purple-400">async</span>
                    <span className="text-blue-400">&gt;&lt;/script&gt;</span>
                  </code>
                </pre>
              </div>

              <p className="text-gray-600 leading-relaxed text-sm">
                Replace{" "}
                <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono text-gray-800">
                  YOUR_WORKSPACE_ID
                </code>{" "}
                with the ID found in{" "}
                <strong>Settings &rarr; Channels &rarr; Web Chat</strong>.
              </p>
            </section>

            {/* ---- Step 4 ---- */}
            <section id="step-4" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-bold text-white">
                  4
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Upload Your Knowledge Base
                </h2>
              </div>

              <p className="text-gray-600 leading-relaxed mb-4">
                The knowledge base is what makes your AI{" "}
                <em>yours</em>. Upload documents that describe your
                services, pricing, policies, and frequently asked questions.
                The AI uses retrieval-augmented generation (RAG) to pull
                relevant information when responding to leads.
              </p>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 mb-4">
                <div className="flex flex-col items-center justify-center text-center">
                  <FileText className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400 font-medium">
                    Knowledge base upload interface screenshot
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Drag and drop files or browse to upload
                  </p>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-3">
                <strong>Recommended documents to upload:</strong>
              </p>
              <ul className="space-y-2 text-gray-600 text-sm mb-4">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                  Pricing sheet or rate card
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                  Service brochure or package descriptions
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                  FAQ document (most common client questions)
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                  Terms and conditions or booking policies
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-green-500" />
                  Any legal requirements specific to your industry
                </li>
              </ul>

              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-600 mb-4">
                <strong>Supported formats:</strong> PDF, DOCX, TXT, and
                Markdown (.md). Maximum file size: 10 MB per document. Up to
                3 documents on the Starter plan, unlimited on Pro.
              </div>

              <p className="text-gray-600 leading-relaxed text-sm">
                After uploading, LeadFlow will automatically chunk, embed, and
                index your documents. This usually takes 30-60 seconds. You can
                verify the knowledge base is ready by checking the green
                &quot;Indexed&quot; badge next to each document.
              </p>
            </section>

            {/* ---- Step 5 ---- */}
            <section id="step-5" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-bold text-white">
                  5
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Test Your AI
                </h2>
              </div>

              <p className="text-gray-600 leading-relaxed mb-4">
                Before going live, test your AI to make sure it responds
                accurately. Go to{" "}
                <strong>Settings &rarr; AI Agents &rarr; Test Mode</strong>{" "}
                or use the built-in test chat in your dashboard.
              </p>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 mb-4">
                <div className="flex flex-col items-center justify-center text-center">
                  <MessageSquare className="h-10 w-10 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-400 font-medium">
                    AI test chat interface screenshot
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
                    Send test messages and review AI responses
                  </p>
                </div>
              </div>

              <p className="text-gray-600 leading-relaxed mb-3">
                <strong>Test messages to try:</strong>
              </p>
              <div className="space-y-2 mb-4">
                {[
                  "Are you available on October 12?",
                  "How much do you charge for a wedding?",
                  "What areas do you service?",
                  "Can I see some reviews or testimonials?",
                  "I want to book — what's the next step?",
                ].map((msg) => (
                  <div
                    key={msg}
                    className="rounded-lg bg-gray-100 px-4 py-2.5 text-sm text-gray-700 font-mono"
                  >
                    &quot;{msg}&quot;
                  </div>
                ))}
              </div>

              <p className="text-gray-600 leading-relaxed text-sm">
                Review the AI&apos;s responses for accuracy and tone. If
                something is off, update your knowledge base documents or
                adjust the system prompt in{" "}
                <strong>Settings &rarr; AI Agents &rarr; Prompts</strong>.
              </p>
            </section>

            {/* ---- Step 6 ---- */}
            <section id="step-6" className="mb-12 scroll-mt-24">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-sm font-bold text-white">
                  6
                </div>
                <h2 className="text-xl font-bold text-gray-900">
                  Go Live
                </h2>
              </div>

              <p className="text-gray-600 leading-relaxed mb-4">
                You&apos;re ready to go live. Here&apos;s what to do for each
                channel:
              </p>

              <div className="space-y-3 mb-6">
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-teal-100 text-teal-600">
                      <Globe className="h-3.5 w-3.5" />
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      Web Chat
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Publish the embed snippet on your website. The widget
                    appears immediately for all visitors. Test it by visiting
                    your site in an incognito browser tab.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-green-100 text-green-600">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      WhatsApp
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Share your WhatsApp Business number on your website,
                    social media, and Google Business Profile. Add a
                    &quot;Message us on WhatsApp&quot; button to your site.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-pink-100 text-pink-600">
                      <MessageSquare className="h-3.5 w-3.5" />
                    </div>
                    <h4 className="font-semibold text-gray-900 text-sm">
                      Instagram
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600">
                    Connect your Instagram Business account. The AI will
                    automatically respond to DMs and story replies.
                  </p>
                </div>
              </div>

              <div className="rounded-xl border-2 border-green-200 bg-green-50 p-5">
                <div className="flex gap-3">
                  <Rocket className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="font-semibold text-green-800 mb-1">
                      Congratulations!
                    </p>
                    <p className="text-sm text-green-700">
                      Your AI is now live and ready to respond to leads 24/7.
                      Monitor incoming conversations in your{" "}
                      <strong>Dashboard &rarr; Inbox</strong>. You can toggle
                      to &quot;Human Mode&quot; on any conversation at any
                      time.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ---- What's Next ---- */}
            <section id="whats-next" className="mb-12 scroll-mt-24">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                What&apos;s Next
              </h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                You&apos;ve covered the basics. Here are the most popular
                next steps to get the most out of LeadFlow AI:
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                {nextSteps.map((item) => (
                  <Link
                    key={item.title}
                    href={item.href as "/docs" | "/api-docs"}
                    className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:shadow-md hover:border-blue-200"
                  >
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {item.description}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
                      Read guide
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            {/* ---- Navigation ---- */}
            <div className="flex items-center justify-between border-t border-gray-200 pt-8">
              <Link
                href="/docs"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Docs
              </Link>
              <a
                href="#"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
              >
                Channel Setup
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </article>

          {/* ---- Table of Contents Sidebar ---- */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                On this page
              </h4>
              <nav className="space-y-1">
                {tocItems.map((item) => (
                  <a
                    key={item.id}
                    href={`#${item.id}`}
                    className="block rounded-md px-3 py-1.5 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="mt-8 border-t border-gray-200 pt-6">
                <p className="text-xs text-gray-400 mb-3">Need help?</p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
                >
                  <MessageSquare className="h-3.5 w-3.5" />
                  Contact support
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
