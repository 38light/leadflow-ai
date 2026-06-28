import type { Metadata } from "next";
import Link from "next/link";
import {
  Key,
  ArrowRight,
  Copy,
  Users,
  MessageSquare,
  Mail,
  Radio,
  BookOpen,
  BarChart3,
  Bell,
  Code2,
  Zap,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";

export const metadata: Metadata = {
  title: "API Reference — LeadFlow AI",
  description:
    "Build custom integrations with the LeadFlow API. REST endpoints for contacts, conversations, messages, channels, knowledge bases, and analytics.",
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface Endpoint {
  method: HttpMethod;
  path: string;
  description: string;
}

interface EndpointGroup {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  endpoints: Endpoint[];
}

const methodColors: Record<HttpMethod, string> = {
  GET: "bg-green-100 text-green-700 border-green-200",
  POST: "bg-blue-100 text-blue-700 border-blue-200",
  PUT: "bg-amber-100 text-amber-700 border-amber-200",
  DELETE: "bg-red-100 text-red-700 border-red-200",
};

const endpointGroups: EndpointGroup[] = [
  {
    title: "Contacts",
    icon: Users,
    endpoints: [
      { method: "GET", path: "/contacts", description: "List all contacts with pagination and filtering" },
      { method: "POST", path: "/contacts", description: "Create a new contact" },
      { method: "GET", path: "/contacts/:id", description: "Retrieve a single contact by ID" },
      { method: "PUT", path: "/contacts/:id", description: "Update an existing contact" },
      { method: "DELETE", path: "/contacts/:id", description: "Delete a contact (soft delete)" },
    ],
  },
  {
    title: "Conversations",
    icon: MessageSquare,
    endpoints: [
      { method: "GET", path: "/conversations", description: "List all conversations with filters" },
      { method: "POST", path: "/conversations", description: "Start a new conversation with a contact" },
      { method: "GET", path: "/conversations/:id", description: "Retrieve a single conversation" },
      { method: "PUT", path: "/conversations/:id", description: "Update conversation status or assignment" },
    ],
  },
  {
    title: "Messages",
    icon: Mail,
    endpoints: [
      { method: "GET", path: "/conversations/:id/messages", description: "List messages in a conversation" },
      { method: "POST", path: "/conversations/:id/messages", description: "Send a message in a conversation" },
    ],
  },
  {
    title: "Channels",
    icon: Radio,
    endpoints: [
      { method: "GET", path: "/channels", description: "List all connected channels" },
      { method: "POST", path: "/channels", description: "Connect a new channel" },
      { method: "PUT", path: "/channels/:id", description: "Update channel configuration" },
    ],
  },
  {
    title: "Knowledge Bases",
    icon: BookOpen,
    endpoints: [
      { method: "GET", path: "/knowledge-bases", description: "List all knowledge bases" },
      { method: "POST", path: "/knowledge-bases", description: "Create a new knowledge base" },
      { method: "POST", path: "/knowledge-bases/:id/documents", description: "Upload a document to a knowledge base" },
    ],
  },
  {
    title: "Analytics",
    icon: BarChart3,
    endpoints: [
      { method: "GET", path: "/analytics", description: "Retrieve analytics data for a date range" },
    ],
  },
];

const sidebarNav = [
  { label: "Authentication", href: "#authentication" },
  { label: "Base URL", href: "#base-url" },
  { label: "Contacts", href: "#contacts" },
  { label: "Conversations", href: "#conversations" },
  { label: "Messages", href: "#messages" },
  { label: "Channels", href: "#channels" },
  { label: "Knowledge Bases", href: "#knowledge-bases" },
  { label: "Analytics", href: "#analytics" },
  { label: "Rate Limits", href: "#rate-limits" },
  { label: "Webhooks", href: "#webhooks" },
  { label: "Zapier", href: "#zapier" },
  { label: "SDKs", href: "#sdks" },
];

const webhookEvents = [
  { event: "conversation.created", description: "A new conversation is started" },
  { event: "conversation.updated", description: "A conversation status changes" },
  { event: "message.received", description: "A new inbound message is received" },
  { event: "message.sent", description: "An outbound message is sent (AI or human)" },
  { event: "contact.created", description: "A new contact is captured" },
  { event: "contact.updated", description: "A contact record is updated" },
  { event: "payment.completed", description: "A Stripe payment link is paid" },
  { event: "booking.created", description: "A calendar booking is confirmed" },
];

/* ------------------------------------------------------------------ */
/*  Helper Components                                                  */
/* ------------------------------------------------------------------ */

function MethodBadge({ method }: { method: HttpMethod }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-md border px-2.5 py-0.5 text-xs font-bold font-mono uppercase tracking-wide ${methodColors[method]}`}
    >
      {method}
    </span>
  );
}

function CodeBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
      <div className="flex items-center justify-between border-b border-gray-800 px-4 py-2">
        <span className="text-xs font-mono text-gray-400">{title}</span>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
        >
          <Copy className="h-3.5 w-3.5" />
          Copy
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
        <code className="text-gray-300">{children}</code>
      </pre>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function ApiDocsPage() {
  return (
    <div className="relative">
      {/* ---- Hero ---- */}
      <section className="relative border-b border-gray-200 bg-gradient-to-b from-gray-50 to-white pt-24 pb-14 px-6 text-center">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-1.5 text-sm font-medium text-gray-600">
            <Code2 className="h-4 w-4" />
            REST API v1
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-gray-900">
            API Reference
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-2xl mx-auto">
            Build custom integrations with the LeadFlow API. Manage contacts,
            conversations, messages, channels, and analytics programmatically.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl">
        <div className="lg:grid lg:grid-cols-[240px_1fr]">
          {/* ---- Sidebar Navigation ---- */}
          <aside className="hidden lg:block border-r border-gray-200 bg-gray-50/50">
            <nav className="sticky top-24 p-6 space-y-1">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                API Reference
              </h4>
              {sidebarNav.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="block rounded-md px-3 py-1.5 text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                >
                  {item.label}
                </a>
              ))}

              <div className="border-t border-gray-200 pt-4 mt-4">
                <Link
                  href="/docs"
                  className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Documentation
                </Link>
              </div>
            </nav>
          </aside>

          {/* ---- Main Content ---- */}
          <main className="px-6 py-12 lg:px-12">
            <div className="max-w-4xl">
              {/* ---- Authentication ---- */}
              <section
                id="authentication"
                className="mb-16 scroll-mt-24"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
                    <Key className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Authentication
                  </h2>
                </div>

                <p className="text-gray-600 leading-relaxed mb-4">
                  All API requests require a Bearer token in the{" "}
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono text-gray-800">
                    Authorization
                  </code>{" "}
                  header. You can generate an API key from your dashboard under{" "}
                  <strong>Settings &rarr; API Keys</strong>.
                </p>

                <CodeBlock title="Request Header">
                  {`Authorization: Bearer sk_live_your_api_key_here
Content-Type: application/json`}
                </CodeBlock>

                <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                  <div className="flex gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>
                      <strong>Keep your API key secret.</strong> Never expose
                      it in client-side code, public repositories, or browser
                      requests. Use environment variables on your server.
                    </span>
                  </div>
                </div>
              </section>

              {/* ---- Base URL ---- */}
              <section id="base-url" className="mb-16 scroll-mt-24">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Base URL
                </h2>
                <p className="text-gray-600 leading-relaxed mb-4">
                  All API endpoints are relative to the following base URL:
                </p>
                <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-950 px-5 py-3.5">
                  <code className="text-sm font-mono text-green-400 flex-1">
                    https://api.leadflow.ai/v1
                  </code>
                  <button
                    type="button"
                    className="text-gray-500 hover:text-white transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </section>

              {/* ---- Endpoint Groups ---- */}
              {endpointGroups.map((group) => {
                const Icon = group.icon;
                const anchorId = group.title.toLowerCase().replace(/\s+/g, "-");
                return (
                  <section
                    key={group.title}
                    id={anchorId}
                    className="mb-16 scroll-mt-24"
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                        <Icon className="h-5 w-5" />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {group.title}
                      </h2>
                    </div>

                    <div className="space-y-4">
                      {group.endpoints.map((ep, i) => (
                        <div
                          key={`${ep.method}-${ep.path}`}
                          className="rounded-xl border border-gray-200 bg-white overflow-hidden transition hover:shadow-sm"
                        >
                          <div className="flex items-center gap-4 px-5 py-4">
                            <MethodBadge method={ep.method} />
                            <code className="text-sm font-mono text-gray-800 flex-1">
                              {ep.path}
                            </code>
                          </div>
                          <div className="border-t border-gray-100 px-5 py-3">
                            <p className="text-sm text-gray-500">
                              {ep.description}
                            </p>
                          </div>

                          {/* Show example for first endpoint in each group */}
                          {i === 0 && (
                            <div className="border-t border-gray-100 p-5 bg-gray-50/50">
                              <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                    Example Request
                                  </p>
                                  <CodeBlock title="cURL">
                                    {ep.method === "GET"
                                      ? `curl -X GET \\
  https://api.leadflow.ai/v1${ep.path} \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json"`
                                      : `curl -X ${ep.method} \\
  https://api.leadflow.ai/v1${ep.path} \\
  -H "Authorization: Bearer sk_live_..." \\
  -H "Content-Type: application/json" \\
  -d '${
                                          group.title === "Contacts"
                                            ? '{"name":"Jane Smith","email":"jane@example.com","phone":"+61400000000","channel":"whatsapp"}'
                                            : group.title === "Conversations"
                                              ? '{"contact_id":"ct_abc123","channel":"web_chat","initial_message":"Hi, I need a quote"}'
                                              : group.title === "Messages"
                                                ? '{"content":"Thanks for reaching out! How can I help?","sender":"ai"}'
                                                : group.title === "Channels"
                                                  ? '{"type":"web_chat","config":{"theme":"auto","position":"bottom-right"}}'
                                                  : group.title === "Knowledge Bases"
                                                    ? '{"name":"Pricing & FAQs","description":"Core business documents"}'
                                                    : "{}"
                                        }'`}
                                  </CodeBlock>
                                </div>
                                <div>
                                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                                    Example Response
                                  </p>
                                  <CodeBlock title="JSON">
                                    {group.title === "Contacts"
                                      ? `{
  "data": [
    {
      "id": "ct_abc123",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+61400000000",
      "channel": "whatsapp",
      "temperature": "hot",
      "created_at": "2026-03-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 142,
    "page": 1,
    "per_page": 25
  }
}`
                                      : group.title === "Conversations"
                                        ? `{
  "data": [
    {
      "id": "conv_xyz789",
      "contact_id": "ct_abc123",
      "channel": "whatsapp",
      "status": "active",
      "ai_mode": true,
      "last_message_at": "2026-03-15T10:32:00Z"
    }
  ],
  "meta": { "total": 38, "page": 1 }
}`
                                        : group.title === "Messages"
                                          ? `{
  "data": [
    {
      "id": "msg_001",
      "conversation_id": "conv_xyz789",
      "content": "Hi! Are you available Oct 12?",
      "sender": "lead",
      "created_at": "2026-03-15T10:30:00Z"
    },
    {
      "id": "msg_002",
      "conversation_id": "conv_xyz789",
      "content": "Hi! Let me check... Yes, Oct 12 is available!",
      "sender": "ai",
      "created_at": "2026-03-15T10:30:12Z"
    }
  ]
}`
                                          : group.title === "Channels"
                                            ? `{
  "data": [
    {
      "id": "ch_web01",
      "type": "web_chat",
      "status": "active",
      "config": {
        "theme": "auto",
        "position": "bottom-right"
      }
    }
  ]
}`
                                            : group.title === "Knowledge Bases"
                                              ? `{
  "data": [
    {
      "id": "kb_001",
      "name": "Pricing & FAQs",
      "document_count": 5,
      "status": "indexed",
      "updated_at": "2026-03-14T08:00:00Z"
    }
  ]
}`
                                              : `{
  "data": {
    "period": "2026-03-01/2026-03-15",
    "total_conversations": 284,
    "total_messages": 1420,
    "avg_response_time_ms": 11800,
    "conversion_rate": 0.34,
    "channels": {
      "whatsapp": 112,
      "web_chat": 98,
      "instagram": 52,
      "sms": 22
    }
  }
}`}
                                  </CodeBlock>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                );
              })}

              {/* ---- Rate Limits ---- */}
              <section id="rate-limits" className="mb-16 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Rate Limits
                  </h2>
                </div>

                <p className="text-gray-600 leading-relaxed mb-6">
                  API rate limits are enforced per API key on a per-minute
                  sliding window. Rate limit headers are included in every
                  response.
                </p>

                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-3.5 px-5 text-sm font-semibold text-gray-500">
                          Plan
                        </th>
                        <th className="py-3.5 px-5 text-sm font-semibold text-gray-500">
                          Requests / Minute
                        </th>
                        <th className="py-3.5 px-5 text-sm font-semibold text-gray-500">
                          Daily Limit
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-gray-100">
                        <td className="py-3 px-5 text-sm font-medium text-gray-900">
                          Free
                        </td>
                        <td className="py-3 px-5 text-sm text-gray-600">
                          10 req/min
                        </td>
                        <td className="py-3 px-5 text-sm text-gray-600">
                          500 req/day
                        </td>
                      </tr>
                      <tr className="border-t border-gray-100 bg-gray-50/50">
                        <td className="py-3 px-5 text-sm font-medium text-gray-900">
                          Starter
                        </td>
                        <td className="py-3 px-5 text-sm text-gray-600">
                          100 req/min
                        </td>
                        <td className="py-3 px-5 text-sm text-gray-600">
                          10,000 req/day
                        </td>
                      </tr>
                      <tr className="border-t border-gray-100">
                        <td className="py-3 px-5 text-sm font-medium text-gray-900">
                          Pro
                        </td>
                        <td className="py-3 px-5 text-sm text-gray-600">
                          1,000 req/min
                        </td>
                        <td className="py-3 px-5 text-sm text-gray-600">
                          100,000 req/day
                        </td>
                      </tr>
                      <tr className="border-t border-gray-100 bg-gray-50/50">
                        <td className="py-3 px-5 text-sm font-medium text-gray-900">
                          Enterprise
                        </td>
                        <td className="py-3 px-5 text-sm text-gray-600">
                          Custom
                        </td>
                        <td className="py-3 px-5 text-sm text-gray-600">
                          Custom
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="mt-4">
                  <CodeBlock title="Rate Limit Response Headers">
                    {`X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 994
X-RateLimit-Reset: 1711094460`}
                  </CodeBlock>
                </div>

                <p className="mt-4 text-sm text-gray-500">
                  When rate limited, the API returns a{" "}
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-700">
                    429 Too Many Requests
                  </code>{" "}
                  response. Implement exponential backoff in your integration.
                </p>
              </section>

              {/* ---- Webhooks ---- */}
              <section id="webhooks" className="mb-16 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                    <Bell className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Webhooks
                  </h2>
                </div>

                <p className="text-gray-600 leading-relaxed mb-4">
                  Webhooks allow you to receive real-time notifications when
                  events occur in your LeadFlow account. Configure webhook
                  endpoints in{" "}
                  <strong>Settings &rarr; API &rarr; Webhooks</strong>.
                </p>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Available Events
                </h3>

                <div className="overflow-hidden rounded-xl border border-gray-200 mb-6">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-3 px-5 text-sm font-semibold text-gray-500">
                          Event
                        </th>
                        <th className="py-3 px-5 text-sm font-semibold text-gray-500">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {webhookEvents.map((wh, i) => (
                        <tr
                          key={wh.event}
                          className={`border-t border-gray-100 ${
                            i % 2 === 1 ? "bg-gray-50/50" : ""
                          }`}
                        >
                          <td className="py-3 px-5 text-sm font-mono text-blue-600">
                            {wh.event}
                          </td>
                          <td className="py-3 px-5 text-sm text-gray-600">
                            {wh.description}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Payload Format
                </h3>

                <CodeBlock title="Webhook Payload (JSON)">
                  {`{
  "id": "evt_abc123",
  "type": "message.received",
  "created_at": "2026-03-15T10:30:00Z",
  "data": {
    "conversation_id": "conv_xyz789",
    "contact_id": "ct_abc123",
    "message": {
      "id": "msg_001",
      "content": "Hi! Are you available Oct 12?",
      "sender": "lead",
      "channel": "whatsapp"
    }
  }
}`}
                </CodeBlock>

                <p className="mt-4 text-sm text-gray-500">
                  All webhook payloads are signed with your webhook secret
                  using HMAC-SHA256. Verify the{" "}
                  <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-gray-700">
                    X-LeadFlow-Signature
                  </code>{" "}
                  header to ensure authenticity.
                </p>
              </section>

              {/* ---- Zapier ---- */}
              <section id="zapier" className="mb-16 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
                    <Zap className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Connect via Zapier
                  </h2>
                </div>

                <p className="text-gray-600 leading-relaxed mb-4">
                  Wire LeadFlow into 6,000+ apps without writing any code.
                  Zapier can listen for our outbound webhooks as triggers and
                  use your API keys to perform actions in your account.
                </p>

                <div className="grid gap-4 md:grid-cols-2 mb-6">
                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Triggers (webhooks)
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Use the Zapier &ldquo;Webhooks by Zapier&rdquo; app with a{" "}
                      <em>Catch Hook</em> trigger. Paste the Zap&rsquo;s URL
                      into LeadFlow&rsquo;s webhook endpoints.
                    </p>
                    <Link
                      href="/settings/webhooks"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Manage webhook endpoints
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-white p-5">
                    <h3 className="text-base font-semibold text-gray-900 mb-1">
                      Actions (API keys)
                    </h3>
                    <p className="text-sm text-gray-500 mb-3">
                      Generate an API key and use Zapier&rsquo;s{" "}
                      <em>Custom Request</em> action with{" "}
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
                        Authorization: Bearer
                      </code>{" "}
                      to create contacts, send messages, and more.
                    </p>
                    <Link
                      href="/settings/api-keys"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                      Manage API keys
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Available trigger events
                </h3>
                <div className="overflow-hidden rounded-xl border border-gray-200 mb-6">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-3 px-5 text-sm font-semibold text-gray-500">
                          Event
                        </th>
                        <th className="py-3 px-5 text-sm font-semibold text-gray-500">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-gray-100">
                        <td className="py-3 px-5 text-sm font-mono text-blue-600">
                          contact.created
                        </td>
                        <td className="py-3 px-5 text-sm text-gray-600">
                          Fires when a new lead is captured
                        </td>
                      </tr>
                      <tr className="border-t border-gray-100 bg-gray-50/50">
                        <td className="py-3 px-5 text-sm font-mono text-blue-600">
                          booking.completed
                        </td>
                        <td className="py-3 px-5 text-sm text-gray-600">
                          Fires after a booking is marked completed
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Example Zaps
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                    <p className="text-sm font-semibold text-gray-900">
                      New hot lead &rarr; Slack
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Trigger:{" "}
                      <code className="font-mono text-xs">contact.created</code>{" "}
                      &middot; Action: post a message to a Slack channel.
                    </p>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
                    <p className="text-sm font-semibold text-gray-900">
                      Booking completed &rarr; Google Sheets
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Trigger:{" "}
                      <code className="font-mono text-xs">booking.completed</code>{" "}
                      &middot; Action: append a row to a Google Sheet.
                    </p>
                  </div>
                </div>
              </section>

              {/* ---- SDKs ---- */}
              <section id="sdks" className="mb-16 scroll-mt-24">
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600">
                    <Code2 className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">SDKs</h2>
                </div>

                <p className="text-gray-600 leading-relaxed mb-6">
                  Official client libraries to make integrating with the
                  LeadFlow API even easier. SDKs handle authentication, request
                  signing, pagination, and error handling for you.
                </p>

                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      name: "Node.js",
                      pkg: "@leadflow/node",
                      color:
                        "bg-green-50 border-green-200 text-green-700",
                    },
                    {
                      name: "Python",
                      pkg: "leadflow-python",
                      color:
                        "bg-blue-50 border-blue-200 text-blue-700",
                    },
                    {
                      name: "Ruby",
                      pkg: "leadflow-ruby",
                      color: "bg-red-50 border-red-200 text-red-700",
                    },
                  ].map((sdk) => (
                    <div
                      key={sdk.name}
                      className={`rounded-xl border p-5 text-center ${sdk.color}`}
                    >
                      <p className="text-lg font-bold">{sdk.name}</p>
                      <p className="mt-1 text-sm font-mono opacity-70">
                        {sdk.pkg}
                      </p>
                      <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/80 px-3 py-1 text-xs font-medium">
                        Coming Soon
                      </span>
                    </div>
                  ))}
                </div>
              </section>

              {/* ---- Support CTA ---- */}
              <section className="rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-center">
                <h2 className="text-2xl font-bold text-white">
                  Need help with the API?
                </h2>
                <p className="mt-2 text-gray-400 max-w-md mx-auto">
                  Our engineering team is here to help you build your
                  integration. Reach out anytime.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-100"
                  >
                    Contact Support
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/docs"
                    className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Documentation
                  </Link>
                </div>
              </section>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
