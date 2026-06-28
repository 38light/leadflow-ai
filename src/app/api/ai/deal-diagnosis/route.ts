import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { callClaude, extractTextContent } from "@/lib/ai/claude-client";
import { z } from "zod";

const bodySchema = z.object({
  contactId: z.string().uuid(),
});

function daysSince(dateStr: string | null | undefined): number {
  if (!dateStr) return -1;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export async function POST(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let input;
  try {
    input = bodySchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = await createServerClient();

  // 1. Fetch contact
  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select(
      "id, name, status, temperature, last_interaction_at, metadata, score, created_at, updated_at"
    )
    .eq("id", input.contactId)
    .eq("user_id", ctx.ownerId)
    .single();

  if (contactError || !contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  // 2. Fetch most recent conversation
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, status, sentiment, created_at, last_message_at")
    .eq("contact_id", input.contactId)
    .eq("user_id", ctx.ownerId)
    .order("last_message_at", { ascending: false })
    .limit(1);

  const latestConversation = conversations?.[0] ?? null;

  // 3. Fetch last 10 messages from that conversation
  let recentMessages: Array<{ direction: string; content: string | null; created_at: string }> = [];
  if (latestConversation) {
    const { data: messages } = await supabase
      .from("messages")
      .select("direction, content, created_at")
      .eq("conversation_id", latestConversation.id)
      .eq("user_id", ctx.ownerId)
      .order("created_at", { ascending: false })
      .limit(10);

    recentMessages = (messages ?? []).reverse();
  }

  // 4. Fetch total conversation count
  const { count: conversationCount } = await supabase
    .from("conversations")
    .select("id", { count: "exact", head: true })
    .eq("contact_id", input.contactId)
    .eq("user_id", ctx.ownerId);

  const daysInStage = daysSince(contact.updated_at);
  const lastContactDays = daysSince(contact.last_interaction_at);
  const sentiment = latestConversation?.sentiment ?? "unknown";
  const totalConversations = conversationCount ?? 0;

  const messagesText =
    recentMessages.length > 0
      ? recentMessages
          .map((m) => `[${m.direction}] ${m.content ?? "(no content)"}`)
          .join("\n")
      : "No messages found.";

  const systemPrompt = `You are a sales coach AI analyzing stalled deals in a CRM.
Your job is to diagnose why deals may be stalling and provide specific, actionable recommendations.
Be direct, practical, and concise. Focus on what the sales rep should do next.`;

  const userMessage = `This lead has been in the "${contact.status}" stage for approximately ${daysInStage} day${daysInStage !== 1 ? "s" : ""}.
Last contact: ${lastContactDays >= 0 ? `${lastContactDays} day${lastContactDays !== 1 ? "s" : ""} ago` : "unknown"}.
Sentiment from last conversation: ${sentiment}.
Total conversations: ${totalConversations}.
Lead temperature: ${contact.temperature ?? "unknown"}.
Lead score: ${contact.score ?? "unscored"}.

Recent messages:
${messagesText}

Diagnose why this deal might be stalling and give 3 specific, actionable recommendations.
Format your response as:

DIAGNOSIS:
[Your diagnosis in 2-3 sentences]

RECOMMENDATIONS:
1. [First recommendation]
2. [Second recommendation]
3. [Third recommendation]`;

  // 5. Call Claude
  let diagnosis: string;
  try {
    const result = await callClaude({
      systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      maxTokens: 600,
      temperature: 0.4,
    });
    diagnosis = extractTextContent(result.response);
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI call failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      diagnosis,
      daysInStage,
      lastContactDays,
    },
  });
}
