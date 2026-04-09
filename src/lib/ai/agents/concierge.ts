import { callClaude, extractToolUse } from "../claude-client";
import { getConciergeSystemPrompt } from "../prompts/concierge-system";
import type Anthropic from "@anthropic-ai/sdk";

export interface ConciergeDecision {
  intent: string;
  sentiment: "positive" | "neutral" | "negative";
  urgency: "low" | "medium" | "high";
  routing: "knowledge" | "action" | "direct_response" | "human_handoff";
  directResponse?: string;
  reasoning: string;
}

const classifyTool: Anthropic.Tool = {
  name: "classify_message",
  description: "Classify the incoming message by intent, sentiment, urgency, and routing.",
  input_schema: {
    type: "object" as const,
    properties: {
      intent: {
        type: "string",
        enum: ["booking_inquiry", "pricing_question", "general_info", "complaint", "opt_out", "spam", "greeting", "follow_up"],
      },
      sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
      urgency: { type: "string", enum: ["low", "medium", "high"] },
      routing: { type: "string", enum: ["knowledge", "action", "direct_response", "human_handoff"] },
      direct_response: {
        type: "string",
        description: "If routing is 'direct_response', provide the response text here.",
      },
      reasoning: {
        type: "string",
        description: "Brief explanation of why you classified it this way.",
      },
    },
    required: ["intent", "sentiment", "urgency", "routing", "reasoning"],
  },
};

export async function runConcierge(
  messages: Anthropic.MessageParam[],
  businessName: string,
  businessType: string,
  model?: string
): Promise<{ decision: ConciergeDecision; inputTokens: number; outputTokens: number; latencyMs: number }> {
  const result = await callClaude({
    systemPrompt: getConciergeSystemPrompt(businessName, businessType),
    messages,
    tools: [classifyTool],
    model,
    maxTokens: 512,
  });

  const toolUse = extractToolUse(result.response);

  if (toolUse && toolUse.name === "classify_message") {
    const input = toolUse.input as Record<string, unknown>;

    const validSentiments = ["positive", "neutral", "negative"] as const;
    const validUrgencies = ["low", "medium", "high"] as const;
    const validRoutings = ["knowledge", "action", "direct_response", "human_handoff"] as const;

    const sentiment = validSentiments.includes(String(input.sentiment) as typeof validSentiments[number])
      ? (String(input.sentiment) as ConciergeDecision["sentiment"])
      : "neutral";
    const urgency = validUrgencies.includes(String(input.urgency) as typeof validUrgencies[number])
      ? (String(input.urgency) as ConciergeDecision["urgency"])
      : "medium";
    const routing = validRoutings.includes(String(input.routing) as typeof validRoutings[number])
      ? (String(input.routing) as ConciergeDecision["routing"])
      : "knowledge";

    return {
      decision: {
        intent: String(input.intent ?? "general_info"),
        sentiment,
        urgency,
        routing,
        directResponse: input.direct_response ? String(input.direct_response) : undefined,
        reasoning: String(input.reasoning ?? ""),
      },
      inputTokens: result.inputTokens,
      outputTokens: result.outputTokens,
      latencyMs: result.latencyMs,
    };
  }

  // Fallback if tool wasn't used
  return {
    decision: {
      intent: "general_info",
      sentiment: "neutral",
      urgency: "medium",
      routing: "knowledge",
      reasoning: "Could not classify — defaulting to knowledge agent.",
    },
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    latencyMs: result.latencyMs,
  };
}
