import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";

export default async function DashboardPage() {
  const user = await getUser();
  const supabase = await createServerClient();

  const [
    { count: totalContacts },
    { count: hotLeads },
    { count: activeConversations },
    { count: wonContacts },
  ] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("temperature", "hot"),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "won"),
  ]);

  const { data: recentConversations } = await supabase
    .from("conversations")
    .select("*, contact:contacts(name, temperature)")
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(5);

  const stats = [
    { label: "Total Contacts", value: totalContacts ?? 0 },
    { label: "Hot Leads", value: hotLeads ?? 0 },
    { label: "Active Conversations", value: activeConversations ?? 0 },
    { label: "Won", value: wonContacts ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white border rounded-lg p-6">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Recent Conversations */}
      <div className="bg-white border rounded-lg">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold">Recent Conversations</h2>
        </div>
        <div className="divide-y">
          {recentConversations?.map((conv) => (
            <div key={conv.id} className="px-6 py-4 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{conv.contact?.name ?? "Unknown"}</p>
                <p className="text-xs text-gray-500">{conv.channel_type} &middot; {conv.status}</p>
              </div>
              <div className="flex items-center gap-2">
                {conv.contact?.temperature === "hot" && (
                  <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
                {(conv.unread_count ?? 0) > 0 && (
                  <span className="text-xs bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
                    {conv.unread_count}
                  </span>
                )}
              </div>
            </div>
          ))}
          {(!recentConversations || recentConversations.length === 0) && (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              No conversations yet. Set up a channel to start receiving messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
