import Link from "next/link";
import {
  Zap, Calendar, FileText, Scale, CreditCard, RefreshCw,
  MessageCircle, Clock, AlertTriangle, Star,
  ArrowRight, Heart, Shield,
} from "lucide-react";
import { SectionHeroDark, ScrollReveal } from "@/components/marketing";

const features = [
  {
    icon: Zap,
    title: "Instant Response to Inquiries",
    description: "Lead DMs you at 3pm Saturday while you're mid-ceremony. AI responds in 12 seconds with a warm, personalised message. No delay, no lost lead.",
    color: "bg-rose-100 text-rose-600",
  },
  {
    icon: Calendar,
    title: "Calendar-Aware Booking",
    description: "AI checks your Google Calendar and tells the lead exactly which dates you're free. No back-and-forth, no double bookings.",
    color: "bg-blue-100 text-blue-600",
  },
  {
    icon: FileText,
    title: "Brochure & Package Delivery",
    description: "Upload your pricing PDF and ceremony packages. AI sends the right brochure based on what the couple is asking about.",
    color: "bg-purple-100 text-purple-600",
  },
  {
    icon: Scale,
    title: "Legal Requirements Expert",
    description: "AI knows the NOIM process, witness requirements, and state-specific rules. It explains them clearly so you don't have to.",
    color: "bg-amber-100 text-amber-600",
  },
  {
    icon: CreditCard,
    title: "Deposit Collection",
    description: "When the lead is ready, AI generates a Stripe payment link for your booking deposit. From inquiry to payment in one conversation.",
    color: "bg-green-100 text-green-600",
  },
  {
    icon: RefreshCw,
    title: "HubSpot CRM Sync",
    description: "Wedding date, venue, partner names, ceremony type — all extracted from the conversation and synced to HubSpot automatically.",
    color: "bg-indigo-100 text-indigo-600",
  },
];

const painPoints = [
  {
    icon: Clock,
    title: "Weekend inquiries go unanswered",
    stat: "85%",
    statLabel: "of wedding inquiries come on weekends",
    description: "Exactly when you're performing ceremonies. By Monday morning, they've already booked someone else. The first celebrant to respond wins — and right now, that's not you.",
  },
  {
    icon: MessageCircle,
    title: "Repetitive questions eat your time",
    stat: "20+",
    statLabel: "identical questions answered per week",
    description: "How much do you charge? What's the NOIM? Are you free on [date]? What's included? You answer the same questions over and over, taking time away from what matters — writing ceremonies.",
  },
  {
    icon: AlertTriangle,
    title: "Leads slip through the cracks",
    stat: "4",
    statLabel: "different channels to monitor",
    description: "Instagram DMs, WhatsApp messages, website contact forms, phone calls — keeping track across channels is impossible. One missed DM = one lost $3,000 booking.",
  },
];

const chatMessages = [
  { time: "10:03 AM", sender: "lead", name: "Emma", content: "Hi! My partner and I are getting married at Taronga Zoo on Oct 12, 2026. Are you available?" },
  { time: "10:03 AM", sender: "ai", content: "Hi there! I'm Sarah's AI assistant. Congratulations on your upcoming wedding! Let me check Sarah's calendar for October 12, 2026...\n\nGreat news — she's available! Taronga Zoo is one of her favourite venues for outdoor ceremonies. Sarah's 'Love Story' package ($2,800) is very popular for 2026 weddings. Would you like me to send the full brochure?" },
  { time: "10:05 AM", sender: "lead", name: "Emma", content: "Yes please! Also, what paperwork do we need? We're both Australian citizens." },
  { time: "10:05 AM", sender: "ai", content: "I've sent the brochure to your DMs!\n\nFor the legal side: as Australian citizens, you'll need to lodge a Notice of Intended Marriage (NOIM) at least 1 month before your wedding. Sarah handles all the paperwork — you'll just need your birth certificates and photo ID. She'll walk you through everything at the first meeting." },
  { time: "10:08 AM", sender: "lead", name: "Emma", content: "Amazing! Can we book a consultation?" },
  { time: "10:08 AM", sender: "ai", content: "Of course! Sarah is available for a free 30-minute consultation:\n\n- Thursday 2:00 PM\n- Saturday 10:00 AM\n\nWhich works better for you?" },
  { time: "10:09 AM", sender: "lead", name: "Emma", content: "Thursday 2pm works!" },
  { time: "10:09 AM", sender: "ai", content: "Booked! Sarah will meet you Thursday at 2:00 PM.\n\nTo secure October 12 before someone else does, here's a $200 deposit link. The deposit is fully refundable within 14 days.\n\n[Pay $200 Deposit]" },
  { time: "10:15 AM", sender: "lead", name: "Emma", content: "Paid! So excited!!" },
  { time: "10:16 AM", sender: "notification", content: "New booking! Emma & Liam — Oct 12, 2026, Taronga Zoo. Deposit paid ($200). Consultation: Thursday 2 PM." },
];

