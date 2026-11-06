import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { ChangelogPopup } from "./changelog-popup";

export function DashboardShell({ children, showAdmin = false }: { children: ReactNode; showAdmin?: boolean }) {
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar - desktop only */}
      <Sidebar showAdmin={showAdmin} />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav showAdmin={showAdmin} />

      {/* What's-new popup (one-time per version) */}
      <ChangelogPopup />
    </div>
  );
}
