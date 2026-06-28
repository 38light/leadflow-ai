"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Radio,
  BarChart3,
  Settings,
  GitBranch,
  Shield,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const moreItems: NavItem[] = [
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/channels", label: "Channels", icon: Radio },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/system-flow", label: "System Flow", icon: GitBranch },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: Shield },
];

interface MobileMoreMenuProps {
  open: boolean;
  onClose: () => void;
}

export function MobileMoreMenu({ open, onClose }: MobileMoreMenuProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity duration-300 md:hidden",
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Slide-up panel */}
      <div
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl bg-white shadow-xl transition-transform duration-300 ease-in-out md:hidden",
          open ? "translate-y-0" : "translate-y-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="More navigation options"
      >
        {/* Handle + header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-gray-300 absolute left-1/2 -translate-x-1/2 top-2" />
          <h2 className="text-base font-semibold text-gray-900">More</h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Grid of nav items */}
        <div className="grid grid-cols-3 gap-2 px-4 pb-8 pt-2">
          {moreItems.map((item) => {
            const isActive =
              pathname === item.href || pathname?.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href as never}
                onClick={onClose}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl px-3 py-4 transition-colors",
                  isActive
                    ? "bg-blue-50 text-blue-600"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon
                  className={cn(
                    "h-6 w-6",
                    isActive ? "text-blue-600" : "text-gray-500"
                  )}
                />
                <span className="text-xs font-medium text-center leading-tight">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
