import Link from "next/link";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  CalendarCheck,
  BookOpen,
  Radio,
  BarChart3,
  GitBranch,
  Settings,
  Shield,
  Home,
  Zap,
  Info,
  DollarSign,
  BookMarked,
  FileText,
  Scale,
  Cookie,
  Lock,
  Code2,
  Globe,
  Briefcase,
  GitCompare,
  Activity,
  LogIn,
  UserPlus,
  KeyRound,
  CalendarDays,
  Eye,
  ExternalLink,
  User,
  Puzzle,
  CreditCard,
  Bot,
  ShieldCheck,
  Flag,
  ScrollText,
  Mail,
  Trash2,
  Server,
  Package,
  HeadphonesIcon,
  Map,
} from "lucide-react";

type PageEntry = {
  href: string;
  label: string;
  description: string;
  icon: React.ElementType;
  external?: boolean;
};

type PageGroup = {
  title: string;
  color: string;
  iconColor: string;
  bgColor: string;
  borderColor: string;
  pages: PageEntry[];
};

const groups: PageGroup[] = [
  {
    title: "Dashboard",
    color: "text-blue-700",
    iconColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
    pages: [
      { href: "/dashboard", label: "Dashboard", description: "KPI cards, lead funnel chart, temperature donut, activity feed", icon: LayoutDashboard },
      { href: "/conversations", label: "Conversations", description: "All conversations across channels with search, status filters, and pagination", icon: MessageSquare },
      { href: "/contacts", label: "Contacts", description: "Full CRM — searchable, filterable contacts with temperature badges", icon: Users },
      { href: "/bookings", label: "Bookings", description: "Booking list and calendar view with status management", icon: CalendarCheck },
      { href: "/bookings/settings", label: "Booking Settings", description: "Configure services, availability schedule, blocked dates, and booking page slug", icon: Settings },
      { href: "/knowledge", label: "Knowledge Base", description: "Manage knowledge bases and uploaded documents for RAG", icon: BookOpen },
      { href: "/channels", label: "Channels", description: "Configure WhatsApp, SMS, Instagram, Voice, and Web Chat adapters", icon: Radio },
      { href: "/analytics", label: "Analytics", description: "Conversion funnel, channel breakdown, message volume, and performance charts", icon: BarChart3 },
      { href: "/system-flow", label: "System Architecture", description: "Interactive diagram of how LeadFlow AI processes every lead", icon: GitBranch },
      { href: "/app-pages", label: "App Pages", description: "You are here — full sitemap of every page in the app", icon: Map },
    ],
  },
  {
    title: "Settings",
    color: "text-gray-700",
    iconColor: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    pages: [
      { href: "/settings/profile", label: "Profile Settings", description: "Business name, type, timezone, phone, and website", icon: User },
      { href: "/settings/integrations", label: "Integrations", description: "Connect OpenAI, Twilio, Stripe, SendGrid, Meta, and WhatsApp", icon: Puzzle },
      { href: "/settings/team", label: "Team", description: "Invite and manage team members", icon: Users },
      { href: "/settings/billing", label: "Billing", description: "Manage your subscription plan and payment method", icon: CreditCard },
      { href: "/settings/ai", label: "AI Settings", description: "Configure AI agents, prompts, temperature, and response limits", icon: Bot },
      { href: "/settings/compliance", label: "Compliance", description: "Opt-out handling, data retention, and privacy settings", icon: ShieldCheck },
    ],
  },
  {
    title: "Admin Panel",
    color: "text-red-700",
    iconColor: "text-red-600",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    pages: [
      { href: "/admin", label: "Admin Overview", description: "Platform-wide stats — users, messages, bookings, active conversations", icon: Shield },
      { href: "/admin/accounts", label: "Accounts", description: "All tenant accounts with member, contact, and booking counts", icon: Package },
      { href: "/admin/analytics", label: "Platform Analytics", description: "Cross-tenant growth metrics, message volume, and conversion trends", icon: BarChart3 },
      { href: "/admin/audit-logs", label: "Audit Logs", description: "Immutable log of every admin action with CSV export", icon: ScrollText },
      { href: "/admin/feature-flags", label: "Feature Flags", description: "Toggle features globally or by rollout %, with per-user overrides", icon: Flag },
      { href: "/admin/communications", label: "Communications", description: "Send emails to users or post system-wide announcements", icon: Mail },
      { href: "/admin/data", label: "GDPR / Data", description: "Export user data, hard-delete accounts, bulk archive contacts", icon: Trash2 },
      { href: "/admin/health", label: "System Health", description: "Live health checks for DB, Auth, Stripe, Resend, OpenAI — auto-refreshes", icon: Server },
      { href: "/admin/support", label: "Support Tools", description: "Internal admin notes and account tags per user", icon: HeadphonesIcon },
    ],
  },
  {
    title: "Marketing Website",
    color: "text-purple-700",
    iconColor: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
    pages: [
      { href: "/", label: "Home", description: "Main marketing landing page", icon: Home, external: true },
      { href: "/features", label: "Features", description: "Full feature breakdown of LeadFlow AI", icon: Zap, external: true },
      { href: "/pricing", label: "Pricing", description: "Plans and pricing tiers", icon: DollarSign, external: true },
      { href: "/about", label: "About", description: "Company story and team", icon: Info, external: true },
      { href: "/integrations", label: "Integrations", description: "All supported integrations and channel partners", icon: Puzzle, external: true },
      { href: "/solutions", label: "Solutions", description: "Industry solutions overview", icon: Briefcase, external: true },
      { href: "/solutions/driving-instructors", label: "For Driving Instructors", description: "Tailored solution page for driving schools", icon: Briefcase, external: true },
      { href: "/solutions/marriage-celebrants", label: "For Marriage Celebrants", description: "Tailored solution page for celebrants", icon: Briefcase, external: true },
      { href: "/compare", label: "Compare", description: "LeadFlow AI vs alternatives", icon: GitCompare, external: true },
      { href: "/blog", label: "Blog", description: "Articles and product updates", icon: BookMarked, external: true },
      { href: "/case-studies", label: "Case Studies", description: "Customer success stories", icon: FileText, external: true },
      { href: "/docs", label: "Docs", description: "Product documentation", icon: BookOpen, external: true },
      { href: "/docs/getting-started", label: "Getting Started", description: "Quickstart guide for new users", icon: BookOpen, external: true },
      { href: "/api-docs", label: "API Docs", description: "API reference for developers", icon: Code2, external: true },
      { href: "/changelog", label: "Changelog", description: "What's new in each release", icon: Activity, external: true },
      { href: "/status", label: "Status", description: "Platform uptime and incident history", icon: Server, external: true },
      { href: "/careers", label: "Careers", description: "Open positions at LeadFlow AI", icon: Briefcase, external: true },
      { href: "/contact", label: "Contact", description: "Get in touch with the team", icon: Mail, external: true },
    ],
  },
  {
    title: "Legal",
    color: "text-gray-600",
    iconColor: "text-gray-500",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
    pages: [
      { href: "/privacy", label: "Privacy Policy", description: "Australian Privacy Principles (APP) compliance", icon: Scale, external: true },
      { href: "/terms", label: "Terms of Service", description: "Terms and conditions of use", icon: FileText, external: true },
      { href: "/cookies", label: "Cookie Policy", description: "Cookie usage and tracking disclosure", icon: Cookie, external: true },
      { href: "/security", label: "Security", description: "Security practices and responsible disclosure", icon: Lock, external: true },
    ],
  },
  {
    title: "Auth",
    color: "text-green-700",
    iconColor: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
    pages: [
      { href: "/login", label: "Login", description: "Sign in with email and password", icon: LogIn, external: true },
      { href: "/register", label: "Register", description: "Create a new account", icon: UserPlus, external: true },
      { href: "/forgot-password", label: "Forgot Password", description: "Request a password reset email", icon: KeyRound, external: true },
    ],
  },
  {
    title: "Public",
    color: "text-teal-700",
    iconColor: "text-teal-600",
    bgColor: "bg-teal-50",
    borderColor: "border-teal-200",
    pages: [
      { href: "/book/preview", label: "Booking Page Preview", description: "See exactly what clients see — fully interactive demo with sample services, calendar, time slots, and confirmation screen.", icon: Eye, external: true },
      { href: "/book/[slug]", label: "Public Booking Page (Live)", description: "Client-facing booking page — calendar, time slots, contact form, and confirmation. URL set in Booking Settings.", icon: CalendarDays, external: true },
    ],
  },
];

