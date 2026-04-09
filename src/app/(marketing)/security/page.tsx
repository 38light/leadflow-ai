import Link from "next/link";
import type { Metadata } from "next";
import {
  Shield,
  Lock,
  Server,
  Eye,
  FileCheck,
  AlertTriangle,
  KeyRound,
  Bug,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Security — LeadFlow AI",
  description:
    "Learn about the security measures LeadFlow AI uses to protect your data. Infrastructure, encryption, access control, and compliance.",
};

const securitySections = [
  {
    icon: Server,
    title: "Infrastructure Security",
    description:
      "Your data lives on enterprise-grade infrastructure, purpose-built for security and reliability.",
    items: [
      "Hosted on Supabase (powered by AWS) in the Sydney ap-southeast-2 region, ensuring Australian data sovereignty.",
      "SOC 2 Type II compliant hosting infrastructure with continuous monitoring and audit trails.",
      "Automatic daily database backups with point-in-time recovery capabilities for disaster resilience.",
      "Network-level isolation with Virtual Private Cloud (VPC) architecture and strict firewall rules.",
      "DDoS protection and CDN-based edge caching through Vercel for the application layer.",
    ],
  },
  {
    icon: Lock,
    title: "Data Encryption",
    description:
      "All data is encrypted, whether it is stored in our databases or moving between systems.",
    items: [
      "AES-256 encryption at rest for all data stored in our PostgreSQL databases and file storage.",
      "TLS 1.3 encryption for all data in transit between your browser, our servers, and third-party APIs.",
      "API tokens and webhook secrets are encrypted before storage and never exposed in application logs.",
      "Sensitive configuration data (API keys, OAuth tokens) is stored using envelope encryption with rotating keys.",
      "Database connection strings use SSL certificates to prevent man-in-the-middle attacks.",
    ],
  },
  {
    icon: Eye,
    title: "Access Control",
    description:
      "Multi-layered access control ensures that users can only access their own data — never anyone else's.",
    items: [
      "PostgreSQL Row Level Security (RLS) is enabled on every database table, enforcing tenant isolation at the database level.",
      "Every database query is automatically filtered by the authenticated user's ID — no cross-tenant data access is possible.",
      "Role-based access control (RBAC) within the application ensures team members only see what they need.",
      "Internal access to production systems requires multi-factor authentication and is limited to authorised engineering personnel.",
      "Comprehensive audit logging tracks all data access and administrative actions.",
    ],
  },
  {
    icon: KeyRound,
    title: "Authentication",
    description:
      "Robust authentication systems protect every account on the platform.",
    items: [
      "Powered by Supabase Auth with industry-standard session management and token rotation.",
      "Passwords are hashed using bcrypt with a cost factor of 10, making brute-force attacks computationally infeasible.",
      "OAuth 2.0 support for social login providers (Google), reducing password fatigue.",
      "Automatic session expiration and refresh token rotation to limit the impact of token compromise.",
      "Account lockout after repeated failed login attempts, with email notification to the account holder.",
    ],
  },
  {
    icon: FileCheck,
    title: "API Security",
    description:
      "Every API endpoint and webhook is secured against tampering, abuse, and injection attacks.",
    items: [
      "Webhook signature verification for all inbound webhooks from Twilio, Stripe, Meta, and other providers.",
      "Rate limiting on all API endpoints to prevent abuse and ensure fair resource allocation across all tenants.",
      "Input validation using Zod schemas on every API route, rejecting malformed or unexpected data before processing.",
      "Authentication checks on every protected API route — no unauthenticated access to user data.",
      "CORS policies restrict API access to authorised origins only.",
    ],
  },
  {
    icon: Shield,
    title: "AI Security",
    description:
      "Your data is processed by AI securely, with strict boundaries around what is stored and shared.",
    items: [
      "Conversation data sent to Anthropic's Claude API is not used to train or improve AI models, under our commercial agreement.",
      "AI processing occurs in real-time — conversation content is not stored by Anthropic beyond the API request lifecycle.",
      "Voyage AI vector embeddings are generated statelessly — your knowledge base content is not retained after processing.",
      "AI responses are sandboxed per tenant — one business's data never influences another business's AI responses.",
      "Prompt injection protections and content filtering prevent misuse of AI capabilities.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "Compliance",
    description:
      "LeadFlow AI is built to meet Australian regulatory requirements from the ground up.",
    items: [
      "Full compliance with the Australian Privacy Principles (APPs 1–13) under the Privacy Act 1988 (Cth).",
      "Adherence to OAIC (Office of the Australian Information Commissioner) guidelines for data handling and breach notification.",
      "Anti-spam compliance under the Spam Act 2003 (Cth) — all messaging features enforce consent-based communication.",
      "AI transparency aligned with ACCC recommendations — AI assistants identify themselves when asked.",
      "Regular internal privacy impact assessments for new features and integrations.",
    ],
  },
];

export default function SecurityPage() {
  return (
    <div className="py-20">
      {/* Hero */}
      <div className="max-w-4xl mx-auto text-center px-4 mb-20">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 mb-6">
          <Shield className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-6">
          Security is foundational,{" "}
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            not an afterthought
          </span>
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          LeadFlow AI is built with security at every layer — from the
          infrastructure your data lives on to the AI that processes your
          conversations. Your trust is the foundation of our business.
        </p>
      </div>

      {/* Security Sections */}
      <div className="max-w-5xl mx-auto px-4 space-y-8 mb-20">
        {securitySections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className="border rounded-2xl p-8 bg-white hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-5">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    {section.title}
                  </h2>
                  <p className="text-gray-600 mb-4">{section.description}</p>
                  <ul className="space-y-2">
                    {section.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-600">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Vulnerability Reporting */}
      <div className="bg-gray-50 py-20 mb-20">
        <div className="max-w-3xl mx-auto px-4">
          <div className="flex items-start gap-5">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
              <Bug className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Vulnerability Reporting
              </h2>
              <p className="text-gray-600 mb-4">
                We take security vulnerabilities seriously and appreciate
                responsible disclosure from the security community. If you
                discover a security issue, please report it to us privately so
                we can address it before it is publicly disclosed.
              </p>
              <div className="space-y-3 text-gray-600 mb-6">
                <p>
                  <span className="font-medium text-gray-800">Report to:</span>{" "}
                  <a
                    href="mailto:security@leadflow.ai"
                    className="text-blue-600 hover:underline"
                  >
                    security@leadflow.ai
                  </a>
                </p>
                <p className="text-sm">
                  Please include a detailed description of the vulnerability,
                  steps to reproduce, and any relevant screenshots or proof of
                  concept. We will acknowledge receipt within 2 business days.
                </p>
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">
                Responsible Disclosure Policy
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-sm">
                    Do not access, modify, or delete data belonging to other
                    users.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-sm">
                    Do not publicly disclose the vulnerability until we have had
                    a reasonable opportunity to address it (we ask for 90 days).
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-sm">
                    Act in good faith — do not exploit the vulnerability beyond
                    what is necessary to demonstrate it.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
                  <span className="text-sm">
                    We will not take legal action against security researchers
                    who follow this policy in good faith.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="max-w-4xl mx-auto text-center px-4">
        <h2 className="text-3xl font-bold mb-4">
          Questions about security?
        </h2>
        <p className="text-gray-600 mb-8 max-w-xl mx-auto">
          We are happy to answer your security questions, provide additional
          documentation, or discuss compliance requirements for your
          organisation.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/contact"
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl text-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Contact Us
          </Link>
          <Link
            href="/privacy"
            className="inline-flex items-center px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-xl text-lg font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all"
          >
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}
