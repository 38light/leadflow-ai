"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ListTodo, MessageSquare, Users, BookOpen, Radio, BarChart3, Settings,
  ChevronLeft, ChevronRight, GitBranch, Shield, CalendarCheck, Map,
  Megaphone, ShieldCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string; icon: LucideIcon };

const dailyItems: NavItem[] = [
  { href: "/dashboard", label: "Today", icon: ListTodo },
  { href: "/conversations", label: "Inbox", icon: MessageSquare },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/approvals", label: "Approvals", icon: ShieldCheck },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const setupItems: NavItem[] = [
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/channels", label: "Channels", icon: Radio },
  { href: "/broadcasts", label: "Broadcasts", icon: Megaphone },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/system-flow", label: "System Flow", icon: GitBranch },
  { href: "/app-pages", label: "App Pages", icon: Map },
];

export function Sidebar({ showAdmin = false }: { showAdmin?: boolean }) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const workspaceItems = showAdmin ? [...setupItems, { href: "/admin", label: "Admin", icon: Shield }] : setupItems;

  function renderItem(item: NavItem) {
    const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
    return (
      <li key={item.href}>
        <Link
          href={item.href as never}
          aria-current={active ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300",
            active ? "bg-blue-600 text-white" : "text-gray-400 hover:bg-gray-800 hover:text-white",
            collapsed && "justify-center px-2",
          )}
          title={collapsed ? item.label : undefined}
          aria-label={collapsed ? item.label : undefined}
        >
          <item.icon className="h-5 w-5 shrink-0" />
          {!collapsed && <span>{item.label}</span>}
        </Link>
      </li>
    );
  }

  return (
    <aside className={cn("hidden h-screen shrink-0 flex-col border-r border-gray-800 bg-gray-950 text-white transition-all duration-300 lg:flex motion-reduce:transition-none", collapsed ? "w-16" : "w-64")}>
      <div className="flex h-16 shrink-0 items-center px-4">
        <Link href="/dashboard" className={cn("flex items-center gap-2 rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300", collapsed && "mx-auto")} aria-label="LeadFlow AI Today">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold">LF</div>
          {!collapsed && <span className="text-lg font-semibold tracking-tight">LeadFlow AI</span>}
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-4" aria-label="Main navigation">
        <ul className="space-y-1">{dailyItems.map(renderItem)}</ul>
        <div className="mb-3 mt-6 border-t border-gray-800 pt-4">
          {!collapsed && <p className="px-3 text-xs font-medium text-gray-500">Workspace</p>}
        </div>
        <ul className="space-y-1">{workspaceItems.map(renderItem)}</ul>
      </nav>
      <div className="border-t border-gray-800 p-2">
        <button type="button" onClick={() => setCollapsed((previous) => !previous)} className="flex w-full items-center justify-center rounded-md p-2 text-gray-400 hover:bg-gray-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-300" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
        </button>
      </div>
    </aside>
  );
}
