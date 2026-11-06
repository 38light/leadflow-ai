"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Radio, BarChart3, Settings, GitBranch, Shield, ShieldCheck, Megaphone, Map } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };
const moreItems: NavItem[] = [
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/channels", label: "Channels", icon: Radio },
  { href: "/broadcasts", label: "Broadcasts", icon: Megaphone },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/system-flow", label: "System Flow", icon: GitBranch },
  { href: "/app-pages", label: "App Pages", icon: Map },
];

export function MobileMoreMenu({ open, onClose, showAdmin = false }: { open: boolean; onClose: () => void; showAdmin?: boolean }) {
  const pathname = usePathname();
  const items = showAdmin ? [...moreItems, { href: "/admin", label: "Admin", icon: Shield }] : moreItems;
  return (
    <Modal open={open} onClose={onClose} title="More" size="md">
      <nav className="grid grid-cols-3 gap-2" aria-label="More navigation">
        {items.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link key={item.href} href={item.href as never} onClick={onClose} aria-current={active ? "page" : undefined} className={cn("flex flex-col items-center gap-2 rounded-xl px-3 py-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500", active ? "bg-blue-50 text-blue-700" : "bg-gray-50 text-gray-600 hover:bg-gray-100")}>
              <item.icon className="h-6 w-6" />
              <span className="text-center text-xs font-medium leading-tight">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </Modal>
  );
}
