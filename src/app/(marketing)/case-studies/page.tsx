import Link from "next/link";
import {
  Clock,
  TrendingUp,
  DollarSign,
  Timer,
  Inbox,
  Bot,
  CalendarCheck,
  Users,
  FileText,
  RefreshCw,
  BarChart3,
  Quote,
} from "lucide-react";

interface Metric {
  icon: typeof Clock;
  label: string;
  before: string;
  after: string;
}

interface CaseStudy {
  name: string;
  role: string;
  location: string;
  industry: string;
  challenge: string;
  solution: string;
  metrics: Metric[];
  quote: string;
  color: string;
  initials: string;
}

const caseStudies: CaseStudy[] = [
  {
    name: "Sarah Mitchell",
    role: "Marriage Celebrant",
    location: "Sydney",
    industry: "Wedding Services",
    initials: "SM",
    color: "bg-pink-100 text-pink-700",
    challenge:
      "Missing 40% of Instagram DMs because she was performing ceremonies on weekends",
    solution:
      "LeadFlow AI monitors Instagram 24/7, responds in seconds, qualifies leads, and books consultations",
    metrics: [
      {
        icon: Clock,
        label: "Response time",
        before: "4 hours",
        after: "12 seconds",
      },
      {
        icon: TrendingUp,
        label: "Lead conversion",
        before: "23%",
        after: "58%",
      },
      {
        icon: DollarSign,
        label: "Revenue increase",
        before: "",
        after: "+$47,000/year",
      },
      {
        icon: Timer,
        label: "Hours saved",
        before: "",
        after: "15 hours/week",
      },
    ],
    quote:
      "LeadFlow paid for itself in the first week. I booked 3 weddings from Saturday night DMs I would have missed.",
  },
  {
    name: "James & Co Events",
    role: "Event Planning",
    location: "Melbourne",
    industry: "Events",
    initials: "JC",
    color: "bg-blue-100 text-blue-700",
    challenge:
      "Managing inquiries across 4 channels with a team of 2",
    solution:
      "Unified inbox + AI qualification freed the team to focus on high-value leads",
    metrics: [
      {
        icon: Inbox,
        label: "Channels unified",
        before: "4 separate",
        after: "1 inbox",
      },
      {
        icon: Bot,
        label: "AI-handled conversations",
        before: "0%",
        after: "78%",
      },
      {
        icon: CalendarCheck,
        label: "Booking rate",
        before: "",
        after: "2x increase",
      },
      {
        icon: Users,
        label: "Team productivity",
        before: "",
        after: "+40%",
      },
    ],
    quote:
      "The AI handles routine questions perfectly. We only step in for complex requests.",
  },
  {
    name: "Priya's Photography",
    role: "Photography Studio",
    location: "Brisbane",
    industry: "Photography",
    initials: "PP",
    color: "bg-purple-100 text-purple-700",
    challenge:
      "Losing leads to competitors who responded faster to wedding inquiries",
    solution:
      "AI responds instantly with pricing, availability, and portfolio links from knowledge base",
    metrics: [
      {
        icon: Clock,
        label: "First response",
        before: "2 days",
        after: "8 seconds",
      },
      {
        icon: FileText,
        label: "Knowledge base",
        before: "",
        after: "12 documents",
      },
      {
        icon: RefreshCw,
        label: "HubSpot sync",
        before: "Manual",
        after: "100% auto",
      },
      {
        icon: BarChart3,
        label: "Monthly bookings",
        before: "",
        after: "+65%",
      },
    ],
    quote:
      "The HubSpot sync alone saved us 5 hours a week. The AI is like having a full-time receptionist.",
  },
];

export default function CaseStudiesPage() {
  return (
    <div className="py-20">
      {/* Hero */}
      <div className="max-w-4xl mx-auto text-center px-4 mb-20">
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Customer{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Success Stories
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          See how service businesses are growing with LeadFlow AI
        </p>
      </div>

      {/* Case Studies */}
      <div className="max-w-5xl mx-auto px-4 space-y-16 mb-20">
        {caseStudies.map((study) => (
          <div
            key={study.name}
            className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl transition-shadow"
          >
            {/* Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-8 py-6">
              <div className="flex items-center gap-4">
                <div
                  className={`w-14 h-14 rounded-xl ${study.color} flex items-center justify-center text-lg font-bold`}
                >
                  {study.initials}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{study.name}</h2>
                  <p className="text-gray-600 text-sm">
                    {study.role} &mdash; {study.location} &mdash;{" "}
                    {study.industry}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* Challenge & Solution */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                <div>
                  <h3 className="text-sm font-semibold text-red-600 uppercase tracking-wide mb-2">
                    Challenge
                  </h3>
                  <p className="text-gray-700">{study.challenge}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-2">
                    Solution
                  </h3>
                  <p className="text-gray-700">{study.solution}</p>
                </div>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {study.metrics.map((metric) => {
                  const Icon = metric.icon;
                  return (
                    <div
                      key={metric.label}
                      className="bg-gray-50 rounded-xl p-4 text-center border"
                    >
                      <Icon className="w-5 h-5 text-blue-600 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-gray-900 mb-1">
                        {metric.after}
                      </div>
                      <div className="text-xs text-gray-500">
                        {metric.label}
                      </div>
                      {metric.before && (
                        <div className="text-xs text-gray-400 mt-1 line-through">
                          was {metric.before}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Quote */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6 border border-blue-100">
                <div className="flex gap-3">
                  <Quote className="w-6 h-6 text-blue-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-gray-800 italic text-lg leading-relaxed">
                      &ldquo;{study.quote}&rdquo;
                    </p>
                    <p className="text-sm text-gray-500 mt-3 font-medium">
                      &mdash; {study.name}, {study.role}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="max-w-4xl mx-auto text-center px-4">
        <h2 className="text-3xl font-bold mb-4">
          Ready to write your success story?
        </h2>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">
          Join hundreds of Australian service businesses converting more leads
          with AI. Start your free trial today.
        </p>
        <Link
          href="/register"
          className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          Start Free Trial
        </Link>
      </div>
    </div>
  );
}
