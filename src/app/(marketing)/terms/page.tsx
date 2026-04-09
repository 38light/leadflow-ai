import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service — LeadFlow AI",
  description:
    "Terms of Service for LeadFlow AI. Read our terms governing the use of our AI-powered lead management platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="py-20">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-gray-500">
            Last updated: April 2026
          </p>
          <p className="text-gray-500">
            Effective date: April 2026
          </p>
        </div>

        {/* Body */}
        <div className="space-y-10 text-gray-600 leading-relaxed">
          {/* 1. Acceptance of Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="mb-3">
              These Terms of Service (&quot;Terms&quot;) constitute a legally
              binding agreement between you (&quot;you&quot;, &quot;your&quot;, or
              &quot;Subscriber&quot;) and LeadFlow AI Pty Ltd (ABN to be assigned),
              a company registered in New South Wales, Australia
              (&quot;LeadFlow AI&quot;, &quot;we&quot;, &quot;us&quot;, or
              &quot;our&quot;).
            </p>
            <p className="mb-3">
              By creating an account, accessing, or using the LeadFlow AI platform
              and services (collectively, the &quot;Service&quot;), you agree to be
              bound by these Terms. If you are using the Service on behalf of a
              business or organisation, you represent that you have the authority to
              bind that entity to these Terms.
            </p>
            <p>
              If you do not agree to these Terms, you must not access or use the
              Service. We recommend that you print or save a copy of these Terms
              for your records.
            </p>
          </section>

          {/* 2. Description of Service */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              2. Description of Service
            </h2>
            <p className="mb-3">
              LeadFlow AI is an AI-powered omni-channel lead capture, qualification,
              and conversion platform designed for Australian service businesses.
              The Service includes, but is not limited to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                AI-powered conversational assistants that respond to leads across
                WhatsApp, SMS, Instagram, Facebook Messenger, Voice, and Web Chat
                on your behalf.
              </li>
              <li>
                Lead capture, scoring, qualification, and management tools.
              </li>
              <li>
                Automated appointment scheduling and calendar management.
              </li>
              <li>
                Invoice generation and payment processing through Stripe.
              </li>
              <li>
                CRM integration (including HubSpot synchronisation).
              </li>
              <li>
                Knowledge base management for training your AI assistant.
              </li>
              <li>
                Analytics dashboards and reporting.
              </li>
              <li>
                Human-in-the-loop conversation handoff and oversight tools.
              </li>
            </ul>
            <p>
              We reserve the right to modify, suspend, or discontinue any part of
              the Service at any time, with reasonable notice to active Subscribers.
            </p>
          </section>

          {/* 3. Account Registration & Security */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. Account Registration &amp; Security
            </h2>
            <p className="mb-3">
              To use the Service, you must create an account by providing accurate
              and complete information. You agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                Provide truthful, accurate, and current registration information.
              </li>
              <li>
                Maintain and promptly update your account information to keep it
                accurate and complete.
              </li>
              <li>
                Keep your password and authentication credentials secure and
                confidential.
              </li>
              <li>
                Immediately notify us at{" "}
                <a
                  href="mailto:security@leadflow.ai"
                  className="text-blue-600 hover:underline"
                >
                  security@leadflow.ai
                </a>{" "}
                if you suspect any unauthorised access to your account.
              </li>
              <li>
                Accept responsibility for all activities that occur under your
                account.
              </li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that contain
              inaccurate information or that we reasonably believe have been
              compromised.
            </p>
          </section>

          {/* 4. Subscription Plans & Billing */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              4. Subscription Plans &amp; Billing
            </h2>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              4.1 Plans
            </h3>
            <p className="mb-4">
              LeadFlow AI offers multiple subscription tiers, including a free tier
              with limited features and usage, and paid plans with expanded
              capabilities. Current plan details and pricing are available on our{" "}
              <Link href="/pricing" className="text-blue-600 hover:underline">
                Pricing page
              </Link>
              .
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              4.2 Billing
            </h3>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                Paid subscriptions are billed in advance on a monthly or annual
                basis, in Australian Dollars (AUD), unless otherwise stated.
              </li>
              <li>
                All payments are processed securely through Stripe. By subscribing
                to a paid plan, you authorise us to charge your designated payment
                method.
              </li>
              <li>
                Prices are inclusive of GST for Australian customers unless
                otherwise noted.
              </li>
              <li>
                Subscriptions automatically renew at the end of each billing
                period unless cancelled before the renewal date.
              </li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              4.3 Refund Policy
            </h3>
            <p className="mb-3">
              We offer pro-rated refunds for paid subscriptions cancelled within
              30 days of the initial purchase or renewal, calculated based on the
              unused portion of the billing period. Refunds are processed to the
              original payment method within 5-10 business days.
            </p>
            <p>
              Refunds are not available for: usage-based overages, add-on purchases
              that have already been consumed, or accounts terminated for violation
              of these Terms.
            </p>
          </section>

          {/* 5. Acceptable Use Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              5. Acceptable Use Policy
            </h2>
            <p className="mb-3">
              You agree to use the Service only for lawful purposes and in
              accordance with these Terms. You must not:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                <span className="font-medium text-gray-800">Send spam or unsolicited messages:</span>{" "}
                Use the platform to send bulk unsolicited commercial messages or
                messages that violate the Spam Act 2003 (Cth) or the Do Not Call
                Register Act 2006 (Cth).
              </li>
              <li>
                <span className="font-medium text-gray-800">Distribute illegal or harmful content:</span>{" "}
                Use the Service to transmit content that is unlawful, defamatory,
                obscene, threatening, harassing, or that infringes on any third
                party&apos;s intellectual property rights.
              </li>
              <li>
                <span className="font-medium text-gray-800">Abuse AI systems:</span>{" "}
                Attempt to manipulate, jailbreak, or misuse the AI assistant to
                generate harmful, misleading, discriminatory, or illegal content.
              </li>
              <li>
                <span className="font-medium text-gray-800">Impersonate others:</span>{" "}
                Use the AI assistant to impersonate real individuals, government
                agencies, or other businesses without authorisation.
              </li>
              <li>
                <span className="font-medium text-gray-800">Scrape or reverse-engineer:</span>{" "}
                Scrape, crawl, or use automated tools to extract data from the
                platform, or attempt to reverse-engineer, decompile, or
                disassemble any part of the Service.
              </li>
              <li>
                <span className="font-medium text-gray-800">Circumvent security:</span>{" "}
                Attempt to bypass authentication, exploit vulnerabilities, or
                interfere with the security or integrity of the Service.
              </li>
              <li>
                <span className="font-medium text-gray-800">Resell without authorisation:</span>{" "}
                Sublicense, resell, or redistribute the Service without our prior
                written consent.
              </li>
            </ul>
          </section>

          {/* 6. AI-Generated Content */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. AI-Generated Content
            </h2>
            <p className="mb-3">
              The Service uses artificial intelligence to generate responses and
              content on behalf of your business. You acknowledge and agree that:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                <span className="font-medium text-gray-800">AI may produce errors:</span>{" "}
                AI-generated responses may occasionally contain inaccuracies,
                incomplete information, or contextually inappropriate content.
                While we continuously improve AI accuracy, we cannot guarantee that
                all AI outputs will be error-free.
              </li>
              <li>
                <span className="font-medium text-gray-800">Business owner responsibility:</span>{" "}
                You are ultimately responsible for the accuracy and appropriateness
                of all communications sent to your leads and customers through the
                Service, including AI-generated messages. You should regularly
                review AI conversations and adjust your knowledge base as needed.
              </li>
              <li>
                <span className="font-medium text-gray-800">AI transparency:</span>{" "}
                You agree to comply with applicable AI transparency requirements,
                including ensuring that your leads can reasonably determine they are
                communicating with an AI assistant. You must not configure your AI
                assistant to deny being AI when directly asked.
              </li>
              <li>
                <span className="font-medium text-gray-800">No professional advice:</span>{" "}
                AI-generated content does not constitute legal, medical, financial,
                or other professional advice. If your business operates in a
                regulated industry, you are responsible for ensuring AI responses
                comply with applicable regulations.
              </li>
            </ul>
          </section>

          {/* 7. Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Intellectual Property
            </h2>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              7.1 Our Intellectual Property
            </h3>
            <p className="mb-4">
              The LeadFlow AI platform, including its software, algorithms, user
              interface, design, documentation, branding, trademarks, and all
              related intellectual property, is and remains the exclusive property
              of LeadFlow AI Pty Ltd. These Terms do not grant you any ownership
              rights in the Service.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              7.2 Your Content
            </h3>
            <p className="mb-4">
              You retain all ownership rights to the content you upload, create,
              or transmit through the Service, including your knowledge base
              documents, business information, and communication content
              (&quot;Your Content&quot;). By using the Service, you grant us a
              limited, non-exclusive licence to use, process, and store Your
              Content solely to provide and improve the Service.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              7.3 Feedback
            </h3>
            <p>
              If you provide us with feedback, suggestions, or ideas about the
              Service, you grant us an irrevocable, royalty-free, worldwide licence
              to use that feedback for any purpose, including improving and
              marketing the Service.
            </p>
          </section>

          {/* 8. User Data & Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              8. User Data &amp; Privacy
            </h2>
            <p className="mb-3">
              Your privacy is important to us. Our collection, use, and disclosure
              of personal information is governed by our{" "}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </Link>
              , which is incorporated into these Terms by reference.
            </p>
            <p className="mb-3">
              As a Subscriber, you may collect and process personal information of
              your own leads and customers through the Service. You acknowledge
              that you are the data controller for such information and are
              responsible for complying with the Privacy Act 1988 (Cth) and the
              Australian Privacy Principles in relation to that data.
            </p>
            <p>
              You must ensure that your use of the Service to collect, store, and
              process lead data complies with all applicable privacy laws,
              including providing appropriate notices and obtaining any necessary
              consents.
            </p>
          </section>

          {/* 9. Third-Party Integrations */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              9. Third-Party Integrations
            </h2>
            <p className="mb-3">
              The Service integrates with third-party platforms and services,
              including but not limited to HubSpot, Stripe, Twilio, Meta
              (Instagram/Facebook), and Google Calendar. You acknowledge that:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Third-party integrations are governed by their own terms of service
                and privacy policies, which you are responsible for reviewing and
                complying with.
              </li>
              <li>
                We are not responsible for the availability, accuracy, or security
                of third-party services.
              </li>
              <li>
                You are responsible for maintaining valid API credentials and
                authorisations for any third-party services you connect.
              </li>
              <li>
                We may modify or discontinue third-party integrations at any time,
                with reasonable notice.
              </li>
              <li>
                Your use of third-party messaging platforms (such as WhatsApp and
                Instagram) must comply with their respective business policies and
                messaging guidelines.
              </li>
            </ul>
          </section>

          {/* 10. Service Availability & SLA */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Service Availability &amp; SLA
            </h2>
            <p className="mb-3">
              We strive to provide a reliable and available service:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                <span className="font-medium text-gray-800">Uptime Target:</span>{" "}
                We target 99.9% uptime for paid plans, measured on a monthly basis,
                excluding scheduled maintenance windows.
              </li>
              <li>
                <span className="font-medium text-gray-800">Planned Maintenance:</span>{" "}
                We will provide at least 48 hours notice for planned maintenance
                that may affect service availability. Maintenance windows are
                typically scheduled during off-peak hours (AEST).
              </li>
              <li>
                <span className="font-medium text-gray-800">Free Tier:</span>{" "}
                The free tier is provided on an &quot;as is&quot; basis without any
                uptime guarantees or service level commitments.
              </li>
              <li>
                <span className="font-medium text-gray-800">Incident Communication:</span>{" "}
                In the event of unplanned downtime, we will communicate status
                updates through our status page and via email to affected
                Subscribers.
              </li>
            </ul>
            <p>
              While we make commercially reasonable efforts to maintain high
              availability, we do not guarantee uninterrupted access to the Service
              and shall not be liable for any downtime or service interruptions.
            </p>
          </section>

          {/* 11. Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              11. Limitation of Liability
            </h2>
            <p className="mb-3">
              To the maximum extent permitted by Australian law, including the
              Australian Consumer Law (Schedule 2 of the Competition and Consumer
              Act 2010):
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                LeadFlow AI shall not be liable for any indirect, incidental,
                special, consequential, or punitive damages, including but not
                limited to loss of profits, revenue, data, business opportunities,
                or goodwill, arising from your use of or inability to use the
                Service.
              </li>
              <li>
                Our total aggregate liability for all claims arising from or
                related to these Terms or the Service shall not exceed the total
                fees paid by you to LeadFlow AI in the 12 months immediately
                preceding the event giving rise to the claim.
              </li>
              <li>
                We are not liable for any loss or damage caused by AI-generated
                responses, including lost leads, incorrect information provided to
                leads, or any business decisions made based on AI outputs.
              </li>
              <li>
                We are not liable for failures or disruptions caused by third-party
                services, including Twilio, Stripe, HubSpot, Meta, or Anthropic.
              </li>
            </ul>
            <p>
              Nothing in these Terms excludes or limits liability that cannot be
              excluded or limited under Australian law, including liability for
              fraud, death, or personal injury caused by negligence, or guarantees
              under the Australian Consumer Law that cannot be excluded.
            </p>
          </section>

          {/* 12. Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. Indemnification
            </h2>
            <p>
              You agree to indemnify, defend, and hold harmless LeadFlow AI Pty Ltd,
              its officers, directors, employees, and agents from and against any
              and all claims, liabilities, damages, losses, costs, and expenses
              (including reasonable legal fees) arising out of or related to: (a)
              your use of the Service; (b) your violation of these Terms; (c) your
              violation of any applicable law or regulation; (d) your infringement
              of any third-party intellectual property or privacy rights; (e)
              content you upload, transmit, or make available through the Service;
              or (f) your configuration and use of AI-generated responses in
              communications with your leads and customers.
            </p>
          </section>

          {/* 13. Termination */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              13. Termination
            </h2>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              13.1 Termination by You
            </h3>
            <p className="mb-4">
              You may cancel your subscription and terminate your account at any
              time through your account settings or by contacting us at{" "}
              <a
                href="mailto:support@leadflow.ai"
                className="text-blue-600 hover:underline"
              >
                support@leadflow.ai
              </a>
              . Cancellation will take effect at the end of your current billing
              period.
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              13.2 Termination by Us
            </h3>
            <p className="mb-4">
              We may suspend or terminate your account immediately, without prior
              notice, if: (a) you breach these Terms; (b) your use of the Service
              poses a security risk or may cause harm to other users; (c) we are
              required to do so by law; or (d) your account has been inactive for
              more than 12 consecutive months (free tier only).
            </p>

            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              13.3 Effect of Termination
            </h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Upon termination, your right to access the Service ceases
                immediately.
              </li>
              <li>
                You will have 30 days from the date of termination to export your
                data. During this period, you may request a data export by
                contacting{" "}
                <a
                  href="mailto:support@leadflow.ai"
                  className="text-blue-600 hover:underline"
                >
                  support@leadflow.ai
                </a>
                .
              </li>
              <li>
                After the 30-day data export window, we will delete or de-identify
                your data in accordance with our{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
                .
              </li>
              <li>
                Any outstanding fees remain payable, and no refund is provided for
                the current billing period upon termination for breach.
              </li>
              <li>
                Sections that by their nature should survive termination (including
                intellectual property, limitation of liability, indemnification,
                and governing law) will continue in effect.
              </li>
            </ul>
          </section>

          {/* 14. Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              14. Governing Law
            </h2>
            <p>
              These Terms are governed by and construed in accordance with the laws
              of New South Wales, Australia. You agree to submit to the exclusive
              jurisdiction of the courts of New South Wales, Australia, for the
              resolution of any disputes arising under or in connection with these
              Terms. Nothing in these Terms limits your rights under the Australian
              Consumer Law.
            </p>
          </section>

          {/* 15. Dispute Resolution */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              15. Dispute Resolution
            </h2>
            <p className="mb-3">
              In the event of a dispute arising from or in connection with these
              Terms, the parties agree to the following resolution process:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                <span className="font-medium text-gray-800">Good Faith Negotiation:</span>{" "}
                The parties shall first attempt to resolve the dispute through
                good faith negotiation within 30 days of written notice of the
                dispute.
              </li>
              <li>
                <span className="font-medium text-gray-800">Mediation:</span>{" "}
                If the dispute is not resolved through negotiation, the parties
                agree to participate in mediation administered by the Australian
                Disputes Centre (ADC) in Sydney, NSW, before commencing court
                proceedings. The costs of mediation shall be shared equally.
              </li>
              <li>
                <span className="font-medium text-gray-800">Court Proceedings:</span>{" "}
                If the dispute is not resolved through mediation within 60 days,
                either party may commence proceedings in the courts of New South
                Wales, Australia.
              </li>
            </ol>
          </section>

          {/* 16. Changes to Terms */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              16. Changes to Terms
            </h2>
            <p className="mb-3">
              We reserve the right to modify these Terms at any time. When we make
              changes:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                We will update the &quot;Last updated&quot; date at the top of
                these Terms.
              </li>
              <li>
                We will notify you of material changes via email and/or an in-app
                notification at least 30 days before the changes take effect.
              </li>
              <li>
                Your continued use of the Service after the effective date
                constitutes acceptance of the updated Terms.
              </li>
              <li>
                If you do not agree to the updated Terms, you must discontinue
                use of the Service before the effective date.
              </li>
            </ul>
          </section>

          {/* 17. Contact Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              17. Contact Information
            </h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 space-y-2">
              <p className="font-semibold text-gray-900">
                LeadFlow AI Pty Ltd
              </p>
              <p>Legal Department</p>
              <p>
                Email:{" "}
                <a
                  href="mailto:legal@leadflow.ai"
                  className="text-blue-600 hover:underline"
                >
                  legal@leadflow.ai
                </a>
              </p>
              <p>Sydney, NSW 2000</p>
              <p>Australia</p>
            </div>
          </section>

          {/* Related policies */}
          <section className="border-t pt-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
              Related Policies
            </h2>
            <ul className="space-y-2">
              <li>
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
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