export default function AppPagesPage() {
  const totalPages = groups.reduce((sum, g) => sum + g.pages.length, 0);

  return (
    <div className="max-w-5xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-2xl font-bold">App Pages</h1>
        <p className="text-gray-500 mt-1">
          Every page in LeadFlow AI — {totalPages} pages across {groups.length} sections.
        </p>
      </div>

      <div className="space-y-8">
        {groups.map((group) => (
          <div key={group.title}>
            {/* Group header */}
            <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${group.borderColor}`}>
              <h2 className={`text-sm font-semibold uppercase tracking-wider ${group.color}`}>
                {group.title}
              </h2>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${group.bgColor} ${group.color}`}>
                {group.pages.length}
              </span>
            </div>

            {/* Page cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {group.pages.map((page) => {
                const Icon = page.icon;
                const isExternal = page.external;
                const isPlaceholder = page.href.includes("[");

                return isPlaceholder ? (
                  <div
                    key={page.href}
                    className={`flex items-start gap-3 p-4 rounded-xl border ${group.borderColor} ${group.bgColor} opacity-70`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${group.iconColor}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-gray-800">{page.label}</p>
                        <Globe className="w-3 h-3 text-gray-400" />
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{page.description}</p>
                      <code className="text-[10px] text-gray-400 font-mono mt-1 block">{page.href}</code>
                    </div>
                  </div>
                ) : (
                  <Link
                    key={page.href}
                    href={page.href as never}
                    target={isExternal ? "_blank" : undefined}
                    rel={isExternal ? "noopener noreferrer" : undefined}
                    className={`flex items-start gap-3 p-4 rounded-xl border ${group.borderColor} bg-white hover:${group.bgColor} hover:shadow-sm transition-all group`}
                  >
                    <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${group.iconColor}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-semibold text-gray-800 group-hover:text-gray-900">{page.label}</p>
                        {isExternal && <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-gray-400 shrink-0" />}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{page.description}</p>
                      <code className="text-[10px] text-gray-400 font-mono mt-1 block">{page.href}</code>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
