import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { callClaude, extractTextContent } from "@/lib/ai/claude-client";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";

const suggestionSchema = z.object({
  conversation_id: z.string().uuid(),
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
    input = suggestionSchema.parse(body);
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

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, business_type")
    .eq("user_id", user.id)
    .single();

  // Get recent messages
  const { data: recentMessages } = await supabase
    .from("messages")
    .select("direction, sender_type, content")
    .eq("conversation_id", input.conversation_id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(20);

  const claudeMessages: Anthropic.MessageParam[] = (recentMessages ?? []).map((msg) => ({
    role: (msg.direction === "inbound" ? "user" : "assistant") as "user" | "assistant",
    content: msg.content ?? "",
  }));

  const result = await callClaude({
    systemPrompt: `You are a ghostwriter for "${profile?.business_name ?? "the business"}".
Write a suggested reply that the business owner can send.
Keep it warm, professional, and under 150 words.
Write ONLY the reply text, nothing else.`,
    messages: claudeMessages,
    maxTokens: 512,
  });

  return NextResponse.json({
    data: {
      suggestion: extractTextContent(result.response),
      tokens: result.inputTokens + result.outputTokens,
    },
  });
}
