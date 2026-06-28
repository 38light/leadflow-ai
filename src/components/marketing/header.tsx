"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Zap, Menu, X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Features", href: "/features" as const },
  {
    label: "Solutions",
    href: "#" as const,
    children: [
      { label: "All Solutions", href: "/solutions" as const },
      { label: "Marriage Celebrants", href: "/solutions/marriage-celebrants" as const },
      { label: "Driving Instructors", href: "/solutions/driving-instructors" as const },
    ],
  },
  { label: "Pricing", href: "/pricing" as const },
  { label: "Case Studies", href: "/case-studies" as const },
  {
    label: "Resources",
    href: "#" as const,
    children: [
      { label: "Documentation", href: "/docs" as const },
      { label: "API Reference", href: "/api-docs" as const },
      { label: "Blog", href: "/blog" as const },
      { label: "Changelog", href: "/changelog" as const },
      { label: "Status", href: "/status" as const },
    ],
  },
  {
    label: "Company",
    href: "#" as const,
    children: [
      { label: "About", href: "/about" as const },
      { label: "Careers", href: "/careers" as const },
      { label: "Contact", href: "/contact" as const },
      { label: "Security", href: "/security" as const },
      { label: "Compare", href: "/compare" as const },
    ],
  },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 10);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick() {
      setOpenDropdown(null);
    }
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 border-b bg-white/95 backdrop-blur transition-shadow duration-300",
        scrolled ? "shadow-md border-gray-200" : "border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Zap className="h-7 w-7 text-transparent" style={{ stroke: "url(#logo-gradient)" }} />
          <svg width="0" height="0" className="absolute">
            <defs>
              <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2563eb" />
                <stop offset="100%" stopColor="#9333ea" />
              </linearGradient>
            </defs>
          </svg>
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-xl font-bold text-transparent">
            LeadFlow AI
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {navLinks.map((link) => {
            const isActive = link.href !== "#" && pathname === link.href;
            const hasChildren = "children" in link && link.children;
            const isDropdownOpen = openDropdown === link.label;

            if (hasChildren) {
              return (
                <div
                  key={link.label}
                  className="relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => setOpenDropdown(isDropdownOpen ? null : link.label)}
                    className={cn(
                      "flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50 hover:text-gray-900",
                      isDropdownOpen ? "text-gray-900 bg-gray-50" : "text-gray-600"
                    )}
                  >
                    {link.label}
                    <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isDropdownOpen && "rotate-180")} />
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-48 rounded-xl border border-gray-200 bg-white py-2 shadow-lg">
                      {link.children.map((child) => (
                        <Link
                          key={child.href}
                          href={child.href as never}
                          onClick={() => setOpenDropdown(null)}
                          className={cn(
                            "block px-4 py-2 text-sm transition-colors hover:bg-gray-50",
                            pathname === child.href ? "text-blue-600 font-medium" : "text-gray-600 hover:text-gray-900"
                          )}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href as never}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50 hover:text-gray-900",
                  isActive ? "text-blue-600" : "text-gray-600"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Start Free Trial
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex items-center justify-center rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 lg:hidden"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      <div
        className={cn(
          "overflow-hidden border-t border-gray-100 bg-white transition-all duration-300 ease-in-out lg:hidden",
          mobileOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-4 py-3">
          {navLinks.map((link) => {
            const hasChildren = "children" in link && link.children;

            if (hasChildren) {
              return (
                <div key={link.label}>
                  <p className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {link.label}
                  </p>
                  {link.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href as never}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        "block rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50",
                        pathname === child.href ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                      )}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href as never}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50",
                  pathname === link.href ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
                )}
              >
                {link.label}
              </Link>
            );
          })}
          <hr className="my-2 border-gray-100" />
          <Link
            href="/login"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg border border-gray-300 px-3 py-2.5 text-center text-sm font-medium text-gray-700 transition-colors hover:border-gray-400 hover:text-gray-900"
          >
            Log In
          </Link>
          <Link
            href="/register"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2.5 text-center text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Start Free Trial
          </Link>
        </nav>
      </div>
    </header>
  );
}
