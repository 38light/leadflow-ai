import { getAuthContext } from "@/lib/auth/get-user";
import { TodayCommandCenter } from "@/components/dashboard/today-command-center";
import { OnboardingChecklist } from "@/components/dashboard/onboarding-checklist";

export default async function DashboardPage() {
  await getAuthContext();
  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-7xl"><OnboardingChecklist /></div>
      <TodayCommandCenter />
    </div>
  );
}
