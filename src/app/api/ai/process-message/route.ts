import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { processInboundMessage } from "@/lib/ai/orchestrator";
import { z } from "zod";

const processSchema = z.object({
  conversation_id: z.string().uuid(),
  message_content: z.string().min(1).max(10000),
});

export async function POST(request: NextRequest) {
  const user = await getUser();
  const supabase = await createServerClient();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let input;
  try {
    input = processSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Get conversation with contact
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("*, contact:contacts(*)")
    .eq("id", input.conversation_id)
    .eq("user_id", user.id)
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  if (!conversation.is_ai_active) {
    return NextResponse.json({ error: "AI is not active for this conversation" }, { status: 400 });
  }

  // Get profile for business info
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, business_type")
    .eq("user_id", user.id)
    .single();

  // Get recent conversation history
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("direction, sender_type, content")
    .eq("conversation_id", input.conversation_id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(20);

  const history = (recentMessages ?? []).map((msg) => ({
    role: msg.direction === "inbound" ? "contact" : "assistant",
    content: msg.content ?? "",
  }));

  // Check if this is the first message
  const isFirstMessage = !recentMessages || recentMessages.length === 0;

  // Run AI pipeline
  const result = await processInboundMessage({
    inboundContent: input.message_content,
    conversationId: input.conversation_id,
    contactId: conversation.contact_id,
    userId: user.id,
    channelType: conversation.channel_type,
    conversationHistory: history,
    businessName: profile?.business_name ?? "Our Business",
    businessType: profile?.business_type ?? "service business",
    isFirstMessage,
    supabase,
  });

  // Store the AI response as a message if it should be sent
  if (result.shouldSend) {
    const { error: insertError } = await supabase.from("messages").insert({
      user_id: user.id,
      conversation_id: input.conversation_id,
      contact_id: conversation.contact_id,
      direction: "outbound",
      sender_type: "ai",
      content: result.responseContent,
      content_type: "text",
      channel_type: conversation.channel_type,
      ai_model: "claude-sonnet-4-20250514",
      ai_tokens_used: result.totalInputTokens + result.totalOutputTokens,
    });

    if (insertError) {
      console.error("[AI Process] Failed to store AI message:", insertError);
    }
  }

  return NextResponse.json({
    data: {
      response: result.responseContent,
      intent: result.intent,
      sentiment: result.sentiment,
      isOptOut: result.isOptOut,
      toolsCalled: result.toolsCalled.length,
      tokens: result.totalInputTokens + result.totalOutputTokens,
      latencyMs: result.totalLatencyMs,
    },
  });
}
