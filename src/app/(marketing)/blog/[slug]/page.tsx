import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar,
  Sparkles,
  TrendingUp,
  Target,
  Share2,
  Twitter,
  Linkedin,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Static Params                                                      */
/* ------------------------------------------------------------------ */

export function generateStaticParams() {
  return [{ slug: "how-ai-responds-faster" }];
}

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "How AI Responds to Leads 10x Faster Than Humans — LeadFlow AI Blog",
  description:
    "Speed is the single biggest factor in lead conversion. Learn how AI makes sub-15-second response times possible and why it matters for your bottom line.",
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const tocSections = [
  { id: "speed-gap", label: "The Speed Gap" },
  { id: "why-speed-matters", label: "Why Speed Matters" },
  { id: "how-ai-works", label: "How AI Response Works" },
  { id: "real-world-impact", label: "Real-World Impact" },
  { id: "beyond-speed", label: "Beyond Speed" },
  { id: "getting-started", label: "Getting Started" },
];

const relatedPosts = [
  {
    slug: "5-reasons-service-businesses-lose-leads",
    title: "5 Reasons Service Businesses Lose Leads (And How to Fix It)",
    category: "Growth",
    categoryColor: "bg-green-100 text-green-700",
    readTime: "7 min",
    icon: TrendingUp,
  },
  {
    slug: "understanding-lead-temperature",
    title: "Understanding Lead Temperature: Hot, Warm, and Cold",
    category: "Strategy",
    categoryColor: "bg-orange-100 text-orange-700",
    readTime: "6 min",
    icon: Target,
  },
  {
    slug: "automating-sales-pipeline",
    title: "From Inquiry to Deposit: Automating Your Sales Pipeline",
    category: "Automation",
    categoryColor: "bg-amber-100 text-amber-700",
    readTime: "10 min",
    icon: Sparkles,
  },
];

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function BlogPostPage() {
  return (
    <div className="relative">
      {/* Breadcrumb bar */}
      <div className="border-b border-gray-100 bg-gray-50/60">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <nav className="flex items-center gap-2 text-sm text-gray-500">
            <Link
              href="/blog"
              className="hover:text-blue-600 transition-colors"
            >
              Blog
            </Link>
            <span className="text-gray-300">/</span>
            <span className="text-gray-900 font-medium truncate">
              How AI Responds to Leads 10x Faster
            </span>
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="lg:grid lg:grid-cols-[1fr_240px] lg:gap-12">
          {/* ---- Main Article ---- */}
          <article className="max-w-3xl">
            {/* Header */}
            <header className="mb-10">
              <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700 mb-4">
                AI
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-gray-900 leading-tight">
                How AI Responds to Leads 10x Faster Than Humans
              </h1>
              <p className="mt-4 text-lg text-gray-500 leading-relaxed">
                Speed is the single biggest factor in lead conversion. Here is
                how AI makes sub-15-second response times possible — and why it
                matters for your bottom line.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                {/* Author */}
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-xs font-bold text-white">
                    AK
                  </div>
                  <span className="font-medium text-gray-700">Alex Kim</span>
                </div>
                <span className="hidden sm:inline">&middot;</span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  March 15, 2026
                </span>
                <span>&middot;</span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  5 min read
                </span>
              </div>
            </header>

            {/* ---- Article Body ---- */}
            <div className="prose prose-gray max-w-none">
              {/* Section 1 */}
              <section id="speed-gap" className="mb-10 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  The Speed Gap in Lead Response
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  When a potential customer sends you a message — whether it
                  is an Instagram DM, a WhatsApp inquiry, or a web form
                  submission — a countdown starts. Every minute that passes
                  without a response reduces your chance of converting that
                  lead. The data is unambiguous: the average service business
                  takes <strong>47 minutes</strong> to respond to a new lead.
                  Many take hours. Some never respond at all.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  Meanwhile, AI-powered systems like LeadFlow respond in an
                  average of <strong>12 seconds</strong>. That is not a
                  marginal improvement. It is a fundamentally different
                  experience for the lead — and a fundamentally different
                  outcome for your business.
                </p>
              </section>

              {/* Section 2 */}
              <section id="why-speed-matters" className="mb-10 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Why Speed Matters More Than You Think
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Research from Harvard Business Review found that businesses
                  that respond to leads within five minutes are{" "}
                  <strong>21 times more likely</strong> to qualify that lead
                  compared to those who respond in 30 minutes. After five
                  minutes, the odds drop by a factor of 10.
                </p>

                <blockquote className="border-l-4 border-blue-500 bg-blue-50 pl-5 pr-4 py-4 my-6 rounded-r-lg">
                  <p className="text-gray-700 italic leading-relaxed">
                    &ldquo;The odds of contacting a lead if called in 5 minutes
                    versus 30 minutes drop 100 times. The odds of qualifying a
                    lead if called in 5 minutes versus 30 minutes drop 21
                    times.&rdquo;
                  </p>
                  <footer className="mt-2 text-sm text-gray-500 not-italic">
                    — Harvard Business Review, &ldquo;The Short Life of Online
                    Sales Leads&rdquo;
                  </footer>
                </blockquote>

                <p className="text-gray-600 leading-relaxed mb-4">
                  For service businesses — celebrants, photographers, event
                  planners, trades — the stakes are even higher. Leads are
                  often shopping multiple providers simultaneously. The first
                  business to respond with a helpful, personalized reply wins
                  the conversation and, usually, the booking.
                </p>

                <p className="text-gray-600 leading-relaxed">
                  The reasons are psychological. A fast response signals
                  professionalism, availability, and care. It catches the lead
                  while they are still in &ldquo;buying mode&rdquo; — actively
                  thinking about their need. A delayed response lets them move
                  on, lose interest, or book with a competitor.
                </p>
              </section>

              {/* Section 3 */}
              <section id="how-ai-works" className="mb-10 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  How AI Response Actually Works
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  LeadFlow AI uses a multi-agent architecture to handle
                  incoming messages. When a lead sends a message, here is what
                  happens in those 12 seconds:
                </p>

                <ul className="space-y-3 mb-4">
                  <li className="flex items-start gap-3 text-gray-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                      1
                    </span>
                    <span>
                      <strong>Message ingestion</strong> — The message arrives
                      via WhatsApp, Instagram, SMS, or Web Chat and is
                      normalized into a unified format (under 500ms).
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                      2
                    </span>
                    <span>
                      <strong>Intent classification</strong> — The Concierge
                      agent analyzes the message for intent (booking, pricing,
                      info), sentiment (positive, neutral, frustrated), and
                      urgency (hot, warm, cold).
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                      3
                    </span>
                    <span>
                      <strong>Knowledge retrieval</strong> — The Knowledge
                      Expert agent searches your uploaded documents using RAG
                      (Retrieval-Augmented Generation) to find relevant
                      information about pricing, availability, policies, or
                      FAQs.
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                      4
                    </span>
                    <span>
                      <strong>Response generation</strong> — The AI crafts a
                      natural, personalized response using the conversation
                      context, retrieved knowledge, and your brand voice
                      settings.
                    </span>
                  </li>
                  <li className="flex items-start gap-3 text-gray-600">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600">
                      5
                    </span>
                    <span>
                      <strong>Delivery</strong> — The response is sent back
                      through the same channel the lead used. The entire
                      process completes in 8-15 seconds.
                    </span>
                  </li>
                </ul>

                <p className="text-gray-600 leading-relaxed">
                  The key insight is that AI does not just respond faster — it
                  responds with <em>context</em>. Unlike a generic auto-reply
                  (&ldquo;Thanks for your message, we&apos;ll get back to you
                  soon&rdquo;), an AI response actually answers the
                  lead&apos;s question, checks availability, quotes pricing,
                  and moves the conversation forward.
                </p>
              </section>

              {/* Section 4 */}
              <section id="real-world-impact" className="mb-10 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Real-World Impact: The Numbers
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Across our customer base of 500+ Australian service
                  businesses, we have measured the impact of AI-powered
                  response speed on key conversion metrics:
                </p>

                <div className="grid grid-cols-2 gap-4 my-6">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
                    <p className="text-3xl font-extrabold text-blue-600">
                      3.2x
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Higher response rate
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
                    <p className="text-3xl font-extrabold text-purple-600">
                      2.1x
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Higher conversion rate
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
                    <p className="text-3xl font-extrabold text-green-600">
                      68%
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Fewer missed leads
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
                    <p className="text-3xl font-extrabold text-orange-600">
                      12s
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Average response time
                    </p>
                  </div>
                </div>

                <p className="text-gray-600 leading-relaxed">
                  One of our customers, a Sydney-based marriage celebrant,
                  reported that her booking rate jumped from 23% to 51% within
                  the first month of using LeadFlow AI. The primary driver was
                  not the quality of the AI&apos;s responses — it was simply
                  that leads received an immediate, helpful reply instead of
                  waiting hours for a human to check their phone.
                </p>
              </section>

              {/* Section 5 */}
              <section id="beyond-speed" className="mb-10 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Beyond Speed: The Compounding Advantage
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Speed is the initial advantage, but the benefits compound.
                  When your AI responds instantly:
                </p>

                <ul className="space-y-2 mb-4 text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                    Leads stay engaged in the conversation rather than
                    abandoning it
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                    Multi-turn conversations happen in minutes, not days of
                    back-and-forth
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                    Calendar bookings and deposits are captured while
                    motivation is highest
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                    You capture leads 24/7 — evenings, weekends, and holidays
                    when you would normally miss them
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                    Your CRM stays updated automatically without manual data
                    entry
                  </li>
                </ul>

                <p className="text-gray-600 leading-relaxed">
                  The result is not just more responses — it is a fundamentally
                  better sales process that works around the clock without
                  burning you out.
                </p>
              </section>

              {/* Section 6 */}
              <section id="getting-started" className="mb-10 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Getting Started with AI Response
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  Setting up AI-powered lead response with LeadFlow takes about
                  10 minutes. You create an account, connect a channel (we
                  recommend starting with Web Chat), upload a few documents to
                  your knowledge base, and go live. The AI learns your business
                  context from your documents and starts responding
                  immediately.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  You stay in complete control. Every conversation is visible
                  in your inbox. You can take over any conversation with one
                  tap, and the AI will even draft suggested replies for you to
                  approve. It is not about replacing human interaction — it is
                  about making sure no lead goes unanswered while you are
                  busy doing the work your clients hired you for.
                </p>
              </section>
            </div>

            {/* ---- CTA ---- */}
            <div className="mt-10 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 p-8 text-center">
              <h3 className="text-xl font-bold text-white">
                Want to see AI response speed in action?
              </h3>
              <p className="mt-2 text-blue-100">
                Start your free 14-day trial and experience sub-15-second
                responses for yourself.
              </p>
              <Link
                href="/register"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50"
              >
                Start Free Trial
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* ---- Author Bio ---- */}
            <div className="mt-10 rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600 text-lg font-bold text-white">
                  AK
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">Alex Kim</h4>
                  <p className="text-sm text-gray-500 mb-2">
                    Head of Content at LeadFlow AI
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Alex writes about AI, automation, and growth strategies for
                    service businesses. With 8 years of experience in SaaS
                    marketing, he is passionate about making complex technology
                    accessible and actionable for small business owners.
                  </p>
                  <div className="mt-3 flex items-center gap-3">
                    <a
                      href="#"
                      className="text-gray-400 hover:text-blue-500 transition-colors"
                      aria-label="Twitter"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                    <a
                      href="#"
                      className="text-gray-400 hover:text-blue-600 transition-colors"
                      aria-label="LinkedIn"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* ---- Share ---- */}
            <div className="mt-6 flex items-center gap-3 text-sm text-gray-400">
              <Share2 className="h-4 w-4" />
              <span>Share this article:</span>
              <a
                href="#"
                className="inline-flex items-center gap-1 text-gray-500 hover:text-blue-500 transition-colors"
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-1 text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </a>
            </div>

            {/* ---- Related Posts ---- */}
            <section className="mt-16">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Related Articles
              </h3>
              <div className="grid gap-6 sm:grid-cols-3">
                {relatedPosts.map((post) => (
                    <Link
                      key={post.slug}
                      href={`/blog/${post.slug}`}
                      className="group rounded-xl border border-gray-200 bg-white p-5 transition hover:shadow-md hover:border-blue-200"
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${post.categoryColor}`}
                        >
                          {post.category}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {post.readTime}
                        </span>
                      </div>
                      <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug text-sm">
                        {post.title}
                      </h4>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-blue-600">
                        Read more
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                ))}
              </div>
            </section>

            {/* ---- Prev/Next Navigation ---- */}
            <div className="mt-12 flex items-center justify-between border-t border-gray-200 pt-8">
              <Link
                href="/blog"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>
              <Link
                href="/blog/5-reasons-service-businesses-lose-leads"
                className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors"
              >
                Next article
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </article>

          {/* ---- Sidebar: Table of Contents ---- */}
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">
                In this article
              </h4>
              <nav className="space-y-1">
                {tocSections.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block rounded-md px-3 py-1.5 text-sm text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    {section.label}
                  </a>
                ))}
              </nav>

              <div className="mt-8 border-t border-gray-200 pt-6">
                <p className="text-xs text-gray-400 mb-3">
                  Try LeadFlow AI free
                </p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
                >
                  Start free trial
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
