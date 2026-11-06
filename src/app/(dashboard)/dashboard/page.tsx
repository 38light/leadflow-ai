import { getAuthContext } from "@/lib/auth/get-user";
import { TodayCommandCenter } from "@/components/dashboard/today-command-center";

export default async function DashboardPage() {
  await getAuthContext();
  return <TodayCommandCenter />;
}
