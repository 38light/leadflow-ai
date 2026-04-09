import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";

export default async function ConversationsPage() {
  const user = await getUser();
  const supabase = await createServerClient();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*, contact:contacts(*)")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(25);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Conversations</h1>
      </div>
      <div className="space-y-2">
        {conversations && conversations.length > 0 ? (
          conversations.map((conv) => (
            <div
              key={conv.id}
              className="flex items-center gap-4 p-4 bg-white border rounded-lg hover:bg-gray-50"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">
                  {conv.contact?.name ?? "Unknown Contact"}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {conv.channel_type} &middot; {conv.summary ?? "No messages yet"}
                </p>
              </div>
              <div className="text-right">
                {(conv.unread_count ?? 0) > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
                    {conv.unread_count}
                  </span>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No conversations yet</p>
            <p className="text-sm mt-1">Conversations will appear here when leads message you.</p>
          </div>
        )}
      </div>
    </div>
  );
}
