import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { findOrCreateContact } from "@/lib/contacts/find-or-create";
import { findOrCreateWebChatConversation } from "@/lib/conversations/find-or-create";
import { processInboundMessage } from "@/lib/ai/orchestrator";
import { rateLimitChatMessage } from "@/lib/rate-limit/chat";

/**
 * POST /api/chat/message
 *
 * PUBLIC endpoint — no auth required.
 * Receives a message from the web chat widget, processes it through the
 * AI orchestrator, persists both the inbound and outbound messages, and
 * returns the AI response.
 *
 * Rate limited via Upstash: 30 messages/session/minute (degrades to allow-all when env vars absent).
 */

const messageSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  content: z.string().min(1, "content is required").max(5000, "content must be under 5000 characters"),
  businessId: z.string().min(1, "businessId is required"),
  senderName: z.string().max(100).optional(),
  senderEmail: z.string().email().optional(),
  senderPhone: z.string().max(30).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { sessionId, content, businessId, senderName, senderEmail, senderPhone } = parsed.data;

    const rl = await rateLimitChatMessage(sessionId);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Message limit reached. Please wait before sending more messages." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(0, rl.reset - Math.floor(Date.now() / 1000))) },
        }
      );
    }

    const supabase = createAdminClient();

    // 1. Verify business exists and fetch profile info for AI context
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, business_name, business_type")
      .eq("id", businessId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    // 2. Find or create contact — deduplicates across channels by phone/email
    const { contactId, isNew: isNewContact } = await findOrCreateContact({
      userId: businessId,
      supabase,
      name: senderName,
      email: senderEmail,
      phone: senderPhone,
      sourceChannel: "web_chat",
      externalId: sessionId,
    });

    // 3. Mark contact temperature as warm on inbound message
    if (!isNewContact) {
      await supabase
        .from("contacts")
        .update({ temperature: "warm" })
        .eq("id", contactId)
        .eq("temperature", "cold");
    }

    // 4. Find or create conversation for this session
    const { conversationId, isNew: isNewConversation } = await findOrCreateWebChatConversation({
      userId: businessId,
      contactId,
      sessionId,
      supabase,
    });

    const now = new Date().toISOString();

    // 5. Persist inbound message
    await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: businessId,
      contact_id: contactId,
      channel_type: "web_chat",
      direction: "inbound",
      sender_type: "contact",
      content,
      content_type: "text",
      created_at: now,
    });

    // 6. Update conversation last_message_at
    await supabase
      .from("conversations")
      .update({ last_message_at: now })
      .eq("id", conversationId);

    // 7. Fetch recent conversation history for AI context
    const { data: historyRows } = await supabase
      .from("messages")
      .select("direction, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    // Exclude the message we just inserted (orchestrator appends current inbound itself)
    const conversationHistory = (historyRows ?? [])
      .slice(0, -1)
      .map((m) => ({
        role: m.direction === "inbound" ? "inbound" : "assistant",
        content: m.content as string,
      }));

    // 8. Process through AI orchestrator
    const aiResult = await processInboundMessage({
      inboundContent: content,
      conversationId,
      contactId,
      userId: businessId,
      channelType: "web_chat",
      conversationHistory,
      businessName: profile.business_name ?? "Business",
      businessType: (profile.business_type as string) ?? "general",
      isFirstMessage: isNewConversation,
      supabase,
    });

    // 9. Persist AI outbound message
    if (aiResult.shouldSend) {
      const outboundNow = new Date().toISOString();
      await supabase.from("messages").insert({
        conversation_id: conversationId,
        user_id: businessId,
        contact_id: contactId,
        channel_type: "web_chat",
        direction: "outbound",
        sender_type: "ai",
        content: aiResult.responseContent,
        content_type: "text",
        ai_model: "claude-sonnet-4-20250514",
        ai_confidence: 0.9,
        ai_tokens_used: aiResult.totalInputTokens + aiResult.totalOutputTokens,
        created_at: outboundNow,
      });

      await supabase
        .from("conversations")
        .update({ last_message_at: outboundNow })
        .eq("id", conversationId);
    }

    return NextResponse.json({
      data: {
        message: aiResult.responseContent,
        sessionId,
        isOptOut: aiResult.isOptOut,
      },
    });
  } catch (error) {
    console.error("[Chat Message] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
