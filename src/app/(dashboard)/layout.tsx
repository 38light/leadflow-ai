import { DashboardShell } from "@/components/layout";
import { ToastProvider } from "@/components/ui/toast";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToastProvider>
      <ImpersonationBanner />
      <DashboardShell>{children}</DashboardShell>
    </ToastProvider>
  );
}
