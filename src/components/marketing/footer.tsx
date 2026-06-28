import Link from "next/link";
import { Twitter, Linkedin, Github, Zap } from "lucide-react";
import { NewsletterForm } from "./newsletter-form";

const footerColumns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "/features" },
      { label: "Solutions", href: "/solutions" },
      { label: "Pricing", href: "/pricing" },
      { label: "Integrations", href: "/integrations" },
      { label: "API", href: "/api-docs" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Case Studies", href: "/case-studies" },
      { label: "Careers", href: "/careers" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Policy", href: "/cookies" },
      { label: "Security", href: "/security" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/docs" },
      { label: "Documentation", href: "/docs" },
      { label: "Status", href: "/status" },
      { label: "Changelog", href: "/changelog" },
    ],
  },
];

const socialLinks = [
  { label: "Twitter", href: "https://twitter.com", icon: Twitter },
  { label: "LinkedIn", href: "https://linkedin.com", icon: Linkedin },
  { label: "GitHub", href: "https://github.com", icon: Github },
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Top section: logo + newsletter */}
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
          {/* Brand */}
          <div className="max-w-md">
            <Link href="/" className="mb-4 inline-flex items-center gap-2">
              <Zap className="h-7 w-7 text-blue-500" />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-xl font-bold text-transparent">
                LeadFlow AI
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-gray-400">
              Transform your leads into loyal customers with AI-powered
              conversations. Automate follow-ups, qualify prospects, and close
              deals faster than ever.
            </p>
          </div>

          {/* Newsletter */}
          <div className="lg:flex lg:flex-col lg:items-end">
            <div className="max-w-md lg:text-right">
              <h3 className="text-sm font-semibold tracking-wider text-white uppercase">
                Stay up to date
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                Get the latest product updates and industry insights delivered
                to your inbox.
              </p>
              <NewsletterForm />
            </div>
          </div>
        </div>

        {/* Link Columns */}
        <div className="mt-16 grid grid-cols-2 gap-8 md:grid-cols-4">
          {footerColumns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold tracking-wider text-white uppercase">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-gray-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 flex flex-col items-center justify-between gap-4 border-t border-gray-800 pt-8 sm:flex-row">
          <p className="text-sm text-gray-500">
            &copy; 2026 LeadFlow AI. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={social.label}
                className="text-gray-500 transition-colors hover:text-white"
              >
                <social.icon className="h-5 w-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
