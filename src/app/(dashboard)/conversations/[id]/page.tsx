import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { notFound } from "next/navigation";

export default async function ConversationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  const supabase = await createServerClient();
  const { id } = await params;

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*, contact:contacts(*)")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!conversation) notFound();

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(100);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b bg-white">
        <div>
          <h2 className="font-semibold">{conversation.contact?.name ?? "Unknown"}</h2>
          <p className="text-sm text-gray-500">{conversation.channel_type}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded-full ${conversation.is_ai_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
            {conversation.is_ai_active ? "AI Active" : "Human Mode"}
          </span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages?.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                msg.direction === "outbound"
                  ? msg.sender_type === "ai"
                    ? "bg-purple-100 text-purple-900"
                    : "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-900"
              }`}
            >
              <p className="text-sm">{msg.content ?? ""}</p>
              <p className="text-xs opacity-60 mt-1">
                {msg.sender_type === "ai" ? "AI" : msg.sender_type === "human" ? "You" : ""}
                {msg.created_at && ` · ${new Date(msg.created_at).toLocaleTimeString()}`}
              </p>
            </div>
          </div>
        ))}
        {(!messages || messages.length === 0) && (
          <p className="text-center text-gray-400 py-8">No messages in this conversation yet.</p>
        )}
      </div>

      {/* Input placeholder */}
      <div className="p-4 border-t bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled
          />
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            disabled
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
