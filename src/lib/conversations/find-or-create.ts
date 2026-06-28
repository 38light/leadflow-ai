import type { SupabaseClient } from "@supabase/supabase-js";

interface FindOrCreateWebChatConversationParams {
  userId: string;
  contactId: string;
  sessionId: string;
  supabase: SupabaseClient;
}

interface FindOrCreateWebChatConversationResult {
  conversationId: string;
  isNew: boolean;
}

/**
 * Find an existing web chat conversation by sessionId (external_thread_id),
 * or create a new one. Ensures one conversation per chat session.
 */
export async function findOrCreateWebChatConversation(
  params: FindOrCreateWebChatConversationParams
): Promise<FindOrCreateWebChatConversationResult> {
  const { userId, contactId, sessionId, supabase } = params;

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("user_id", userId)
    .eq("external_thread_id", sessionId)
    .eq("channel_type", "web_chat")
    .maybeSingle();

  if (existing) {
    return { conversationId: existing.id, isNew: false };
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      user_id: userId,
      contact_id: contactId,
      channel_type: "web_chat",
      external_thread_id: sessionId,
      status: "active",
      is_ai_active: true,
      last_message_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create conversation: ${error?.message ?? "Unknown error"}`);
  }

  return { conversationId: data.id, isNew: true };
}
