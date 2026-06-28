import Link from "next/link";
import type { Metadata } from "next";
import {
  Zap,
  Calendar,
  FileText,
  Award,
  CreditCard,
  Bell,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Star,
  Car,
  Clock,
  TrendingUp,
  ShieldCheck,
  MessageSquare,
  AlertTriangle,
  CalendarX,
  UserX,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SectionHeroDark, ScrollReveal } from "@/components/marketing";

/* ------------------------------------------------------------------ */
/*  Metadata                                                           */
/* ------------------------------------------------------------------ */

export const metadata: Metadata = {
  title: "LeadFlow AI for Driving Instructors | Fill Your Lesson Calendar on Autopilot",
  description:
    "Students message you on WhatsApp, Instagram, and your website while you&apos;re in a lesson. LeadFlow AI responds instantly, checks your availability, books lessons, and collects payment. You just drive.",
};

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero() {
  return (
    <SectionHeroDark
      eyebrow="For Driving Instructors"
      title={
        <>
          Fill your lesson calendar{" "}
          <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
            without lifting a finger
          </span>
        </>
      }
      subtitle="Students message you on WhatsApp, Instagram, and your website — often while you're in a lesson. LeadFlow AI responds instantly, checks your availability, books lessons, and collects payment. You just drive."
    >
      <div className="flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/register"
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:shadow-xl hover:shadow-violet-500/30 hover:brightness-110"
        >
          Start Free Trial
          <ArrowRight className="h-5 w-5" />
        </Link>
        <Link
          href="#demo"
          className="inline-flex items-center gap-2 rounded-xl border-2 border-white/20 px-8 py-4 text-lg font-semibold text-white transition hover:border-cyan-400/50 hover:bg-white/5"
        >
          See the demo
        </Link>
      </div>
      <p className="mt-6 text-sm text-slate-400 flex items-center justify-center gap-2">
        <Car className="h-4 w-4 text-cyan-400" />
        Used by 150+ Australian driving instructors &middot; No credit card required
      </p>
    </SectionHeroDark>
  );
}

/* ------------------------------------------------------------------ */
/*  The Problem                                                        */
/* ------------------------------------------------------------------ */

const painPoints = [
  {
    icon: AlertTriangle,
    title: "Can\u2019t answer while driving",
    description:
      "You\u2019re legally required to focus on the road. But 70% of inquiries come during lesson hours. By the time you reply, they\u2019ve booked someone else.",
    accent: "bg-red-100 text-red-600",
  },
  {
    icon: CalendarX,
    title: "Scheduling chaos",
    description:
      "Texts, WhatsApp messages, phone calls \u2014 students book on different channels. Double bookings, missed slots, and a calendar that\u2019s impossible to manage.",
    accent: "bg-amber-100 text-amber-600",
  },
  {
    icon: UserX,
    title: "No-shows and dropoffs",
    description:
      "Students ghost after one lesson. No automated follow-up means lost revenue from students who just needed a nudge.",
    accent: "bg-orange-100 text-orange-600",
  },
] as const;

