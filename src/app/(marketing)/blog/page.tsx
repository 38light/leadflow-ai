import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Sparkles,
  TrendingUp,
  Radio,
  Target,
  Shield,
  Zap,
  Mail,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Blog — LeadFlow AI",
  description:
    "Insights on AI, lead conversion, and growing your service business. Tips, strategies, and product updates from the LeadFlow team.",
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const categoryFilters = [
  { label: "All", active: true },
  { label: "AI", active: false },
  { label: "Growth", active: false },
  { label: "Channels", active: false },
  { label: "Strategy", active: false },
  { label: "Compliance", active: false },
  { label: "Automation", active: false },
];

interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  categoryColor: string;
  readTime: string;
  icon: React.ComponentType<{ className?: string }>;
  featured?: boolean;
}

const posts: BlogPost[] = [
  {
    slug: "how-ai-responds-faster",
    title: "How AI Responds to Leads 10x Faster Than Humans",
    excerpt:
      "Speed is the single biggest factor in lead conversion. Studies show that responding within 5 minutes makes you 21x more likely to qualify a lead. Here's how AI makes sub-15-second response times possible — and why it matters for your bottom line.",
    date: "March 15, 2026",
    category: "AI",
    categoryColor: "bg-purple-100 text-purple-700",
    readTime: "5 min",
    icon: Sparkles,
    featured: true,
  },
  {
    slug: "5-reasons-service-businesses-lose-leads",
    title: "5 Reasons Service Businesses Lose Leads (And How to Fix It)",
    excerpt:
      "Most service businesses lose 40-60% of their leads before ever speaking to them. We break down the five most common reasons and actionable strategies to plug the leaks.",
    date: "February 28, 2026",
    category: "Growth",
    categoryColor: "bg-green-100 text-green-700",
    readTime: "7 min",
    icon: TrendingUp,
  },
  {
    slug: "whatsapp-business-for-celebrants",
    title: "The Complete Guide to WhatsApp Business for Celebrants",
    excerpt:
      "WhatsApp is the most popular messaging platform in Australia. Learn how to set up WhatsApp Business, create quick replies, and automate lead capture for your celebrant business.",
    date: "February 14, 2026",
    category: "Channels",
    categoryColor: "bg-blue-100 text-blue-700",
    readTime: "8 min",
    icon: Radio,
  },
  {
    slug: "understanding-lead-temperature",
    title: "Understanding Lead Temperature: Hot, Warm, and Cold",
    excerpt:
      "Not all leads are equal. Learn how LeadFlow AI classifies lead temperature in real-time and why treating a hot lead like a cold one costs you bookings.",
    date: "January 20, 2026",
    category: "Strategy",
    categoryColor: "bg-orange-100 text-orange-700",
    readTime: "6 min",
    icon: Target,
  },
  {
    slug: "australian-privacy-principles-ai",
    title: "Australian Privacy Principles: What Your AI Needs to Know",
    excerpt:
      "Running an AI chatbot in Australia means complying with the APPs. We cover the 13 principles, what they mean for your AI, and how LeadFlow keeps you compliant automatically.",
    date: "January 8, 2026",
    category: "Compliance",
    categoryColor: "bg-red-100 text-red-700",
    readTime: "9 min",
    icon: Shield,
  },
  {
    slug: "automating-sales-pipeline",
    title: "From Inquiry to Deposit: Automating Your Sales Pipeline",
    excerpt:
      "The journey from first message to paid deposit can be fully automated. Learn how to set up AI-powered qualification, calendar booking, and Stripe payment links in one seamless flow.",
    date: "December 12, 2025",
    category: "Automation",
    categoryColor: "bg-amber-100 text-amber-700",
    readTime: "10 min",
    icon: Zap,
  },
];

const featuredPost = posts[0];
const gridPosts = posts.slice(1);

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function BlogPage() {
  return (
    <div className="relative overflow-hidden">
      {/* Decorative background */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[80rem] h-[40rem] bg-[radial-gradient(ellipse_at_center,rgba(147,51,234,0.06),transparent_70%)]"
      />

      {/* ---- Hero ---- */}
      <section className="relative pt-24 pb-12 text-center px-6">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
          Blog
        </h1>
        <p className="mt-4 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto">
          Insights on AI, lead conversion, and growing your service business.
        </p>
      </section>

      {/* ---- Category Filters ---- */}
      <section className="px-6 pb-10">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-wrap items-center gap-2 justify-center">
            {categoryFilters.map((cat) => (
              <span
                key={cat.label}
                className={`inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium transition cursor-default ${
                  cat.active
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {cat.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ---- Featured Post ---- */}
      <section className="px-6 pb-12">
        <div className="mx-auto max-w-7xl">
          <Link
            href={`/blog/${featuredPost.slug}`}
            className="group block rounded-2xl border border-gray-200 bg-white overflow-hidden transition hover:shadow-xl"
          >
            <div className="grid md:grid-cols-2">
              {/* Image placeholder */}
              <div className="bg-gradient-to-br from-purple-100 via-blue-50 to-purple-50 p-12 flex flex-col items-center justify-center min-h-[280px]">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/80 shadow-lg">
                  <featuredPost.icon className="h-10 w-10 text-purple-600" />
                </div>
                <span
                  className={`mt-6 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${featuredPost.categoryColor}`}
                >
                  {featuredPost.category}
                </span>
              </div>

              {/* Content */}
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <div className="mb-2 inline-flex items-center gap-3 text-sm text-gray-400">
                  <span className="font-medium text-blue-600">Featured</span>
                  <span>&middot;</span>
                  <span>{featuredPost.date}</span>
                  <span>&middot;</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {featuredPost.readTime}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                  {featuredPost.title}
                </h2>
                <p className="mt-4 text-gray-500 leading-relaxed">
                  {featuredPost.excerpt}
                </p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600">
                  Read article
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </span>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ---- Post Grid ---- */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {gridPosts.map((post) => {
              const Icon = post.icon;
              return (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col rounded-xl border border-gray-200 bg-white overflow-hidden transition hover:shadow-lg"
                >
                  {/* Image placeholder */}
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex items-center justify-center min-h-[180px]">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-md">
                      <Icon className="h-7 w-7 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex flex-col flex-1 p-6">
                    <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 font-semibold ${post.categoryColor}`}
                      >
                        {post.category}
                      </span>
                      <span>{post.date}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">
                      {post.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed flex-1">
                      {post.excerpt}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-blue-600">
                      Read more
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---- Subscribe CTA ---- */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-3xl text-center rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 px-8 py-14 shadow-2xl">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">
            Stay ahead of the curve
          </h2>
          <p className="mt-2 text-gray-400 max-w-md mx-auto">
            Get the latest insights on AI, lead conversion, and service
            business growth delivered to your inbox weekly.
          </p>
          <div className="mt-8 mx-auto max-w-md flex gap-3">
            <input
              type="email"
              placeholder="you@business.com"
              className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-gray-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition"
              readOnly
            />
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-100"
            >
              Subscribe
            </button>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            No spam. Unsubscribe anytime.
          </p>
        </div>
      </section>
    </div>
  );
}
