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
  language: string;
  confidence: number;
}

export interface RunConciergeOptions {
  priorContext?: string | null;
  defaultLanguage?: string | null;
}

const classifyTool: Anthropic.Tool = {
  name: "classify_message",
  description: "Classify the incoming message by intent, sentiment, urgency, language, confidence, and routing.",
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
        description: "If routing is 'direct_response', provide the response text here, in the contact's detected language.",
      },
      reasoning: {
        type: "string",
        description: "Brief explanation of why you classified it this way.",
      },
      language: {
        type: "string",
        description: "ISO 639-1 code of the contact's message language (e.g. 'en', 'es', 'fr'). Lowercase.",
      },
      confidence: {
        type: "number",
        description: "0.0-1.0 confidence in the classification and any directResponse provided.",
        minimum: 0,
        maximum: 1,
      },
    },
    required: ["intent", "sentiment", "urgency", "routing", "reasoning", "language", "confidence"],
  },
};

function clampConfidence(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 0.5;
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

function normalizeLanguage(value: unknown, fallback: string): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length < 2 || trimmed.length > 8) return fallback;
  return trimmed;
}

export async function runConcierge(
  messages: Anthropic.MessageParam[],
  businessName: string,
  businessType: string,
  model?: string,
  options: RunConciergeOptions = {}
): Promise<{ decision: ConciergeDecision; inputTokens: number; outputTokens: number; latencyMs: number }> {
  const fallbackLang = options.defaultLanguage ?? "en";

  const result = await callClaude({
    systemPrompt: getConciergeSystemPrompt(businessName, businessType, {
      priorContext: options.priorContext,
      defaultLanguage: options.defaultLanguage,
    }),
    messages,
    tools: [classifyTool],
    model,
    maxTokens: 600,
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
        language: normalizeLanguage(input.language, fallbackLang),
        confidence: clampConfidence(input.confidence),
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
      language: fallbackLang,
      confidence: 0.3,
    },
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    latencyMs: result.latencyMs,
  };
}
