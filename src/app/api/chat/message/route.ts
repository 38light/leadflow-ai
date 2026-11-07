import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { processInboundMessage } from "@/lib/ai/orchestrator";
import { rateLimitChatMessage, rateLimitByIp, rateLimitBusinessAI } from "@/lib/rate-limit/chat";
import { getChatSession, hashSessionToken, publicReply, sessionCredentialsSchema } from "@/lib/chat/session";
import { isOptOutMessage } from "@/lib/ai/prompts/response-rules";

const messageSchema = sessionCredentialsSchema.extend({
  clientMessageId: z.string().uuid(),
  content: z.string().trim().min(1).max(5000),
  senderName: z.string().trim().max(100).optional(),
  senderEmail: z.string().email().max(254).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = messageSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid chat message" }, { status: 400 });
    const { sessionId, businessId, clientMessageId, content, senderName, senderEmail } = parsed.data;
    const [ipRate, sessionRate] = await Promise.all([
      rateLimitByIp(request, "chat:msg:ip", 60, 60),
      rateLimitChatMessage(hashSessionToken(sessionId)),
    ]);
    if (!ipRate.allowed || !sessionRate.allowed) return NextResponse.json({ error: "Message limit reached. Please wait." }, { status: 429 });
    const supabase = createAdminClient();
    const session = await getChatSession(supabase, businessId, sessionId);
    if (!session) return NextResponse.json({ error: "Chat session expired. Start a new chat." }, { status: 401 });
    const { data: profile, error: profileError } = await supabase.from("profiles")
      .select("business_name, business_type, ai_enabled").eq("user_id", businessId).single();
    if (profileError || !profile) throw profileError ?? new Error("Business unavailable");
    const { data: accepted, error: acceptError } = await supabase.rpc("receive_web_chat_message", {
      p_owner_id: businessId, p_token_hash: hashSessionToken(sessionId), p_request_id: clientMessageId,
      p_content: content, p_name: senderName ?? null, p_email: senderEmail ?? null,
    });
    if (acceptError || !accepted) throw acceptError ?? new Error("Message not accepted");
    const receipt = { messageId: accepted.message_id as string, clientMessageId, accepted: true };
    // A retry acknowledges the original message; it never calls the AI twice.
    const isOptOut = isOptOutMessage(content);
    if (accepted.duplicate || ((!accepted.is_ai_active || !profile.ai_enabled) && !isOptOut)) {
      return NextResponse.json({ data: { ...receipt, status: "awaiting_reply" } }, { headers: { "Cache-Control": "no-store" } });
    }
    // The message is durable. AI failures leave it available for a human.
    try {
      if (!isOptOut && !(await rateLimitBusinessAI(businessId)).allowed) {
        throw new Error("Business AI quota unavailable or exhausted");
      }
      const { data: contact, error: contactError } = await supabase.from("contacts")
        .select("opted_out").eq("id", accepted.contact_id).eq("user_id", businessId).single();
      if (contactError) throw contactError;
      if (contact?.opted_out && !isOptOut) return NextResponse.json({ data: { ...receipt, status: "awaiting_reply" } }, { headers: { "Cache-Control": "no-store" } });
      const { data: rows, error: historyError } = await supabase.from("messages")
        .select("id, direction, content, created_at")
        .eq("conversation_id", accepted.conversation_id).eq("user_id", businessId)
        .order("created_at", { ascending: false }).order("id", { ascending: false }).limit(21);
      if (historyError) throw historyError;
      const history = (rows ?? []).filter(row => row.id !== accepted.message_id).reverse()
        .map(row => ({ role: row.direction === "inbound" ? "inbound" : "assistant", content: row.content ?? "" }));
      const result = await processInboundMessage({
        inboundContent: content, conversationId: accepted.conversation_id, contactId: accepted.contact_id,
        userId: businessId, channelType: "web_chat", conversationHistory: history,
        businessName: profile.business_name ?? "Business", businessType: profile.business_type ?? "general",
        isFirstMessage: accepted.is_first_message, supabase,
      });
      const reply = publicReply(result);
      let published = false;
      if (reply) {
        const { data, error } = await supabase.rpc("publish_web_chat_ai_reply", {
          p_owner_id: businessId, p_conversation_id: accepted.conversation_id,
          p_inbound_id: accepted.message_id, p_content: reply, p_is_opt_out: result.isOptOut,
        });
        if (error) throw error;
        published = data === true;
      }
      return NextResponse.json({ data: { ...receipt, status: published ? "replied" : "awaiting_reply" } }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
      console.error("[Chat AI] Accepted message needs human reply", error);
      const { error: handoffError } = await supabase.from("conversations").update({
        is_ai_active: false, ai_handoff_reason: "Automatic reply unavailable. A team member needs to reply.",
        handoff_at: new Date().toISOString(),
      }).eq("id", accepted.conversation_id).eq("user_id", businessId);
      if (handoffError) console.error("[Chat AI] Could not record handoff", handoffError);
      return NextResponse.json({ data: { ...receipt, status: "awaiting_reply" } }, { status: 202, headers: { "Cache-Control": "no-store" } });
    }
  } catch (error) {
    console.error("[Chat Message]", error);
    return NextResponse.json({ error: "Unable to send message. You can retry safely." }, { status: 500 });
  }
}
