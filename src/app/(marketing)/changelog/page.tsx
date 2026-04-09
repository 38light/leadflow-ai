import { Sparkles, Plus, TrendingUp, Bug } from "lucide-react";

type ChangeType = "new" | "improved" | "fixed";

interface ChangeItem {
  type: ChangeType;
  text: string;
}

interface Release {
  date: string;
  version: string;
  title: string;
  changes: ChangeItem[];
}

const releases: Release[] = [
  {
    date: "April 2026",
    version: "v2.4",
    title: "AI Agent Improvements",
    changes: [
      {
        type: "new",
        text: "Concierge agent now detects 3 new intent types",
      },
      {
        type: "new",
        text: "Action agent supports Outlook Calendar booking",
      },
      {
        type: "improved",
        text: "Knowledge base RAG accuracy improved by 23%",
      },
      {
        type: "fixed",
        text: "SMS opt-out handling edge case",
      },
    ],
  },
  {
    date: "March 2026",
    version: "v2.3",
    title: "Voice Channel Launch",
    changes: [
      {
        type: "new",
        text: "Vapi voice channel integration",
      },
      {
        type: "new",
        text: "Voice transcription in conversation timeline",
      },
      {
        type: "new",
        text: "Call recording storage",
      },
      {
        type: "improved",
        text: "Dashboard mobile responsiveness",
      },
    ],
  },
  {
    date: "February 2026",
    version: "v2.2",
    title: "HubSpot Bidirectional Sync",
    changes: [
      {
        type: "new",
        text: "Real-time HubSpot contact sync",
      },
      {
        type: "new",
        text: "Deal stage updates from conversation actions",
      },
      {
        type: "new",
        text: "Entity extraction (dates, venues, names)",
      },
      {
        type: "improved",
        text: "Webhook reliability",
      },
    ],
  },
  {
    date: "January 2026",
    version: "v2.1",
    title: "Knowledge Base V2",
    changes: [
      {
        type: "new",
        text: "PDF and DOCX document support",
      },
      {
        type: "new",
        text: "Vector similarity search with Voyage AI embeddings",
      },
      {
        type: "new",
        text: "Document processing status indicators",
      },
      {
        type: "fixed",
        text: "Chunk overlap handling",
      },
    ],
  },
  {
    date: "December 2025",
    version: "v2.0",
    title: "Public Launch",
    changes: [
      {
        type: "new",
        text: "Initial public release",
      },
      {
        type: "new",
        text: "WhatsApp, Instagram, SMS, Web Chat channels",
      },
      {
        type: "new",
        text: "AI concierge, knowledge, and action agents",
      },
      {
        type: "new",
        text: "Stripe payment link generation",
      },
    ],
  },
];

const typeConfig: Record<
  ChangeType,
  { label: string; icon: typeof Plus; className: string }
> = {
  new: {
    label: "New",
    icon: Plus,
    className: "bg-green-100 text-green-700",
  },
  improved: {
    label: "Improved",
    icon: TrendingUp,
    className: "bg-blue-100 text-blue-700",
  },
  fixed: {
    label: "Fixed",
    icon: Bug,
    className: "bg-amber-100 text-amber-700",
  },
};

export default function ChangelogPage() {
  return (
    <div className="py-20">
      {/* Hero */}
      <div className="max-w-4xl mx-auto text-center px-4 mb-20">
        <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-1.5 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          What&apos;s New
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6">Changelog</h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          See what&apos;s new in LeadFlow AI. We ship improvements every week.
        </p>
      </div>

      {/* Timeline */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-0 md:left-32 top-0 bottom-0 w-px bg-gray-200" />

          <div className="space-y-12">
            {releases.map((release) => (
              <div key={release.version} className="relative">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Date column */}
                  <div className="md:w-32 shrink-0">
                    <div className="sticky top-24">
                      <span className="text-sm font-medium text-gray-500">
                        {release.date}
                      </span>
                    </div>
                  </div>

                  {/* Timeline dot */}
                  <div className="absolute left-0 md:left-32 -translate-x-1/2 w-3 h-3 rounded-full bg-blue-600 ring-4 ring-white mt-1.5 hidden md:block" />

                  {/* Content */}
                  <div className="flex-1 md:pl-8">
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-xs font-mono bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md">
                          {release.version}
                        </span>
                        <h3 className="text-lg font-semibold">
                          {release.title}
                        </h3>
                      </div>

                      <ul className="space-y-3">
                        {release.changes.map((change) => {
                          const config = typeConfig[change.type];
                          const Icon = config.icon;
                          return (
                            <li
                              key={change.text}
                              className="flex items-start gap-3"
                            >
                              <span
                                className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full shrink-0 mt-0.5 ${config.className}`}
                              >
                                <Icon className="w-3 h-3" />
                                {config.label}
                              </span>
                              <span className="text-gray-700 text-sm">
                                {change.text}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
