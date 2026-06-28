import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { callClaude, extractToolUse } from "@/lib/ai/claude-client";
import { z } from "zod";
import type Anthropic from "@anthropic-ai/sdk";

const bodySchema = z.object({
  conversation_id: z.string().uuid(),
});

const scoreTool: Anthropic.Tool = {
  name: "score_conversation",
  description: "Score a finished conversation against the quality rubric.",
  input_schema: {
    type: "object" as const,
    properties: {
      resolved: { type: "boolean", description: "Was the contact's question or need addressed?" },
      booked: { type: "boolean", description: "Did the contact book/schedule something?" },
      escalated: { type: "boolean", description: "Was the conversation handed off to a human?" },
      sentiment_final: {
        type: "string",
        enum: ["positive", "neutral", "negative"],
        description: "Sentiment of the contact's last few messages.",
      },
      quality_score: {
        type: "integer",
        minimum: 1,
        maximum: 5,
        description: "Overall AI handling quality. 5=excellent, 1=poor.",
      },
      notes: {
        type: "string",
        description: "1-2 sentences explaining the score and any specific issues.",
      },
    },
    required: ["resolved", "booked", "escalated", "sentiment_final", "quality_score", "notes"],
  },
};

interface QualityRubric {
  resolved: boolean;
  booked: boolean;
  escalated: boolean;
  sentiment_final: "positive" | "neutral" | "negative";
  quality_score: number;
  notes: string;
  scored_at: string;
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

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { conversation_id } = parsed.data;

  const supabase = await createServerClient();

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("id, user_id, channel_type, status, intent, sentiment, summary, metadata, is_ai_active, ai_handoff_reason")
    .eq("id", conversation_id)
    .eq("user_id", ctx.ownerId)
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const { data: messages, error: msgError } = await supabase
    .from("messages")
    .select("direction, sender_type, content, created_at")
    .eq("conversation_id", conversation_id)
    .eq("user_id", ctx.ownerId)
    .order("created_at", { ascending: true })
    .limit(100);

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  const transcript = (messages ?? [])
    .map((m) => {
      const who = m.direction === "inbound" ? "Contact" : (m.sender_type === "ai" ? "AI" : "Human");
      return `${who}: ${m.content ?? "(no content)"}`;
    })
    .join("\n");

  const systemPrompt = `You are a quality auditor for a sales/support AI assistant.
Read the full conversation and score it against the rubric using the score_conversation tool.
Be honest and specific. Reserve quality_score=5 for genuinely excellent handling and 1 for clear failures.`;

  const userMessage = `Conversation channel: ${conversation.channel_type}
Stored intent: ${conversation.intent ?? "unknown"}
Stored sentiment: ${conversation.sentiment ?? "unknown"}
AI was active: ${conversation.is_ai_active}
AI handoff reason (if any): ${conversation.ai_handoff_reason ?? "—"}

Transcript:
${transcript || "(no messages)"}

Score this conversation now.`;

  let rubric: Omit<QualityRubric, "scored_at">;
  try {
    const result = await callClaude({
      systemPrompt,
      messages: [{ role: "user", content: userMessage }],
      tools: [scoreTool],
      maxTokens: 600,
      temperature: 0.2,
    });

    const toolUse = extractToolUse(result.response);
    if (!toolUse || toolUse.name !== "score_conversation") {
      return NextResponse.json({ error: "AI did not return a score" }, { status: 502 });
    }

    const input = toolUse.input as Record<string, unknown>;
    const validSentiments = ["positive", "neutral", "negative"] as const;
    const sentimentFinal = validSentiments.includes(String(input.sentiment_final) as typeof validSentiments[number])
      ? (String(input.sentiment_final) as QualityRubric["sentiment_final"])
      : "neutral";

    let qScore = Number(input.quality_score);
    if (!Number.isFinite(qScore)) qScore = 3;
    qScore = Math.max(1, Math.min(5, Math.round(qScore)));

    rubric = {
      resolved: Boolean(input.resolved),
      booked: Boolean(input.booked),
      escalated: Boolean(input.escalated),
      sentiment_final: sentimentFinal,
      quality_score: qScore,
      notes: typeof input.notes === "string" ? input.notes : "",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI call failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const fullRubric: QualityRubric = { ...rubric, scored_at: new Date().toISOString() };

  // Merge into conversation.metadata.quality_rubric
  const existingMetadata = (conversation.metadata as Record<string, unknown> | null) ?? {};
  const newMetadata = { ...existingMetadata, quality_rubric: fullRubric };

  const { error: updateError } = await supabase
    .from("conversations")
    .update({ metadata: newMetadata })
    .eq("id", conversation_id)
    .eq("user_id", ctx.ownerId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ data: fullRubric });
}
