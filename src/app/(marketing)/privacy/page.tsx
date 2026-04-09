import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — LeadFlow AI",
  description:
    "Learn how LeadFlow AI collects, uses, and protects your personal information. Australian Privacy Principles compliant.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="py-20">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-gray-500">
            Last updated: April 2026
          </p>
          <p className="text-gray-500">
            Effective date: April 2026
          </p>
        </div>

        {/* Body */}
        <div className="space-y-10 text-gray-600 leading-relaxed">
          {/* 1. Introduction & Scope */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Introduction &amp; Scope
            </h2>
            <p className="mb-3">
              LeadFlow AI Pty Ltd (ABN to be assigned) (&quot;LeadFlow AI&quot;,
              &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is an Australian
              company headquartered in Sydney, New South Wales, Australia. We are
              committed to protecting the privacy of all individuals whose personal
              information we handle.
            </p>
            <p className="mb-3">
              This Privacy Policy explains how we collect, use, disclose, and
              safeguard your information when you visit our website at{" "}
              <span className="font-medium text-gray-900">leadflow.ai</span>,
              use our platform, interact with our AI assistants, or engage with us
              in any other way.
            </p>
            <p className="mb-3">
              This policy applies to all users of the LeadFlow AI platform,
              including business owners who subscribe to our services
              (&quot;Subscribers&quot;), their team members, and the leads and
              customers (&quot;End Users&quot;) who interact with AI assistants
              powered by LeadFlow AI.
            </p>
            <p>
              By using our services, you acknowledge that you have read and
              understood this Privacy Policy. If you do not agree, please
              discontinue use of our services.
            </p>
          </section>

          {/* 2. Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Information We Collect
            </h2>
            <p className="mb-4">
              We collect different types of information depending on how you
              interact with our platform:
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              2.1 Personal Information You Provide
            </h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                <span className="font-medium text-gray-800">Account Information:</span>{" "}
                Name, email address, phone number, business name, and business
                address when you register for an account.
              </li>
              <li>
                <span className="font-medium text-gray-800">Billing Information:</span>{" "}
                Payment card details and billing address, processed securely through
                Stripe. We do not store full card numbers on our servers.
              </li>
              <li>
                <span className="font-medium text-gray-800">Profile Information:</span>{" "}
                Business description, operating hours, service areas, pricing
                information, and staff details you provide to configure your AI
                assistant.
              </li>
              <li>
                <span className="font-medium text-gray-800">Communication Content:</span>{" "}
                Messages, files, images, and other content exchanged between you,
                your leads, and our AI assistants across all connected channels.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              2.2 Business Data
            </h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                Lead and customer contact details (name, phone, email) submitted
                through your connected channels.
              </li>
              <li>
                Conversation histories between your AI assistant and leads.
              </li>
              <li>
                Appointment and booking information.
              </li>
              <li>
                Invoice and payment records generated through the platform.
              </li>
              <li>
                Knowledge base documents and FAQs you upload to train your AI
                assistant.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              2.3 Usage Data
            </h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                IP address, browser type, operating system, and device information.
              </li>
              <li>Pages visited, features used, and time spent on the platform.</li>
              <li>
                Referral URLs, click patterns, and navigation paths.
              </li>
              <li>Error logs and performance data.</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              2.4 Cookies &amp; Tracking Technologies
            </h3>
            <p className="mb-4">
              We use cookies and similar technologies for authentication, security,
              and analytics purposes. For full details, see our{" "}
              <Link href="/cookies" className="text-blue-600 hover:underline">
                Cookie Policy
              </Link>
              .
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              2.5 Data from Third-Party Services
            </h3>
            <p className="mb-2">
              When you connect third-party services to LeadFlow AI, we may receive
              information from those services:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-medium text-gray-800">HubSpot:</span> Contact
                records, deal stages, and CRM data you choose to sync.
              </li>
              <li>
                <span className="font-medium text-gray-800">Stripe:</span> Subscription
                status, payment confirmation, and billing events.
              </li>
              <li>
                <span className="font-medium text-gray-800">Twilio:</span> Inbound
                messages, call logs, and delivery status from WhatsApp, SMS, and
                voice channels.
              </li>
              <li>
                <span className="font-medium text-gray-800">Meta (Instagram/Facebook):</span>{" "}
                Direct messages, comments, and user profile information from
                connected social accounts.
              </li>
            </ul>
          </section>

          {/* 3. How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="mb-4">
              We use the information we collect for the following purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-medium text-gray-800">Providing Services:</span>{" "}
                To operate and maintain your account, process messages, manage leads,
                schedule appointments, and generate invoices.
              </li>
              <li>
                <span className="font-medium text-gray-800">AI Processing:</span>{" "}
                To power our AI assistants, including generating contextual responses,
                qualifying leads, and providing intelligent recommendations based on
                your business data and conversation history.
              </li>
              <li>
                <span className="font-medium text-gray-800">Analytics &amp; Improvement:</span>{" "}
                To understand how our platform is used, identify trends, and improve
                our features, AI accuracy, and user experience.
              </li>
              <li>
                <span className="font-medium text-gray-800">Communication:</span>{" "}
                To send you account notifications, billing alerts, security updates,
                feature announcements, and customer support responses.
              </li>
              <li>
                <span className="font-medium text-gray-800">Security &amp; Fraud Prevention:</span>{" "}
                To detect and prevent fraud, abuse, and security threats to our
                platform.
              </li>
              <li>
                <span className="font-medium text-gray-800">Legal Compliance:</span>{" "}
                To comply with applicable Australian laws, regulations, and legal
                processes, including the Privacy Act 1988 (Cth) and the Australian
                Privacy Principles.
              </li>
            </ul>
          </section>

          {/* 4. AI and Automated Decision Making */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. AI and Automated Decision Making
            </h2>
            <p className="mb-3">
              LeadFlow AI uses artificial intelligence (powered by Anthropic&apos;s
              Claude) to automate lead engagement on behalf of our Subscribers. It
              is important that you understand how AI is used within our platform:
            </p>
            <ul className="list-disc pl-6 space-y-3 mb-4">
              <li>
                <span className="font-medium text-gray-800">AI-Powered Conversations:</span>{" "}
                When an End User sends a message to a business using LeadFlow AI,
                an AI assistant may respond on behalf of the business. The AI uses
                the business&apos;s knowledge base, service information, and
                conversation context to generate helpful responses.
              </li>
              <li>
                <span className="font-medium text-gray-800">AI Transparency:</span>{" "}
                Our AI assistants are designed to identify themselves as AI when
                asked. We require Subscribers to comply with applicable AI
                transparency guidelines, including ACCC recommendations.
              </li>
              <li>
                <span className="font-medium text-gray-800">Lead Qualification:</span>{" "}
                The AI analyses conversations to automatically score and qualify
                leads based on criteria set by the Subscriber. This automated
                assessment helps prioritise leads but does not make final business
                decisions.
              </li>
              <li>
                <span className="font-medium text-gray-800">Data Used for AI Responses:</span>{" "}
                AI responses are generated using the Subscriber&apos;s uploaded
                knowledge base, business profile, conversation history, and the
                current message context. We do not use one Subscriber&apos;s data to
                train or inform AI responses for another Subscriber.
              </li>
              <li>
                <span className="font-medium text-gray-800">Human-in-the-Loop:</span>{" "}
                Subscribers can review all AI conversations, intervene at any time,
                and configure when the AI should escalate to a human operator.
              </li>
            </ul>
          </section>

          {/* 5. Data Sharing & Third Parties */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Data Sharing &amp; Third Parties
            </h2>
            <p className="mb-4">
              We share your data only with trusted third-party service providers
              who are essential to operating our platform. We do not sell your
              personal information to anyone.
            </p>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-1">
                  Anthropic (Claude AI)
                </h3>
                <p className="text-sm">
                  Conversation messages and business context are sent to
                  Anthropic&apos;s Claude API to generate AI responses. Anthropic
                  does not use this data to train its models under our commercial
                  agreement. Data is processed in real-time and not stored by
                  Anthropic beyond the API request lifecycle.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-1">
                  Stripe
                </h3>
                <p className="text-sm">
                  Billing information, subscription details, and payment events are
                  processed through Stripe. Stripe is PCI DSS Level 1 certified.
                  We share your name, email, and billing address with Stripe to
                  process payments.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-1">
                  Twilio
                </h3>
                <p className="text-sm">
                  Message content, phone numbers, and delivery metadata are
                  processed through Twilio to enable WhatsApp, SMS, and Voice
                  channels. Twilio stores message logs in accordance with their
                  data retention policies.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-1">
                  Supabase
                </h3>
                <p className="text-sm">
                  All application data is stored on Supabase infrastructure, hosted
                  on AWS in the Sydney (ap-southeast-2) region. Supabase provides
                  our database, authentication, and file storage services.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-1">
                  Resend
                </h3>
                <p className="text-sm">
                  Email addresses and email content are shared with Resend to
                  deliver transactional emails such as account notifications,
                  billing receipts, and security alerts.
                </p>
              </div>
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-1">
                  Voyage AI
                </h3>
                <p className="text-sm">
                  Knowledge base content is sent to Voyage AI to generate vector
                  embeddings for semantic search. This processing is stateless —
                  Voyage AI does not store your content after generating embeddings.
                </p>
              </div>
            </div>
          </section>

          {/* 6. Data Storage & Security */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Data Storage &amp; Security
            </h2>
            <p className="mb-3">
              We take the security and sovereignty of your data seriously:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-medium text-gray-800">Australian Data Sovereignty:</span>{" "}
                Your primary data is stored on Supabase infrastructure hosted in
                the AWS Sydney (ap-southeast-2) region, ensuring your data remains
                within Australia.
              </li>
              <li>
                <span className="font-medium text-gray-800">Encryption at Rest:</span>{" "}
                All data stored in our databases is encrypted at rest using AES-256
                encryption.
              </li>
              <li>
                <span className="font-medium text-gray-800">Encryption in Transit:</span>{" "}
                All data transmitted between your browser, our servers, and
                third-party APIs is encrypted using TLS 1.2 or higher.
              </li>
              <li>
                <span className="font-medium text-gray-800">Row Level Security (RLS):</span>{" "}
                Our database implements PostgreSQL Row Level Security on every table,
                ensuring that each user can only access their own data. There is no
                possibility of cross-tenant data access at the database level.
              </li>
              <li>
                <span className="font-medium text-gray-800">Access Controls:</span>{" "}
                Internal access to production systems is restricted to authorised
                personnel using role-based access controls and multi-factor
                authentication.
              </li>
              <li>
                <span className="font-medium text-gray-800">Backups:</span>{" "}
                Automated daily backups are maintained with point-in-time recovery
                capabilities.
              </li>
            </ul>
          </section>

          {/* 7. Australian Privacy Principles Compliance */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Australian Privacy Principles Compliance
            </h2>
            <p className="mb-4">
              LeadFlow AI is committed to compliance with the Australian Privacy
              Principles (APPs) contained in the Privacy Act 1988 (Cth):
            </p>
            <div className="space-y-3">
              <div>
                <p className="font-medium text-gray-800">
                  APP 1 — Open and Transparent Management
                </p>
                <p className="text-sm">
                  This Privacy Policy, along with our publicly available collection
                  notices, ensures transparent management of your personal
                  information.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  APP 2 — Anonymity and Pseudonymity
                </p>
                <p className="text-sm">
                  Where practicable, individuals may interact with us without
                  identifying themselves. However, account registration requires
                  identification to provide our services.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  APP 3 — Collection of Solicited Personal Information
                </p>
                <p className="text-sm">
                  We only collect personal information that is reasonably necessary
                  for our functions and activities, and only by lawful and fair means.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  APP 4 — Dealing with Unsolicited Personal Information
                </p>
                <p className="text-sm">
                  If we receive unsolicited personal information, we assess whether
                  we could have collected it under APP 3. If not, we destroy or
                  de-identify it as soon as practicable.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  APP 5 — Notification of Collection
                </p>
                <p className="text-sm">
                  We notify individuals at or before the time of collection about
                  the purposes of collection, as outlined in this policy.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  APP 6 — Use or Disclosure
                </p>
                <p className="text-sm">
                  Personal information is only used or disclosed for the primary
                  purpose for which it was collected, or for a related secondary
                  purpose that would be reasonably expected.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  APP 7 — Direct Marketing
                </p>
                <p className="text-sm">
                  We do not use personal information for direct marketing without
                  consent. All marketing communications include an unsubscribe
                  mechanism.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  APP 8 — Cross-Border Disclosure
                </p>
                <p className="text-sm">
                  When personal information is disclosed to overseas recipients
                  (such as AI processing providers), we take reasonable steps to
                  ensure compliance with the APPs. See Section 11 for details.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  APP 9 — Adoption, Use, or Disclosure of Government Identifiers
                </p>
                <p className="text-sm">
                  We do not adopt, use, or disclose government-related identifiers
                  unless required by law.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  APP 10 — Quality of Personal Information
                </p>
                <p className="text-sm">
                  We take reasonable steps to ensure that personal information we
                  collect, use, and disclose is accurate, up-to-date, complete,
                  and relevant.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  APP 11 — Security of Personal Information
                </p>
                <p className="text-sm">
                  We take reasonable steps to protect personal information from
                  misuse, interference, loss, and unauthorised access. See Section 6
                  for our security measures.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  APP 12 — Access to Personal Information
                </p>
                <p className="text-sm">
                  Individuals have the right to request access to their personal
                  information held by us. See Section 8 for how to exercise this
                  right.
                </p>
              </div>
              <div>
                <p className="font-medium text-gray-800">
                  APP 13 — Correction of Personal Information
                </p>
                <p className="text-sm">
                  We take reasonable steps to correct personal information to ensure
                  it is accurate, up-to-date, complete, relevant, and not misleading.
                  You may request corrections at any time.
                </p>
              </div>
            </div>
          </section>

          {/* 8. Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. Your Rights
            </h2>
            <p className="mb-4">
              Under the Privacy Act 1988 and the Australian Privacy Principles,
              you have the following rights:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                <span className="font-medium text-gray-800">Right of Access:</span>{" "}
                You may request access to the personal information we hold about
                you. We will respond to access requests within 30 days.
              </li>
              <li>
                <span className="font-medium text-gray-800">Right of Correction:</span>{" "}
                You may request that we correct any inaccurate or incomplete
                personal information. You can also update most information directly
                through your account settings.
              </li>
              <li>
                <span className="font-medium text-gray-800">Right of Deletion:</span>{" "}
                You may request deletion of your personal information. We will
                comply unless we are required to retain the information by law or
                for legitimate business purposes.
              </li>
              <li>
                <span className="font-medium text-gray-800">Right to Complain:</span>{" "}
                If you believe we have breached the APPs, you may lodge a complaint
                with us first (see Section 13). If you are not satisfied with our
                response, you may escalate your complaint to the Office of the
                Australian Information Commissioner (OAIC) at{" "}
                <a
                  href="https://www.oaic.gov.au"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  www.oaic.gov.au
                </a>
                .
              </li>
            </ul>
            <p>
              To exercise any of these rights, please contact us at{" "}
              <a
                href="mailto:privacy@leadflow.ai"
                className="text-blue-600 hover:underline"
              >
                privacy@leadflow.ai
              </a>
              .
            </p>
          </section>

          {/* 9. Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Data Retention
            </h2>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                <span className="font-medium text-gray-800">Active Accounts:</span>{" "}
                We retain your personal information and business data for as long as
                your account is active and as needed to provide our services.
              </li>
              <li>
                <span className="font-medium text-gray-800">Conversation Data:</span>{" "}
                Conversation histories are retained for the duration of your
                subscription. Subscribers may delete individual conversations at
                any time through the platform.
              </li>
              <li>
                <span className="font-medium text-gray-800">Billing Records:</span>{" "}
                We retain billing and transaction records for 7 years after the
                transaction date to comply with Australian taxation and corporate
                record-keeping requirements.
              </li>
              <li>
                <span className="font-medium text-gray-800">Account Deletion:</span>{" "}
                When you delete your account, we will delete or de-identify your
                personal information within 30 days, except for data we are
                legally required to retain (such as billing records). Anonymised
                and aggregated data that cannot identify you may be retained
                indefinitely for analytics and service improvement.
              </li>
              <li>
                <span className="font-medium text-gray-800">Backups:</span>{" "}
                Deleted data may persist in encrypted backups for up to 90 days
                before being permanently purged.
              </li>
            </ul>
          </section>

          {/* 10. Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Children&apos;s Privacy
            </h2>
            <p>
              LeadFlow AI is a business-to-business platform designed for use by
              adults. Our services are not intended for individuals under the age
              of 18. We do not knowingly collect personal information from children.
              If we discover that we have inadvertently collected personal
              information from a child under 18, we will take immediate steps to
              delete that information. If you believe we may have collected
              information from a child, please contact us at{" "}
              <a
                href="mailto:privacy@leadflow.ai"
                className="text-blue-600 hover:underline"
              >
                privacy@leadflow.ai
              </a>
              .
            </p>
          </section>

          {/* 11. International Data Transfers */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. International Data Transfers
            </h2>
            <p className="mb-3">
              While your primary data is stored in Australia (AWS Sydney region),
              certain processing activities may involve transferring data outside
              of Australia:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                <span className="font-medium text-gray-800">AI Processing:</span>{" "}
                Conversation data sent to Anthropic&apos;s Claude API may be
                processed on servers located in the United States. This data is
                transmitted via encrypted channels, processed in real-time, and
                not retained by Anthropic.
              </li>
              <li>
                <span className="font-medium text-gray-800">Email Delivery:</span>{" "}
                Transactional emails processed by Resend may transit through
                servers in the United States.
              </li>
              <li>
                <span className="font-medium text-gray-800">Payment Processing:</span>{" "}
                Billing data processed by Stripe may be stored on servers in the
                United States, subject to Stripe&apos;s global data protection
                standards.
              </li>
              <li>
                <span className="font-medium text-gray-800">Embeddings:</span>{" "}
                Knowledge base content sent to Voyage AI for embedding generation
                may be processed on servers in the United States. This processing
                is stateless.
              </li>
            </ul>
            <p>
              In all cases, we take reasonable steps to ensure that overseas
              recipients handle your personal information in accordance with the
              Australian Privacy Principles, as required by APP 8. We maintain
              contractual safeguards with each provider.
            </p>
          </section>

          {/* 12. Changes to This Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. Changes to This Policy
            </h2>
            <p className="mb-3">
              We may update this Privacy Policy from time to time to reflect
              changes in our practices, technology, legal requirements, or other
              factors. When we make material changes:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                We will update the &quot;Last updated&quot; date at the top of this
                policy.
              </li>
              <li>
                We will notify you via email and/or an in-app notification at
                least 14 days before the changes take effect.
              </li>
              <li>
                For significant changes that affect how we process your data, we
                may seek your explicit consent.
              </li>
            </ul>
          </section>

          {/* 13. Contact Us */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              13. Contact Us
            </h2>
            <p className="mb-4">
              If you have any questions, concerns, or complaints about this Privacy
              Policy or our handling of your personal information, please contact
              us:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 space-y-2">
              <p className="font-semibold text-gray-900">
                LeadFlow AI Pty Ltd
              </p>
              <p>Privacy Officer</p>
              <p>
                Email:{" "}
                <a
                  href="mailto:privacy@leadflow.ai"
                  className="text-blue-600 hover:underline"
                >
                  privacy@leadflow.ai
                </a>
              </p>
              <p>Sydney, NSW 2000</p>
              <p>Australia</p>
            </div>
            <p className="mt-4 text-sm">
              We will acknowledge your complaint within 5 business days and aim to
              resolve it within 30 days. If you are not satisfied with our response,
              you may contact the{" "}
              <a
                href="https://www.oaic.gov.au"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Office of the Australian Information Commissioner (OAIC)
              </a>
              .
            </p>
          </section>

          {/* Related policies */}
          <section className="border-t pt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Related Policies
            </h2>
            <ul className="space-y-2">
              <li>
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-blue-600 hover:underline">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/security" className="text-blue-600 hover:underline">
                  Security
                </Link>
              </li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
