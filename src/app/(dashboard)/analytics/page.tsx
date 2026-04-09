import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";

export default async function AnalyticsPage() {
  const user = await getUser();
  const supabase = await createServerClient();

  // Get basic counts
  const [
    { count: totalContacts },
    { count: hotLeads },
    { count: totalConversations },
    { count: wonContacts },
  ] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("temperature", "hot"),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "won"),
  ]);

  const conversionRate = totalContacts && totalContacts > 0
    ? ((wonContacts ?? 0) / totalContacts * 100).toFixed(1)
    : "0";

  const stats = [
    { label: "Total Contacts", value: totalContacts ?? 0 },
    { label: "Hot Leads", value: hotLeads ?? 0 },
    { label: "Conversations", value: totalConversations ?? 0 },
    { label: "Conversion Rate", value: `${conversionRate}%` },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border rounded-lg p-6">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">Detailed analytics coming soon</p>
        <p className="text-sm mt-1">Charts and detailed breakdowns will be added in Phase 6.</p>
      </div>
    </div>
  );
}