const results = [
  { before: "4 hours", after: "12 seconds", label: "Response Time" },
  { before: "23%", after: "58%", label: "Weekend Conversion" },
  { before: "—", after: "+$47K", label: "Revenue / Year" },
  { before: "20 hrs", after: "5 hrs", label: "Admin / Week" },
];

const testimonials = [
  {
    quote: "I was losing 3-4 bookings every month to slow responses. LeadFlow changed that overnight. My Saturday DMs now convert at nearly 60%.",
    name: "Sarah M.",
    role: "Marriage Celebrant",
    location: "Sydney, NSW",
    initials: "SM",
    color: "bg-rose-500",
  },
  {
    quote: "The legal questions alone used to eat up hours of my week. Now the AI explains the NOIM perfectly every time. I just focus on writing beautiful ceremonies.",
    name: "David L.",
    role: "Marriage Celebrant",
    location: "Melbourne, VIC",
    initials: "DL",
    color: "bg-blue-500",
  },
];

const faqs = [
  {
    q: "Does the AI know about marriage laws in my state?",
    a: "Yes! You upload your state-specific documents (NSW, VIC, QLD, etc.) to the Knowledge Base. The AI learns from your documents using RAG (Retrieval Augmented Generation), so it always provides accurate, up-to-date information about NOIM requirements, witness rules, and legal timelines specific to your state.",
  },
  {
    q: "What if a couple wants to speak to me directly?",
    a: "You can toggle \"Human Mode\" on any conversation with one tap. The AI immediately stops responding and you take over. It even drafts ghostwritten replies based on the conversation context, so you can send a perfect response with one tap.",
  },
  {
    q: "Can I customise the AI's personality and tone?",
    a: "Absolutely. You can edit the system prompt for each AI agent to match your voice — warm and bubbly, professional and elegant, casual and fun. The AI adapts to your brand personality. You can also add specific instructions like \"always mention our rehearsal dinner option\" or \"suggest the garden package for outdoor venues.\"",
  },
  {
    q: "What channels do couples typically use to inquire?",
    a: "Based on our data from Australian celebrants: Instagram DMs (65%), WhatsApp (20%), Website contact forms (10%), Phone calls (5%). LeadFlow covers all of these channels from one unified inbox, so you never miss an inquiry regardless of where it comes from.",
  },
  {
    q: "How long does setup take?",
    a: "Under 10 minutes. Connect your Instagram account, upload your pricing PDF and FAQ document, and you're live. The AI starts responding to inquiries immediately. Most celebrants spend another 15-20 minutes customising the AI's tone and adding their specific packages.",
  },
];

