"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  CalendarCheck,
  Menu,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { MobileMoreMenu } from "./mobile-more-menu";

type Tab = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const primaryTabs: Tab[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
];

export function MobileNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white md:hidden">
        <ul className="flex items-center justify-around">
          {primaryTabs.map((tab) => {
            const isActive =
              pathname === tab.href || pathname?.startsWith(`${tab.href}/`);

            return (
              <li key={tab.href} className="flex-1">
                <Link
                  href={tab.href as never}
                  className={cn(
                    "flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                    isActive
                      ? "text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                >
                  <tab.icon
                    className={cn(
                      "h-5 w-5",
                      isActive ? "text-blue-600" : "text-gray-400"
                    )}
                  />
                  <span>{tab.label}</span>
                </Link>
              </li>
            );
          })}

          {/* More button */}
          <li className="flex-1">
            <button
              onClick={() => setMoreOpen(true)}
              className={cn(
                "flex w-full flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                moreOpen
                  ? "text-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              )}
              aria-label="More navigation options"
            >
              <Menu
                className={cn(
                  "h-5 w-5",
                  moreOpen ? "text-blue-600" : "text-gray-400"
                )}
              />
              <span>More</span>
            </button>
          </li>
        </ul>
      </nav>

      <MobileMoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