function Problem() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            You&apos;re behind the wheel when students need you most
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            The biggest challenge for driving instructors isn&apos;t teaching
            &mdash; it&apos;s managing a business while you&apos;re on the road.
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {painPoints.map((point, i) => (
            <ScrollReveal key={point.title} delay={i * 60}>
              <div
                className="group rounded-xl border border-gray-200 bg-white p-8 transition hover:-translate-y-1 hover:shadow-xl hover:border-cyan-400/40"
              >
                <div
                  className={cn(
                    "mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl",
                    point.accent
                  )}
                >
                  <point.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {point.title}
                </h3>
                <p className="mt-2 leading-relaxed text-gray-600">
                  {point.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  The Solution — 6 Feature Cards                                     */
/* ------------------------------------------------------------------ */

const solutionFeatures = [
  {
    icon: Zap,
    title: "Instant Response While You Drive",
    description:
      "Student WhatsApps you at 2pm during a lesson. AI responds in 8 seconds: \u201cHi! I can see your instructor has slots available this Thursday and Friday afternoon. Which works for you?\u201d",
    accent: "bg-blue-100 text-blue-600",
  },
  {
    icon: Calendar,
    title: "Smart Calendar Booking",
    description:
      "AI knows your real-time availability. No double bookings, no back-and-forth. Students pick a slot and it\u2019s confirmed instantly.",
    accent: "bg-sky-100 text-sky-600",
  },
  {
    icon: FileText,
    title: "Package Pricing on Autopilot",
    description:
      "Upload your lesson packages (1hr lesson, 5-pack, 10-pack, test day). AI explains pricing and recommends the right package based on the student\u2019s experience level.",
    accent: "bg-indigo-100 text-indigo-600",
  },
  {
    icon: Award,
    title: "Test Date Preparation",
    description:
      "AI asks students about their test date and creates a lesson plan. \u201cYour test is in 6 weeks \u2014 I\u2019d recommend 2 lessons per week. Want me to book you in?\u201d",
    accent: "bg-green-100 text-green-600",
  },
  {
    icon: CreditCard,
    title: "Payment Collection",
    description:
      "Collect payment for lesson packs upfront via Stripe. AI sends the link right in the chat. No awkward cash conversations.",
    accent: "bg-purple-100 text-purple-600",
  },
  {
    icon: Bell,
    title: "Student Follow-Up",
    description:
      "Student hasn\u2019t booked their next lesson in 2 weeks? AI sends a friendly nudge: \u201cHey! Your test is coming up. Want me to book your next lesson?\u201d",
    accent: "bg-teal-100 text-teal-600",
  },
] as const;

function Solution() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-1.5 text-sm font-medium text-blue-700">
            <ShieldCheck className="h-4 w-4" />
            Always on, always booking
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Your AI booking assistant, on duty 24/7
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            While you&apos;re teaching lane changes and parallel parking,
            your AI is handling every inquiry, booking, and payment.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {solutionFeatures.map((feature, i) => (
            <ScrollReveal key={feature.title} delay={i * 60}>
              <div
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-8 transition hover:-translate-y-1 hover:shadow-xl hover:border-cyan-400/40"
              >
                {/* Subtle gradient top border on hover */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-500 to-violet-500 opacity-0 transition group-hover:opacity-100" />

                <div
                  className={cn(
                    "mb-5 inline-flex h-12 w-12 items-center justify-center rounded-xl",
                    feature.accent
                  )}
                >
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {feature.title}
                </h3>
                <p className="mt-2 leading-relaxed text-gray-600">
                  {feature.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Live Demo / Workflow                                               */
/* ------------------------------------------------------------------ */

interface ChatMessage {
  time: string;
  sender: "student" | "ai" | "notification";
  text: string;
  items?: string[];
  cta?: string;
}

const demoMessages: ChatMessage[] = [
  {
    time: "2:15 PM",
    sender: "student",
    text: "Hey, do you have any spots this week? I need to practice before my test on the 25th",
  },
  {
    time: "2:15 PM",
    sender: "ai",
    text: "Hi! I\u2019m your instructor\u2019s booking assistant. Your test is on the 25th \u2014 that\u2019s 10 days away! Let me check availability\u2026 I\u2019ve got these slots open this week:",
    items: [
      "Thursday 3:30 PM",
      "Friday 9:00 AM",
      "Saturday 8:00 AM",
    ],
  },
  {
    time: "2:17 PM",
    sender: "student",
    text: "Thursday and Saturday would be great. How much?",
  },
  {
    time: "2:17 PM",
    sender: "ai",
    text: "Great choices! Individual lessons are $70/hr, or you can grab a 5-lesson pack for $320 (save $30). Since you want multiple lessons, the pack is better value. Want me to book you in?",
  },
  {
    time: "2:18 PM",
    sender: "student",
    text: "Yeah the pack sounds good",
  },
  {
    time: "2:18 PM",
    sender: "ai",
    text: "Done! I\u2019ve booked you for Thursday 3:30 PM and Saturday 8:00 AM. Here\u2019s the payment link for the 5-lesson pack ($320):",
    cta: "Pay Now \u2014 $320",
  },
  {
    time: "2:20 PM",
    sender: "student",
    text: "Paid! See you Thursday",
  },
  {
    time: "2:20 PM",
    sender: "notification",
    text: "\uD83D\uDD14 New booking! Student \u2014 5-lesson pack paid ($320). Test date: 25th. Lessons: Thu 3:30 PM, Sat 8:00 AM.",
  },
];

function Demo() {
  return (
    <section id="demo" className="bg-blue-50/60 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            See it in action: mid-lesson inquiry
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            A student messages while your instructor is teaching another lesson.
            Watch how LeadFlow handles it from first message to payment.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-lg">
          {/* Chat window */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-xl">
            {/* Chat header */}
            <div className="flex items-center gap-3 rounded-t-2xl border-b border-gray-100 bg-gray-50 px-5 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500 text-xs font-bold text-white">
                <MessageSquare className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  WhatsApp &middot; Driving Lessons
                </p>
                <p className="text-xs text-green-600">AI Assistant Online</p>
              </div>
            </div>

            {/* Messages */}
            <div className="space-y-4 p-5">
              {demoMessages.map((msg, i) => {
                if (msg.sender === "notification") {
                  return (
                    <div key={i} className="mx-auto max-w-[90%]">
                      <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm leading-relaxed text-blue-800">
                        <p className="mb-1 text-xs font-medium uppercase tracking-wide text-blue-500">
                          Notification to Instructor
                        </p>
                        {msg.text}
                      </div>
                    </div>
                  );
                }

                const isStudent = msg.sender === "student";
                return (
                  <div key={i}>
                    <div
                      className={cn(
                        "mb-1 text-xs text-gray-400",
                        isStudent ? "text-left" : "text-right"
                      )}
                    >
                      {msg.time}
                    </div>
                    <div
                      className={cn(
                        "flex",
                        isStudent ? "justify-start" : "justify-end"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                          isStudent
                            ? "rounded-tl-sm bg-gray-100 text-gray-800"
                            : "rounded-tr-sm bg-gradient-to-br from-blue-600 to-sky-500 text-white"
                        )}
                      >
                        <p>{msg.text}</p>
                        {msg.items && (
                          <ul className="mt-2 space-y-1">
                            {msg.items.map((item) => (
                              <li key={item} className="flex items-center gap-2">
                                <span className="text-white/70">&bull;</span>
                                <span className="font-medium">{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                        {msg.cta && (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-lg bg-white/20 px-4 py-1.5 text-sm font-semibold">
                            {msg.cta} &rarr;
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary line */}
          <div className="mt-8 rounded-xl border border-blue-200 bg-white p-5 text-center">
            <p className="text-sm font-semibold text-blue-700">
              2 lessons booked, $320 collected, test prep planned
            </p>
            <p className="mt-1 text-sm text-gray-500">
              &mdash; while the instructor was teaching another student.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Results / Social Proof                                             */
/* ------------------------------------------------------------------ */

const metrics = [
  {
    label: "Booking response",
    before: "3 hours",
    after: "8 seconds",
    icon: Clock,
    accent: "from-blue-500 to-sky-400",
  },
  {
    label: "Calendar utilisation",
    before: "65%",
    after: "92%",
    icon: Calendar,
    accent: "from-green-500 to-emerald-400",
  },
  {
    label: "Monthly revenue",
    before: "\u2014",
    after: "+$2,400/mo",
    icon: TrendingUp,
    accent: "from-purple-500 to-violet-400",
  },
  {
    label: "No-show rate",
    before: "18%",
    after: "4%",
    icon: ShieldCheck,
    accent: "from-orange-500 to-amber-400",
  },
] as const;

const testimonials = [
  {
    quote:
      "I used to lose 5-6 students a week because I couldn\u2019t answer during lessons. Now my AI books them before I even park the car.",
    name: "Mike T.",
    city: "Sydney",
    initials: "MT",
    color: "bg-blue-500",
  },
  {
    quote:
      "The lesson pack upselling alone paid for LeadFlow. Students were always booking one lesson at a time \u2014 now 60% buy packs.",
    name: "Jenny K.",
    city: "Melbourne",
    initials: "JK",
    color: "bg-sky-500",
  },
] as const;

function Results() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Results from real driving instructors
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            These numbers come from instructors in their first 90 days
            using LeadFlow AI.
          </p>
        </div>

        {/* Metric cards */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {metrics.map((m, i) => (
            <ScrollReveal key={m.label} delay={i * 60}>
              <div
                className="relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 text-center transition hover:-translate-y-1 hover:shadow-xl hover:border-cyan-400/40"
              >
                <div
                  className={cn(
                    "absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r",
                    m.accent
                  )}
                />
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                  <m.icon className="h-6 w-6 text-gray-600" />
                </div>
                <p className="text-sm font-medium uppercase tracking-wide text-gray-500">
                  {m.label}
                </p>
                <div className="mt-2 flex items-center justify-center gap-3">
                  <span className="text-lg text-gray-400 line-through">
                    {m.before}
                  </span>
                  <ArrowRight className="h-4 w-4 text-gray-300" />
                  <span className="text-2xl font-bold text-gray-900">
                    {m.after}
                  </span>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mt-16 grid gap-8 md:grid-cols-2">
          {testimonials.map((t, i) => (
            <ScrollReveal key={t.name} delay={i * 60}>
              <div
                className="rounded-xl border border-gray-200 bg-white p-8 transition hover:-translate-y-1 hover:shadow-xl hover:border-cyan-400/40"
              >
                <div className="mb-4 flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      className="h-5 w-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-lg leading-relaxed text-gray-700 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white",
                      t.color
                    )}
                  >
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {t.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      Driving Instructor, {t.city}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Pricing (instructor-specific)                                      */
/* ------------------------------------------------------------------ */

function Pricing() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            One extra lesson per month covers your subscription
          </h2>
        </div>

        <div className="mx-auto mt-12 max-w-2xl">
          <div className="rounded-2xl border-2 border-blue-200 bg-white p-8 shadow-lg sm:p-10">
            <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
              {/* Price breakdown */}
              <div className="flex-1 text-center sm:text-left">
                <p className="text-sm font-medium uppercase tracking-wide text-blue-600">
                  The math is simple
                </p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-baseline justify-center gap-2 sm:justify-start">
                    <span className="text-3xl font-bold text-gray-900">$70</span>
                    <span className="text-gray-500">average lesson fee</span>
                  </div>
                  <div className="flex items-baseline justify-center gap-2 sm:justify-start">
                    <span className="text-3xl font-bold text-blue-600">$49</span>
                    <span className="text-gray-500">/mo LeadFlow Starter</span>
                  </div>
                </div>
                <p className="mt-6 leading-relaxed text-gray-600">
                  That&apos;s less than <strong>one lesson</strong> to cover the
                  cost &mdash; and most instructors see{" "}
                  <strong>5+ additional bookings per week</strong>.
                </p>
              </div>

              {/* ROI highlight */}
              <div className="w-full max-w-xs rounded-xl bg-blue-50 p-6 text-center">
                <p className="text-sm font-medium text-blue-600">
                  Typical monthly ROI
                </p>
                <p className="mt-2 text-4xl font-bold text-gray-900">
                  48x
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  $49 cost &rarr; $2,400+ extra revenue
                </p>
              </div>
            </div>

            {/* What&apos;s included */}
            <div className="mt-8 border-t border-gray-100 pt-8">
              <p className="mb-4 text-sm font-medium uppercase tracking-wide text-gray-500">
                Included in Starter
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  "WhatsApp + Instagram + Web Chat",
                  "AI responses in under 15 seconds",
                  "Calendar sync & auto-booking",
                  "Stripe payment collection",
                  "Lesson pack upselling",
                  "Automated student follow-ups",
                  "No-show reminders",
                  "Unlimited conversations",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 text-center">
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-500/25 transition hover:shadow-xl hover:shadow-blue-500/30 hover:brightness-110"
              >
                Start your free trial
                <ArrowRight className="h-5 w-5" />
              </Link>
              <p className="mt-3 text-sm text-gray-500">
                No credit card required &middot; Cancel anytime
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ (instructor-specific)                                          */
/* ------------------------------------------------------------------ */

const faqs = [
  {
    q: "Can students book specific lesson types?",
    a: "Yes. You configure your lesson types \u2014 standard, motorway, test prep, parking-only, and any custom types you offer. The AI presents the right options based on what the student asks for.",
  },
  {
    q: "What about cancellations and rescheduling?",
    a: "AI handles it end to end. When a student wants to reschedule, the AI offers alternative slots from your live calendar and applies your cancellation policy automatically (e.g., 24-hour notice required).",
  },
  {
    q: "Do I need a website?",
    a: "No. LeadFlow works with WhatsApp and Instagram alone \u2014 the two channels where most driving students already search. The web chat widget is optional if you do have a site.",
  },
  {
    q: "What if I have multiple cars or instructors?",
    a: "Our Enterprise plan supports team management with shared and individual calendars, per-instructor availability, and automatic routing so students are matched to the right instructor.",
  },
  {
    q: "How do students find me?",
    a: "LeadFlow handles inquiries from wherever students message you. Focus on getting them to your WhatsApp or Instagram first \u2014 through Google Business, social media, word of mouth, or local advertising. We handle the rest.",
  },
] as const;

function FAQ() {
  return (
    <section className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg leading-relaxed text-gray-600">
            Everything driving instructors ask before getting started.
          </p>
        </div>

        <div className="mx-auto mt-12 max-w-2xl divide-y divide-gray-200">
          {faqs.map((faq, i) => (
            <ScrollReveal key={faq.q} delay={i * 60}>
              <details
                className="group py-5 [&_summary::-webkit-details-marker]:hidden"
              >
                <summary className="flex cursor-pointer items-center justify-between gap-4 text-left text-lg font-medium text-gray-900 marker:content-none">
                  {faq.q}
                  <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition group-open:rotate-180" />
                </summary>
                <p className="mt-3 leading-relaxed text-gray-600">{faq.a}</p>
              </details>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Final CTA                                                          */
/* ------------------------------------------------------------------ */

function FinalCTA() {
  return (
    <section className="bg-gradient-to-r from-blue-600 to-sky-500 py-24">
      <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to fill your calendar on autopilot?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-blue-100">
          Join 150+ Australian driving instructors using LeadFlow AI to book
          more lessons, collect payments, and never miss a student inquiry
          again.
        </p>
        <div className="mt-10">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-10 py-4 text-lg font-semibold text-blue-700 shadow-lg transition hover:bg-blue-50 hover:shadow-xl"
          >
            Start Free Trial
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
        <p className="mt-4 text-sm text-blue-200">
          No credit card required &middot; Setup in 5 minutes
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function DrivingInstructorsPage() {
  return (
    <>
      <Hero />
      <Problem />
      <Solution />
      <Demo />
      <Results />
      <Pricing />
      <FAQ />
      <FinalCTA />
    </>
  );
}
