import type { SupabaseClient } from "@supabase/supabase-js";
import type Anthropic from "@anthropic-ai/sdk";
import { runConcierge } from "./agents/concierge";
import { runKnowledgeAgent } from "./agents/knowledge";
import { runActionAgent } from "./agents/action";
import { composeResponse } from "./response";
import { executeTool, type ToolContext } from "./tools";
import { isOptOutMessage, getOptOutResponse } from "./prompts/response-rules";

export interface ProcessMessageParams {
  inboundContent: string;
  conversationId: string;
  contactId: string;
  userId: string;
  channelType: string;
  conversationHistory: Array<{ role: string; content: string }>;
  businessName: string;
  businessType: string;
  isFirstMessage: boolean;
  supabase: SupabaseClient;
  model?: string;
}

export interface ProcessMessageResult {
  responseContent: string;
  shouldSend: boolean;
  isOptOut: boolean;
  intent: string;
  sentiment: string;
  toolsCalled: Array<{ toolName: string; toolInput: Record<string, unknown>; result: unknown }>;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalLatencyMs: number;
}

export async function processInboundMessage(params: ProcessMessageParams): Promise<ProcessMessageResult> {
  const {
    inboundContent, conversationId, contactId, userId,
    conversationHistory, businessName, businessType,
    isFirstMessage, supabase, model,
  } = params;

  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalLatencyMs = 0;

  // Quick check: opt-out?
  if (isOptOutMessage(inboundContent)) {
    const { error: optOutError } = await supabase
      .from("contacts")
      .update({ opted_out: true, opt_out_at: new Date().toISOString() })
      .eq("id", contactId)
      .eq("user_id", userId);

    if (optOutError) {
      console.error("[Orchestrator] Failed to mark contact as opted out:", optOutError);
    }

    return {
      responseContent: getOptOutResponse(),
      shouldSend: true,
      isOptOut: true,
      intent: "opt_out",
      sentiment: "neutral",
      toolsCalled: [],
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalLatencyMs: 0,
    };
  }

  // Build Claude message history
  const claudeMessages: Anthropic.MessageParam[] = conversationHistory.map((msg) => ({
    role: msg.role === "inbound" || msg.role === "contact" ? "user" as const : "assistant" as const,
    content: msg.content,
  }));

  // Add the current inbound message
  claudeMessages.push({ role: "user", content: inboundContent });

  // Step 1: Concierge — classify intent, sentiment, routing
  const conciergeResult = await runConcierge(claudeMessages, businessName, businessType, model);
  const { decision } = conciergeResult;
  totalInputTokens += conciergeResult.inputTokens;
  totalOutputTokens += conciergeResult.outputTokens;
  totalLatencyMs += conciergeResult.latencyMs;

  // Update conversation with classification (non-blocking — log error but don't fail)
  const { error: classifyError } = await supabase
    .from("conversations")
    .update({ sentiment: decision.sentiment, intent: decision.intent })
    .eq("id", conversationId)
    .eq("user_id", userId);

  if (classifyError) {
    console.error("[Orchestrator] Failed to update conversation classification:", classifyError);
  }

  let responseText = "";
  const toolsCalled: ProcessMessageResult["toolsCalled"] = [];

  // Step 2: Route to appropriate agent
  switch (decision.routing) {
    case "direct_response": {
      responseText = decision.directResponse ?? "Thanks for reaching out! How can I help you?";
      break;
    }

    case "knowledge": {
      // TODO: Implement vector search when documents are uploaded
      const knowledgeResult = await runKnowledgeAgent(
        claudeMessages,
        [], // No chunks yet — will be populated when embeddings are ready
        businessName,
        model
      );
      responseText = knowledgeResult.response;
      totalInputTokens += knowledgeResult.inputTokens;
      totalOutputTokens += knowledgeResult.outputTokens;
      totalLatencyMs += knowledgeResult.latencyMs;
      break;
    }

    case "action": {
      const toolContext: ToolContext = {
        userId,
        contactId,
        conversationId,
        supabase,
      };

      const actionResult = await runActionAgent(
        claudeMessages,
        businessName,
        (toolName, toolInput) => executeTool(toolName, toolInput, toolContext),
        model
      );
      responseText = actionResult.response;
      toolsCalled.push(...actionResult.toolCalls);
      totalInputTokens += actionResult.totalInputTokens;
      totalOutputTokens += actionResult.totalOutputTokens;
      totalLatencyMs += actionResult.totalLatencyMs;
      break;
    }

    case "human_handoff": {
      // Escalate to human
      const { error: handoffError } = await supabase
        .from("conversations")
        .update({
          is_ai_active: false,
          ai_handoff_reason: decision.reasoning,
          handoff_at: new Date().toISOString(),
        })
        .eq("id", conversationId)
        .eq("user_id", userId);

      if (handoffError) {
        console.error("[Orchestrator] Failed to escalate conversation:", handoffError);
      }

      responseText = "I'm connecting you with a team member who can help further. They'll be with you shortly!";
      break;
    }
  }

  // Step 3: Compose final response with compliance
  const composed = composeResponse({
    responseText,
    businessName,
    isFirstMessage,
    inboundContent,
  });

  // Log AI interaction (non-blocking)
  const { error: logError } = await supabase.from("ai_interaction_logs").insert({
    user_id: userId,
    conversation_id: conversationId,
    agent_type: decision.routing,
    input_tokens: totalInputTokens,
    output_tokens: totalOutputTokens,
    model: model ?? "claude-sonnet-4-20250514",
    latency_ms: totalLatencyMs,
    tools_called: toolsCalled,
    reasoning: decision.reasoning,
  });

  if (logError) {
    console.error("[Orchestrator] Failed to log AI interaction:", logError);
  }

  return {
    responseContent: composed.content,
    shouldSend: composed.shouldSend,
    isOptOut: composed.isOptOut,
    intent: decision.intent,
    sentiment: decision.sentiment,
    toolsCalled,
    totalInputTokens,
    totalOutputTokens,
    totalLatencyMs,
  };
}
