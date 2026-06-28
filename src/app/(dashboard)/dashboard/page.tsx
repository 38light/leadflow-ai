import { createServerClient } from "@/lib/supabase/server";
import { getAuthContext } from "@/lib/auth/get-user";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";
import { AIHandledStats } from "@/components/dashboard/ai-handled-stats";
import { StaleLeadsAlert } from "@/components/dashboard/stale-leads-alert";

export default async function DashboardPage() {
  const ctx = await getAuthContext();
  const supabase = await createServerClient();
  const ownerId = ctx.ownerId;

  const [
    { count: totalContacts },
    { count: hotLeads },
    { count: activeConversations },
    { count: wonContacts },
  ] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", ownerId),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", ownerId).eq("temperature", "hot"),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("user_id", ownerId).eq("status", "active"),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", ownerId).eq("status", "won"),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <StaleLeadsAlert />

      {/* Onboarding (auto-hides once user has contacts or dismisses) */}
      <OnboardingChecklist />

      {/* AI social-proof badge */}
      <AIHandledStats ownerId={ownerId} />

      {/* KPI Cards */}
      <KpiCards
        totalContacts={totalContacts ?? 0}
        hotLeads={hotLeads ?? 0}
        activeConversations={activeConversations ?? 0}
        wonDeals={wonContacts ?? 0}
      />

      {/* Charts */}
      <DashboardCharts />

      {/* Activity Feed */}
      <ActivityFeed ownerId={ownerId} />
    </div>
  );
}
