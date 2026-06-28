"use client";

import { useState } from "react";
import {
  MessageCircle, Instagram, Smartphone, Phone, Globe,
  Bot, Brain, Zap, ArrowDown, ArrowRight, Calendar,
  CreditCard, RefreshCw, Users, Shield, Filter,
  Sparkles, Eye, UserCheck, Bell, Database,
  ChevronDown, ChevronRight, CheckCircle2,
  Mail, Key, BarChart3, BookOpen, Search,
  Settings, AlertTriangle, Lock, Trash2, Activity,
  Flag, FileText, Radio, Package, Server,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const channels = [
  { name: "WhatsApp", icon: MessageCircle, color: "bg-green-500", desc: "Twilio API" },
  { name: "Instagram", icon: Instagram, color: "bg-pink-500", desc: "Meta Graph API" },
  { name: "SMS", icon: Smartphone, color: "bg-blue-500", desc: "Twilio API" },
  { name: "Voice", icon: Phone, color: "bg-orange-500", desc: "Vapi AI" },
  { name: "Web Chat", icon: Globe, color: "bg-teal-500", desc: "Embedded Widget" },
];

const agents = [
  {
    name: "Concierge Agent",
    icon: Eye,
    color: "from-purple-500 to-purple-700",
    bgLight: "bg-purple-50 border-purple-200",
    textColor: "text-purple-700",
    role: "Classifies & Routes",
    desc: "Analyzes every inbound message to determine intent, sentiment, and urgency. Decides which agent should handle the response.",
    outputs: [
      { label: "Intent", examples: "booking_inquiry, pricing, complaint, opt_out" },
      { label: "Sentiment", examples: "positive, neutral, negative" },
      { label: "Urgency", examples: "high, medium, low" },
      { label: "Routing", examples: "→ Knowledge, → Action, → Direct, → Human" },
    ],
  },
  {
    name: "Knowledge Agent",
    icon: Brain,
    color: "from-blue-500 to-blue-700",
    bgLight: "bg-blue-50 border-blue-200",
    textColor: "text-blue-700",
    role: "Answers Questions",
    desc: "Searches your uploaded documents (pricing, FAQs, legal info) using RAG vector search. Generates accurate, grounded answers with citations.",
    outputs: [
      { label: "Input", examples: "Lead's question + relevant document chunks" },
      { label: "Method", examples: "Voyage AI embeddings → vector similarity search" },
      { label: "Output", examples: "Grounded response with source citations" },
      { label: "Fallback", examples: "\"I'll check with the team and get back to you\"" },
    ],
  },
  {
    name: "Action Agent",
    icon: Zap,
    color: "from-green-500 to-green-700",
    bgLight: "bg-green-50 border-green-200",
    textColor: "text-green-700",
    role: "Takes Action",
    desc: "Executes real tasks via tool calling — checks calendars, books appointments, generates payment links, updates your CRM. Runs in a loop until the task is complete.",
    outputs: [
      { label: "check_calendar", examples: "Checks Google/Outlook availability" },
      { label: "book_appointment", examples: "Creates calendar event" },
      { label: "generate_payment_link", examples: "Stripe deposit link ($AUD)" },
      { label: "update_contact", examples: "Saves wedding date, venue, names to CRM" },
      { label: "escalate_to_human", examples: "Hands off to business owner" },
    ],
  },
];

const integrations = [
  { name: "OpenAI", icon: Brain, color: "bg-gray-100 text-gray-700", desc: "GPT-4o for AI responses, text-embedding-3-small for RAG vector search" },
  { name: "Twilio", icon: Smartphone, color: "bg-red-100 text-red-600", desc: "WhatsApp & SMS channels — inbound webhooks + outbound message delivery" },
  { name: "Vapi AI", icon: Phone, color: "bg-orange-100 text-orange-600", desc: "Voice AI — inbound/outbound call handling with transcription" },
  { name: "Meta Graph API", icon: Instagram, color: "bg-pink-100 text-pink-600", desc: "Instagram DMs and Facebook Messenger — bidirectional webhook integration" },
  { name: "Stripe", icon: CreditCard, color: "bg-purple-100 text-purple-600", desc: "On-demand deposit payment links + subscription billing via webhooks" },
  { name: "SendGrid", icon: Mail, color: "bg-blue-100 text-blue-600", desc: "Transactional emails — booking confirmations, lead follow-ups, broadcasts" },
  { name: "HubSpot", icon: RefreshCw, color: "bg-orange-100 text-orange-600", desc: "Bidirectional CRM sync — contacts, deals, and properties via webhook" },
  { name: "Supabase", icon: Database, color: "bg-emerald-100 text-emerald-600", desc: "PostgreSQL database + Auth + Storage + Realtime subscriptions" },
];

const dashboardFeatures = [
  { icon: MessageCircle, title: "Real-Time Conversations", desc: "Full message thread with live Supabase Realtime subscription, optimistic sends, and AI toggle per conversation" },
  { icon: Users, title: "Contacts CRM", desc: "Searchable, filterable contact list with temperature badges, pagination, and full detail page with edit/delete" },
  { icon: Filter, title: "Lead Temperature", desc: "Hot (10 min) / Warm (1 hr) / Cold — auto-calculated from last message time, shown across all views" },
  { icon: Calendar, title: "Bookings + Calendar", desc: "List and month calendar views with status-colored dots, day-expand panel, and booking action buttons" },
  { icon: BookOpen, title: "Knowledge Base", desc: "Create and manage knowledge bases, upload documents, view chunk counts per source" },
  { icon: BarChart3, title: "Analytics Dashboard", desc: "Lead funnel bar chart, temperature donut, message volume area chart — all from live API data" },
  { icon: Bell, title: "Notifications", desc: "Real-time bell icon with unread count badge, dropdown panel with mark-read, Supabase Realtime subscription" },
  { icon: UserCheck, title: "Human Takeover", desc: "Toggle AI off per conversation, get AI-ghostwritten suggestions, hand back to AI when ready" },
  { icon: Radio, title: "Channel Management", desc: "Configure WhatsApp, SMS, Instagram, Voice, and Web Chat adapters from the Channels settings page" },
  { icon: Sparkles, title: "AI Suggestions", desc: "AI drafts reply suggestions in the conversation thread that can be sent with one tap" },
  { icon: Search, title: "Search & Filters", desc: "Server-side search, status/channel/temperature filters, and pagination across conversations and contacts" },
  { icon: Settings, title: "Editable Settings", desc: "Profile form with live save, integration API key management (OpenAI, Twilio, Stripe, SendGrid, Meta, WhatsApp) with modal configure flow" },
];

const adminFeatures = [
  { icon: Users, title: "User Management", desc: "List all accounts, view per-user detail, suspend/unsuspend, change plan, reset password, resend verification email" },
  { icon: UserCheck, title: "Impersonation", desc: "Securely impersonate any user (cookie-based overlay), amber banner warns admin, Exit Impersonation clears session and logs audit event" },
  { icon: Flag, title: "Feature Flags", desc: "Create flags with global on/off or rollout % bucket (hash-based), per-user overrides, live toggle without deploy" },
  { icon: FileText, title: "Audit Logs", desc: "Immutable log of every admin action — actor, action, target, IP, user agent. Filterable table with CSV export" },
  { icon: BarChart3, title: "Platform Analytics", desc: "Cross-tenant metrics — total users, active users, message volume, conversation counts, growth trends" },
  { icon: Mail, title: "Communications", desc: "Send email to individual user or broadcast to segments (all/free/paid/inactive), post system-wide announcement notifications" },
  { icon: Trash2, title: "GDPR / Data", desc: "Full JSON data export per user, hard-delete cascade (messages → conversations → contacts → auth), bulk archive/reassign contacts" },
  { icon: Server, title: "System Health", desc: "Live health checks for DB, Supabase Auth, Stripe, Resend, OpenAI — latency, status badges, env var audit, auto-refresh every 30s" },
  { icon: Package, title: "Account Management", desc: "Per-account deep-dive: member count, contact/booking counts, usage breakdown, linked notes and tags" },
  { icon: AlertTriangle, title: "Support Tools", desc: "Admin notes timeline per user (internal, not visible to user), colored account tags (enterprise, VIP, at-risk, beta, partner)" },
];

const complianceSteps = [
  { label: "AI Transparency", desc: "AI identifies itself in the first message" },
  { label: "Opt-Out Handling", desc: "STOP keyword instantly suppresses future messages" },
  { label: "Data Sovereignty", desc: "All data stored in Sydney, Australia (APP compliant)" },
  { label: "Response Limits", desc: "Responses capped at 1000 chars, no medical/legal advice" },
];

const dbTables = [
  { name: "profiles", desc: "User settings, API keys (OpenAI, Twilio, Stripe, SendGrid, Meta, WhatsApp), business info" },
  { name: "contacts", desc: "Leads & customers with temperature, status, tags, and all custom fields" },
  { name: "conversations", desc: "One per contact per channel, AI enabled/disabled flag, last message time" },
  { name: "messages", desc: "Full message thread with role (user/assistant), channel type, metadata" },
  { name: "bookings", desc: "Appointments with service, date, status, deposit paid flag, Stripe payment ID" },
  { name: "knowledge_bases", desc: "Named knowledge bases with document chunks stored as embeddings" },
  { name: "notifications", desc: "Per-user notifications with read flag, realtime subscriptions for live bell updates" },
  { name: "audit_logs", desc: "Immutable admin action log — actor, action, target, IP, user agent, timestamp" },
  { name: "feature_flags", desc: "System feature flags with rollout %, per-user override table" },
  { name: "admin_notes", desc: "Internal admin notes per user — timestamped, author-tracked" },
  { name: "account_tags", desc: "Colored account classification tags (enterprise, VIP, at-risk, etc.)" },
];

const apiGroups = [
  { group: "Webhooks", count: 7, desc: "Twilio, Vapi, Meta, HubSpot, Stripe — all inbound event handlers" },
  { group: "Conversations", count: 4, desc: "CRUD + real-time message send with AI processing" },
  { group: "Contacts", count: 3, desc: "List/search/filter, create, update, delete" },
  { group: "Bookings", count: 10, desc: "Bookings, services, availability, blocked dates, settings" },
  { group: "Knowledge Bases", count: 5, desc: "CRUD + document upload + chunk indexing" },
  { group: "AI / Chat", count: 4, desc: "Message processing, suggestion generation, agent routing" },
  { group: "Channels", count: 3, desc: "Channel config CRUD + manual message send" },
  { group: "Settings", count: 2, desc: "Profile + integrations PUT endpoints" },
  { group: "Analytics", count: 1, desc: "Aggregated metrics for dashboard charts" },
  { group: "Notifications", count: 1, desc: "List + mark-read" },
  { group: "Admin", count: 21, desc: "Users, accounts, audit logs, feature flags, health, GDPR, impersonation, comms" },
  { group: "Public", count: 4, desc: "Public booking page, newsletter, contact form" },
];

/* ------------------------------------------------------------------ */
/*  Components                                                         */
/* ------------------------------------------------------------------ */

function FlowArrow({ label, className }: { label?: string; className?: string }) {
  return (
    <div className={cn("flex flex-col items-center gap-1 py-3", className)}>
      <div className="w-0.5 h-6 bg-gray-300" />
      {label && (
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider bg-white px-2">
          {label}
        </span>
      )}
      <ArrowDown className="w-4 h-4 text-gray-400" />
    </div>
  );
}

function ExpandableSection({
  title,
  icon: Icon,
  defaultOpen = false,
  badge,
  badgeColor = "bg-blue-100 text-blue-700",
  children,
}: {
  title: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-2xl bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition-colors"
      >
        <Icon className="w-5 h-5 text-gray-500" />
        <span className="font-semibold text-gray-900 flex-1 text-left">{title}</span>
        {badge && (
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium", badgeColor)}>{badge}</span>
        )}
        {open ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-6 pb-6 border-t">{children}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function SystemFlowPage() {
  const [activeAgent, setActiveAgent] = useState<number | null>(null);

  return (
    <div className="max-w-5xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">System Architecture</h1>
        <p className="text-gray-500 mt-1">How LeadFlow AI processes every lead from first message to conversion.</p>
      </div>

      {/* ========== LAYER 1: CHANNELS ========== */}
      <ExpandableSection title="Layer 1 — Omni-Channel Capture" icon={MessageCircle} defaultOpen badge="5 Channels">
        <div className="pt-4">
          <p className="text-sm text-gray-500 mb-5">
            Leads reach out on any platform. Each channel has a dedicated adapter that normalizes messages into a unified format before passing them to the AI pipeline.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {channels.map((ch) => {
              const Icon = ch.icon;
              return (
                <div key={ch.name} className="flex flex-col items-center gap-2 p-4 rounded-xl border bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", ch.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-sm font-semibold">{ch.name}</span>
                  <span className="text-[10px] text-gray-400">{ch.desc}</span>
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-4 rounded-xl bg-gray-900 text-gray-300 text-xs font-mono">
            <p className="text-gray-500 mb-2">{"// Every message is normalized to a unified format:"}</p>
            <p>{"{"}</p>
            <p className="pl-4">externalMessageId: <span className="text-green-400">&quot;msg_abc123&quot;</span>,</p>
            <p className="pl-4">senderPhone: <span className="text-green-400">&quot;+61 423 456 789&quot;</span>,</p>
            <p className="pl-4">content: <span className="text-green-400">&quot;Are you free Oct 12?&quot;</span>,</p>
            <p className="pl-4">channelType: <span className="text-green-400">&quot;instagram&quot;</span>,</p>
            <p className="pl-4">contentType: <span className="text-green-400">&quot;text&quot;</span>,</p>
            <p>{"}"}</p>
          </div>
        </div>
      </ExpandableSection>

      <FlowArrow label="Webhook → Normalize → Store" />

      {/* ========== LAYER 2: AI ORCHESTRATOR ========== */}
      <ExpandableSection title="Layer 2 — AI Orchestrator" icon={Bot} defaultOpen badge="3 Agents">
        <div className="pt-4">
          <p className="text-sm text-gray-500 mb-5">
            The orchestrator runs a multi-step pipeline: Concierge classifies → routes to Knowledge or Action agent → response is composed with compliance rules applied before sending.
          </p>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            {agents.map((agent, i) => {
              const Icon = agent.icon;
              const isActive = activeAgent === i;
              return (
                <button
                  key={agent.name}
                  onClick={() => setActiveAgent(isActive ? null : i)}
                  className={cn(
                    "flex-1 rounded-xl border-2 p-5 text-left transition-all",
                    isActive ? agent.bgLight : "bg-white border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={cn("w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center text-white", agent.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{agent.name}</p>
                      <p className="text-[10px] text-gray-400 uppercase tracking-wider">{agent.role}</p>
                    </div>
                    {i < agents.length - 1 && (
                      <ArrowRight className="w-4 h-4 text-gray-300 ml-auto hidden md:block" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{agent.desc}</p>
                </button>
              );
            })}
          </div>

          {activeAgent !== null && (
            <div className={cn("rounded-xl border-2 p-5", agents[activeAgent].bgLight)}>
              <h4 className={cn("font-semibold mb-3", agents[activeAgent].textColor)}>
                {agents[activeAgent].name} — Details
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {agents[activeAgent].outputs.map((out) => (
                  <div key={out.label} className="bg-white rounded-lg p-3 border">
                    <p className="text-xs font-semibold text-gray-700">{out.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{out.examples}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-5 p-4 rounded-xl bg-gray-900 text-gray-300 text-xs font-mono">
            <p className="text-gray-500 mb-2">{"// Orchestrator Pipeline — /api/ai/process-message"}</p>
            <p><span className="text-blue-400">1.</span> message → <span className="text-purple-400">Concierge</span>.classify(intent, sentiment, urgency)</p>
            <p><span className="text-blue-400">2.</span> <span className="text-yellow-400">if</span> routing === <span className="text-green-400">&quot;knowledge&quot;</span> → <span className="text-blue-400">Knowledge</span>.answer(query, docs)</p>
            <p><span className="text-blue-400">3.</span> <span className="text-yellow-400">if</span> routing === <span className="text-green-400">&quot;action&quot;</span> → <span className="text-green-400">Action</span>.execute(tools[], max 5 loops)</p>
            <p><span className="text-blue-400">4.</span> <span className="text-yellow-400">if</span> routing === <span className="text-green-400">&quot;human_handoff&quot;</span> → disable AI, notify owner via realtime</p>
            <p><span className="text-blue-400">5.</span> response → <span className="text-orange-400">Compliance</span>.compose(disclaimer, opt-out, truncate)</p>
            <p><span className="text-blue-400">6.</span> send via channel adapter → store in messages table → update contact temperature</p>
          </div>
        </div>
      </ExpandableSection>

      <FlowArrow label="AI Response → Compliance → Send" />

      {/* ========== LAYER 3: INTEGRATIONS ========== */}
      <ExpandableSection title="Layer 3 — Integrations & External Services" icon={RefreshCw} badge="8 Services">
        <div className="pt-4">
          <p className="text-sm text-gray-500 mb-5">
            The Action Agent calls external services via tool use. API keys are stored per-account in the profiles table and configured via Settings → Integrations.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {integrations.map((int) => {
              const Icon = int.icon;
              return (
                <div key={int.name} className="flex items-start gap-4 p-4 rounded-xl border bg-white hover:bg-gray-50 transition-colors">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center shrink-0", int.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{int.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{int.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ExpandableSection>

      <FlowArrow label="Data flows both ways" />

      {/* ========== LAYER 4: DASHBOARD ========== */}
      <ExpandableSection title="Layer 4 — Dashboard & HITL" icon={Users} badge="12 Features">
        <div className="pt-4">
          <p className="text-sm text-gray-500 mb-5">
            The business owner monitors and manages everything in real time. Supabase Realtime powers live updates across conversations, notifications, and contact state.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {dashboardFeatures.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl border bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
                  <Icon className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold">{item.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </ExpandableSection>

      <FlowArrow label="Admin layer (service-role access)" />

      {/* ========== LAYER 5: ADMIN PANEL ========== */}
      <ExpandableSection
        title="Layer 5 — Admin Panel"
        icon={Lock}
        badge="10 Sections"
        badgeColor="bg-red-100 text-red-700"
      >
        <div className="pt-4">
          <p className="text-sm text-gray-500 mb-5">
            Full SaaS operator control plane. All admin API routes use the Supabase service role key (bypasses RLS) to access cross-tenant data. Every action is written to the immutable audit log.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {adminFeatures.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="flex items-start gap-3 p-4 rounded-xl border bg-red-50 border-red-100 hover:bg-white transition-all">
                  <Icon className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-red-900">{item.title}</p>
                    <p className="text-xs text-red-700/70 mt-0.5">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-5 p-4 rounded-xl bg-gray-900 text-gray-300 text-xs font-mono">
            <p className="text-gray-500 mb-2">{"// Admin auth pattern — every route"}</p>
            <p><span className="text-blue-400">const</span> {"{"} user {"}"} = <span className="text-yellow-400">await</span> adminClient.auth.getUser()</p>
            <p><span className="text-yellow-400">if</span> (!user || user.role !== <span className="text-green-400">&quot;admin&quot;</span>) <span className="text-yellow-400">return</span> 401</p>
            <p className="mt-2 text-gray-500">{"// All queries use adminClient (service role) — bypasses RLS"}</p>
            <p><span className="text-yellow-400">await</span> <span className="text-blue-400">logAuditEvent</span>{"({ actorId, action, targetType, targetId })"}</p>
          </div>
        </div>
      </ExpandableSection>

      <FlowArrow label="Compliance layer" />

      {/* ========== LAYER 6: COMPLIANCE ========== */}
      <ExpandableSection title="Layer 6 — Australian Compliance" icon={Shield}>
        <div className="pt-4">
          <p className="text-sm text-gray-500 mb-5">
            Every response passes through compliance checks before being sent. Built for Australian Privacy Principles (APP).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {complianceSteps.map((step) => (
              <div key={step.label} className="flex items-start gap-3 p-4 rounded-xl border bg-green-50 border-green-200">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-green-800">{step.label}</p>
                  <p className="text-xs text-green-600 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ExpandableSection>

      <FlowArrow label="Data layer" />

      {/* ========== DATABASE SCHEMA ========== */}
      <ExpandableSection title="Database Schema" icon={Database} badge="11 Tables" badgeColor="bg-emerald-100 text-emerald-700">
        <div className="pt-4">
          <p className="text-sm text-gray-500 mb-5">
            All tables have Row-Level Security (RLS) enabled. User-scoped tables filter by <code className="bg-gray-100 px-1 rounded text-xs">auth.uid()</code>. Admin tables use service-role access only.
          </p>
          <div className="space-y-2">
            {dbTables.map((table) => (
              <div key={table.name} className="flex items-start gap-4 p-3 rounded-lg border bg-gray-50">
                <code className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded shrink-0 min-w-[160px]">
                  {table.name}
                </code>
                <p className="text-xs text-gray-600 mt-0.5">{table.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </ExpandableSection>

      <FlowArrow label="REST API surface" />

      {/* ========== API ROUTES ========== */}
      <ExpandableSection title="API Routes" icon={Activity} badge="60+ Endpoints" badgeColor="bg-gray-100 text-gray-700">
        <div className="pt-4">
          <p className="text-sm text-gray-500 mb-5">
            All endpoints authenticate via <code className="bg-gray-100 px-1 rounded text-xs">getUser()</code> before any database operation. Inputs validated with Zod. Returns <code className="bg-gray-100 px-1 rounded text-xs">{"{ data }"}</code> or <code className="bg-gray-100 px-1 rounded text-xs">{"{ error }"}</code>.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {apiGroups.map((group) => (
              <div key={group.group} className="flex items-start gap-3 p-4 rounded-xl border bg-white">
                <span className="text-xs font-mono font-bold text-white bg-gray-700 px-1.5 py-0.5 rounded shrink-0">
                  {group.count}
                </span>
                <div>
                  <p className="text-sm font-semibold">{group.group}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{group.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ExpandableSection>

      {/* ========== END-TO-END EXAMPLE ========== */}
      <div className="mt-10 rounded-2xl border-2 border-blue-200 bg-blue-50/50 p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-blue-600" />
          End-to-End Example: Wedding Inquiry
        </h3>
        <div className="space-y-0">
          {[
            { time: "0:00", emoji: "📩", event: "Lead DMs on Instagram", detail: "\"Are you free Oct 12, 2026?\"", color: "border-pink-300 bg-pink-50" },
            { time: "0:02", emoji: "🔔", event: "Webhook received", detail: "Meta Graph API → /api/webhooks/meta → Normalize → Store in messages table → Create/update contact", color: "border-gray-300 bg-white" },
            { time: "0:03", emoji: "🧠", event: "Concierge classifies", detail: "Intent: booking_inquiry | Sentiment: positive | Urgency: high | Route → Action Agent", color: "border-purple-300 bg-purple-50" },
            { time: "0:04", emoji: "⚡", event: "Action Agent calls tools", detail: "check_calendar(\"2026-10-12\") → Available! | update_contact(wedding_date, \"2026-10-12\") | Contact temperature → Hot", color: "border-green-300 bg-green-50" },
            { time: "0:05", emoji: "✅", event: "Compliance check", detail: "First message → prepend AI disclaimer | Check opt-out status → not opted out | Truncate to under 1000 chars", color: "border-yellow-300 bg-yellow-50" },
            { time: "0:06", emoji: "💬", event: "AI responds + Dashboard updates", detail: "Response sent via Meta API. Owner gets bell notification (Realtime). Conversation thread updates live. Dashboard KPIs refresh.", color: "border-blue-300 bg-blue-50" },
            { time: "0:08", emoji: "👤", event: "Owner reviews in dashboard", detail: "Opens conversation thread, sees full message history. AI suggests follow-up. Owner can toggle AI off and reply manually.", color: "border-indigo-300 bg-indigo-50" },
            { time: "3:00", emoji: "💳", event: "Lead ready to book", detail: "Action Agent generates Stripe deposit link ($200 AUD) via /api/stripe/create-deposit-link → sent in chat → lead pays → status → Won!", color: "border-emerald-300 bg-emerald-50" },
            { time: "3:05", emoji: "📅", event: "Booking confirmed", detail: "Booking record created, appears in Bookings calendar view with green 'confirmed' status dot. SendGrid sends confirmation email.", color: "border-green-300 bg-green-50" },
          ].map((step, i) => (
            <div key={i} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-white border-2 border-blue-300 flex items-center justify-center text-sm shrink-0">
                  {step.emoji}
                </div>
                {i < 8 && <div className="w-0.5 flex-1 bg-blue-200 min-h-[20px]" />}
              </div>
              <div className={cn("flex-1 rounded-xl border p-4 mb-3", step.color)}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono text-gray-400">{step.time}</span>
                  <span className="text-sm font-semibold">{step.event}</span>
                </div>
                <p className="text-xs text-gray-600">{step.detail}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <p className="text-sm font-semibold text-blue-700">Total time: inquiry → deposit paid = under 5 minutes</p>
          <p className="text-xs text-blue-500 mt-1">While Sarah was at another wedding ceremony.</p>
        </div>
      </div>

      {/* ========== TECH STACK SUMMARY ========== */}
      <div className="mt-6 rounded-2xl border bg-gray-900 text-gray-300 p-6">
        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
          <Key className="w-5 h-5 text-gray-400" />
          Tech Stack
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-xs font-mono">
          {[
            { label: "Framework", value: "Next.js 15 App Router" },
            { label: "Language", value: "TypeScript (strict)" },
            { label: "Database", value: "Supabase (PostgreSQL)" },
            { label: "Auth", value: "Supabase Auth + RLS" },
            { label: "Realtime", value: "Supabase Realtime" },
            { label: "AI", value: "OpenAI GPT-4o" },
            { label: "Embeddings", value: "text-embedding-3-small" },
            { label: "Styling", value: "Tailwind CSS v4" },
            { label: "State", value: "Zustand + RSC" },
            { label: "Charts", value: "Recharts" },
            { label: "Payments", value: "Stripe" },
            { label: "Email", value: "Resend / SendGrid" },
            { label: "SMS/WhatsApp", value: "Twilio" },
            { label: "Voice", value: "Vapi AI" },
            { label: "Validation", value: "Zod" },
            { label: "Deployment", value: "Vercel" },
          ].map((item) => (
            <div key={item.label} className="bg-gray-800 rounded-lg p-3">
              <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-gray-200 text-xs">{item.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