export default function MarriageCelebrantsPage() {
  return (
    <div className="bg-white">
      {/* ===== HERO ===== */}
      <SectionHeroDark
        eyebrow="For Marriage Celebrants"
        title={
          <>
            The AI assistant built for{" "}
            <span className="bg-gradient-to-r from-cyan-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              marriage celebrants
            </span>
          </>
        }
        subtitle="Respond to every inquiry in seconds — even while you're walking down the aisle with another couple. LeadFlow AI handles your DMs, qualifies leads, sends brochures, checks your calendar, and collects deposits. Automatically."
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/register"
            className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-cyan-500 to-violet-600 text-white rounded-xl text-base font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all"
          >
            Start Free Trial
          </Link>
          <a
            href="#demo"
            className="inline-flex items-center justify-center px-8 py-4 border-2 border-white/20 text-white rounded-xl text-base font-semibold hover:border-cyan-400/50 hover:bg-white/5 transition-all"
          >
            Watch the Demo
          </a>
        </div>
        <p className="mt-6 text-sm text-slate-400 flex items-center justify-center gap-2">
          <Heart className="w-4 h-4 text-rose-400" />
          Trusted by 200+ Australian celebrants &middot; No credit card required
        </p>
      </SectionHeroDark>

      {/* ===== THE PROBLEM ===== */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              You&apos;re losing bookings while you&apos;re busy doing what you love
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Every minute you can&apos;t respond is a minute your competitor can.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {painPoints.map((point, i) => {
              const Icon = point.icon;
              return (
                <ScrollReveal key={point.title} delay={i * 60}>
                  <div className="bg-white rounded-2xl p-8 border transition hover:-translate-y-1 hover:shadow-xl hover:border-cyan-400/40">
                    <Icon className="w-8 h-8 text-red-500 mb-4" />
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-3xl font-extrabold text-gray-900">{point.stat}</span>
                      <span className="text-sm text-gray-500">{point.statLabel}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{point.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{point.description}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== THE SOLUTION ===== */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-50 text-rose-700 text-sm font-medium mb-4">
              <Shield className="w-4 h-4" />
              Your AI Chief of Staff
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Trained on YOUR business
            </h2>
            <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
              Upload your pricing, packages, and legal documents. The AI learns your
              business and represents you perfectly.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <ScrollReveal key={feature.title} delay={i * 60}>
                  <div className="bg-white rounded-2xl p-8 border transition hover:-translate-y-1 hover:shadow-xl hover:border-cyan-400/40">
                    <div className={`w-12 h-12 rounded-xl ${feature.color} flex items-center justify-center mb-5`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{feature.description}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===== LIVE DEMO ===== */}
      <section id="demo" className="py-20 px-4 bg-rose-50/50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              See it in action: Saturday afternoon inquiry
            </h2>
            <p className="mt-3 text-gray-500">
              A real conversation flow — from first DM to deposit in 12 minutes.
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border overflow-hidden">
            {/* Chat header */}
            <div className="flex items-center gap-3 p-5 border-b bg-gray-50">
              <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center text-white text-sm font-bold">EC</div>
              <div>
                <p className="text-sm font-semibold">Emma & Liam — Wedding Inquiry</p>
                <p className="text-xs text-gray-400">Instagram DM &middot; Saturday</p>
              </div>
              <span className="ml-auto text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">AI Active</span>
            </div>

            {/* Messages */}
            <div className="p-5 space-y-4 max-h-[600px] overflow-y-auto">
              {chatMessages.map((msg, i) => {
                if (msg.sender === "notification") {
                  return (
                    <div key={i} className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                      <p className="text-xs text-amber-500 font-semibold mb-1">Notification to Sarah</p>
                      <p className="text-sm text-amber-800">{msg.content}</p>
                    </div>
                  );
                }
                const isLead = msg.sender === "lead";
                return (
                  <div key={i} className={`flex ${isLead ? "justify-start" : "justify-end"}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      isLead
                        ? "bg-gray-100 rounded-tl-sm"
                        : "bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-tr-sm"
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-gray-400">{msg.time}</span>
                        {!isLead && <span className="text-[10px] text-rose-400 font-medium">AI Assistant</span>}
                        {isLead && msg.name && <span className="text-[10px] text-gray-500 font-medium">{msg.name}</span>}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t text-center">
              <p className="text-sm font-semibold text-rose-600">
                From first message to deposit: 12 minutes
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Sarah was performing a ceremony the entire time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== RESULTS ===== */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900">
              Results from real celebrants
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
            {results.map((r, i) => (
              <ScrollReveal key={r.label} delay={i * 60}>
                <div className="bg-white rounded-2xl border p-6 text-center transition hover:-translate-y-1 hover:shadow-xl hover:border-cyan-400/40">
                  <p className="text-xs text-gray-400 line-through mb-1">{r.before}</p>
                  <p className="text-3xl font-extrabold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">
                    {r.after}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">{r.label}</p>
                </div>
              </ScrollReveal>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.map((t, i) => (
              <ScrollReveal key={t.name} delay={i * 60}>
                <div className="bg-white rounded-2xl border p-8 transition hover:-translate-y-1 hover:shadow-xl hover:border-cyan-400/40">
                  <div className="flex gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${t.color} flex items-center justify-center text-white text-sm font-bold`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.role}, {t.location}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section className="py-20 px-4 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            An investment that pays for itself
          </h2>
          <div className="bg-white rounded-2xl border p-8 mb-8">
            <div className="grid sm:grid-cols-3 gap-6 items-center">
              <div>
                <p className="text-sm text-gray-500">Average booking</p>
                <p className="text-3xl font-extrabold text-gray-900">$2,800</p>
              </div>
              <div className="text-4xl text-gray-300">vs</div>
              <div>
                <p className="text-sm text-gray-500">LeadFlow Pro</p>
                <p className="text-3xl font-extrabold bg-gradient-to-r from-rose-500 to-pink-600 bg-clip-text text-transparent">$149<span className="text-lg text-gray-400">/mo</span></p>
              </div>
            </div>
            <p className="mt-6 text-gray-600">
              You need <strong>ONE extra booking every 19 months</strong> to cover the entire
              cost. Most celebrants see 3-5 additional bookings in the first month alone.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-base font-semibold shadow-lg shadow-rose-500/25 hover:shadow-xl transition-all"
          >
            Start Your Free Trial
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* ===== FAQ ===== */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-10">
            Questions from celebrants
          </h2>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <ScrollReveal key={faq.q} delay={i * 60}>
                <details
                  className="group rounded-2xl border border-gray-200 bg-white overflow-hidden hover:border-cyan-400/40 transition-colors"
                >
                  <summary className="flex cursor-pointer items-center justify-between px-6 py-5 text-sm font-semibold text-gray-900 select-none list-none [&::-webkit-details-marker]:hidden">
                    <span>{faq.q}</span>
                    <span className="ml-4 shrink-0 w-6 h-6 rounded-full bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-all duration-200 group-open:rotate-45 group-open:bg-rose-100 group-open:text-rose-600">
                      <span className="text-lg leading-none">+</span>
                    </span>
                  </summary>
                  <div className="px-6 pb-5 text-sm text-gray-600 leading-relaxed">
                    {faq.a}
                  </div>
                </details>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* ===== FINAL CTA ===== */}
      <section className="px-4 pb-24">
        <div className="mx-auto max-w-3xl text-center rounded-3xl bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 px-8 py-16 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_50%)]" />
          <div className="relative">
            <Heart className="w-10 h-10 text-white/80 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white">
              Ready to never miss a wedding inquiry again?
            </h2>
            <p className="mt-3 text-rose-100 max-w-md mx-auto">
              Join 200+ Australian celebrants using LeadFlow AI to respond faster,
              convert more, and spend less time on admin.
            </p>
            <Link
              href="/register"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-sm font-bold text-gray-900 shadow-lg hover:bg-gray-50 transition-all hover:shadow-xl"
            >
              Start Your Free Trial
              <ArrowRight className="w-4 h-4 text-rose-600" />
            </Link>
            <p className="mt-4 text-xs text-rose-200">
              No credit card required &middot; Cancel anytime
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
