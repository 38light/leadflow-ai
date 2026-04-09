import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy — LeadFlow AI",
  description:
    "Learn about how LeadFlow AI uses cookies and similar technologies on our platform.",
};

const cookieTable = [
  {
    name: "sb-access-token",
    purpose: "Supabase authentication session token. Required for secure login and API access.",
    duration: "1 hour (refreshed automatically)",
    type: "Essential",
  },
  {
    name: "sb-refresh-token",
    purpose: "Supabase session refresh token. Used to maintain your login session without requiring repeated sign-in.",
    duration: "7 days",
    type: "Essential",
  },
  {
    name: "__csrf_token",
    purpose: "Cross-Site Request Forgery protection. Prevents unauthorised actions on your account.",
    duration: "Session",
    type: "Essential",
  },
  {
    name: "lf_sidebar_state",
    purpose: "Remembers whether you have the dashboard sidebar expanded or collapsed.",
    duration: "1 year",
    type: "Functional",
  },
  {
    name: "lf_theme",
    purpose: "Stores your preferred theme setting (light, dark, or system).",
    duration: "1 year",
    type: "Functional",
  },
  {
    name: "lf_analytics",
    purpose: "Anonymous usage analytics identifier. Helps us understand feature usage patterns to improve the product. No personally identifiable information is stored.",
    duration: "90 days",
    type: "Analytics",
  },
];

export default function CookiePolicyPage() {
  return (
    <div className="py-20">
      <div className="max-w-3xl mx-auto px-4">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
          <p className="text-gray-500">
            Last updated: April 2026
          </p>
        </div>

        {/* Body */}
        <div className="space-y-10 text-gray-600 leading-relaxed">
          {/* What are cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              What Are Cookies?
            </h2>
            <p className="mb-3">
              Cookies are small text files that are placed on your device (computer,
              tablet, or mobile phone) when you visit a website. They are widely
              used to make websites work efficiently, provide a better user
              experience, and supply information to website operators.
            </p>
            <p>
              LeadFlow AI uses cookies and similar technologies (such as local
              storage) to authenticate your sessions, remember your preferences,
              and understand how our platform is used. This policy explains what
              cookies we use, why, and how you can control them.
            </p>
          </section>

          {/* Types of cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Types of Cookies We Use
            </h2>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Essential / Necessary Cookies
                </h3>
                <p>
                  These cookies are strictly necessary for the platform to function.
                  They enable core features such as authentication, session
                  management, and security protections (including CSRF prevention).
                  Without these cookies, you cannot log in or use the Service.
                  Essential cookies cannot be disabled.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Functional Cookies
                </h3>
                <p>
                  Functional cookies remember your preferences and choices to
                  provide a more personalised experience. For example, they store
                  your preferred theme (light or dark mode) and dashboard layout
                  settings. These cookies are not essential to use the platform but
                  enhance your experience.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Analytics Cookies
                </h3>
                <p>
                  We use anonymous analytics cookies to understand how visitors
                  interact with our platform. This data is aggregated and does not
                  identify individual users. Analytics data helps us identify
                  popular features, detect usability issues, and improve the
                  Service. We do not use third-party analytics platforms such as
                  Google Analytics.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Marketing / Advertising Cookies
                </h3>
                <p>
                  We do not currently use any marketing, advertising, or
                  retargeting cookies. We do not serve ads on our platform, and we
                  do not use tracking pixels from advertising networks (such as
                  Meta Pixel or Google Ads). If this changes in the future, we will
                  update this policy and obtain your consent before placing such
                  cookies.
                </p>
              </div>
            </div>
          </section>

          {/* Cookie Table */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Cookies We Set
            </h2>
            <p className="mb-4">
              Below is a detailed list of the cookies used by LeadFlow AI:
            </p>
            <div className="overflow-x-auto border rounded-lg">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-700 font-semibold border-b">
                  <tr>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cookieTable.map((cookie) => (
                    <tr key={cookie.name}>
                      <td className="px-4 py-3 font-mono text-xs text-gray-800 whitespace-nowrap">
                        {cookie.name}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {cookie.purpose}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {cookie.duration}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            cookie.type === "Essential"
                              ? "bg-red-100 text-red-700"
                              : cookie.type === "Functional"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-green-100 text-green-700"
                          }`}
                        >
                          {cookie.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* How to manage cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              How to Manage Cookies
            </h2>
            <p className="mb-3">
              Most web browsers allow you to control cookies through their
              settings. You can typically find cookie controls in your
              browser&apos;s &quot;Settings&quot; or &quot;Preferences&quot; menu.
              Below are links to cookie management instructions for common
              browsers:
            </p>
            <ul className="list-disc pl-6 space-y-2 mb-4">
              <li>
                <a
                  href="https://support.google.com/chrome/answer/95647"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Google Chrome
                </a>
              </li>
              <li>
                <a
                  href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Mozilla Firefox
                </a>
              </li>
              <li>
                <a
                  href="https://support.apple.com/en-au/guide/safari/sfri11471/mac"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Apple Safari
                </a>
              </li>
              <li>
                <a
                  href="https://support.microsoft.com/en-us/microsoft-edge/manage-cookies-in-microsoft-edge-168dab11-0753-043d-7c16-ede5947fc64d"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Microsoft Edge
                </a>
              </li>
            </ul>
            <p>
              Please note that disabling essential cookies will prevent you from
              logging in to the LeadFlow AI platform. Disabling functional cookies
              will reset your preferences to default settings.
            </p>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Changes to This Cookie Policy
            </h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes
              in the cookies we use or for other operational, legal, or regulatory
              reasons. We will update the &quot;Last updated&quot; date at the top
              of this page and, for material changes, notify you via email or an
              in-app notification.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Contact Us
            </h2>
            <p className="mb-4">
              If you have any questions about our use of cookies, please contact
              us:
            </p>
            <div className="bg-gray-50 rounded-lg p-6 space-y-2">
              <p className="font-semibold text-gray-900">
                LeadFlow AI Pty Ltd
              </p>
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
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
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
