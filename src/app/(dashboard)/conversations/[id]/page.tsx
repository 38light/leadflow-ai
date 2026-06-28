import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { notFound } from "next/navigation";
import { ConversationThread } from "@/components/conversations/conversation-thread";
import { ScoreConversationButton } from "@/components/conversations/score-conversation-button";
import type { ConversationQualityRubric } from "@/types";

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

  const metadata = (conversation.metadata as Record<string, unknown> | null) ?? {};
  const initialRubric = (metadata.quality_rubric as ConversationQualityRubric | undefined) ?? null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-end px-4 pt-3">
        <ScoreConversationButton
          conversationId={id}
          initialRubric={initialRubric}
        />
      </div>
      <ConversationThread
        conversationId={id}
        initialMessages={messages ?? []}
        contact={{
          name: conversation.contact?.name ?? null,
          email: conversation.contact?.email ?? null,
        }}
        channel={conversation.channel_type}
        isAiEnabled={conversation.is_ai_active}
      />
    </div>
  );
}
