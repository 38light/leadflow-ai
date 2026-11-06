import { DashboardShell } from "@/components/layout";
import { ToastProvider } from "@/components/ui/toast";
import { ImpersonationBanner } from "@/components/admin/impersonation-banner";
import { getAuthContext } from "@/lib/auth/get-user";

// Resolve authentication and role-dependent navigation per request, including
// when a production build was created with the local development auth bypass.
export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await getAuthContext();
  return (
    <ToastProvider>
      <ImpersonationBanner />
      <DashboardShell showAdmin={ctx.isSuperAdmin}>{children}</DashboardShell>
    </ToastProvider>
  );
}
