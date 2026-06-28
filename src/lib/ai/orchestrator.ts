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
  language: string;
  confidence: number;
  queuedForApproval: boolean;
  approvalId: string | null;
  toolsCalled: Array<{ toolName: string; toolInput: Record<string, unknown>; result: unknown }>;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalLatencyMs: number;
}

interface ProfileQualityFields {
  ai_confidence_threshold: number | null;
  require_approval: boolean | null;
  ai_memory_depth: number | null;
  default_language: string | null;
}

async function loadProfileQualitySettings(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileQualityFields> {
  const { data } = await supabase
    .from("profiles")
    .select("ai_confidence_threshold, require_approval, ai_memory_depth, default_language")
    .eq("user_id", userId)
    .single();

  const profile = (data ?? null) as ProfileQualityFields | null;
  return {
    ai_confidence_threshold: profile?.ai_confidence_threshold ?? 0,
    require_approval: profile?.require_approval ?? false,
    ai_memory_depth: profile?.ai_memory_depth ?? 3,
    default_language: profile?.default_language ?? "en",
  };
}

async function buildPriorContext(
  supabase: SupabaseClient,
  userId: string,
  contactId: string,
  currentConversationId: string,
  depth: number
): Promise<string | null> {
  if (!depth || depth <= 0) return null;

  const { data: priorConversations } = await supabase
    .from("conversations")
    .select("id, summary, sentiment, intent, status, last_message_at, created_at")
    .eq("user_id", userId)
    .eq("contact_id", contactId)
    .neq("id", currentConversationId)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .limit(depth);

  const rows = (priorConversations ?? []) as Array<{
    id: string;
    summary: string | null;
    sentiment: string | null;
    intent: string | null;
    status: string | null;
    last_message_at: string | null;
    created_at: string;
  }>;

  if (rows.length === 0) return null;

  // Get message counts for each prior conversation in one round trip is non-trivial here;
  // do per-conversation count queries (depth is small — defaults to 3, max 10).
  const summaries: string[] = [];
  for (let i = 0; i < rows.length; i++) {
    const c = rows[i];
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", c.id)
      .eq("user_id", userId);

    const dateStr = c.last_message_at ?? c.created_at;
    const when = dateStr ? new Date(dateStr).toISOString().slice(0, 10) : "unknown";
    const summaryText = c.summary && c.summary.trim().length > 0
      ? c.summary.trim()
      : "(no summary recorded)";

    summaries.push(
      `${i + 1}. [${when}] ${count ?? 0} msg, intent=${c.intent ?? "?"}, sentiment=${c.sentiment ?? "?"}, outcome=${c.status ?? "?"}\n   ${summaryText}`
    );
  }

  return summaries.join("\n");
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
      language: "en",
      confidence: 1,
      queuedForApproval: false,
      approvalId: null,
      toolsCalled: [],
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalLatencyMs: 0,
    };
  }

  // Load AI quality settings + prior conversation context for this contact
  const qualitySettings = await loadProfileQualitySettings(supabase, userId);
  const priorContext = await buildPriorContext(
    supabase,
    userId,
    contactId,
    conversationId,
    qualitySettings.ai_memory_depth ?? 3
  );

  // Build Claude message history
  const claudeMessages: Anthropic.MessageParam[] = conversationHistory.map((msg) => ({
    role: msg.role === "inbound" || msg.role === "contact" ? "user" as const : "assistant" as const,
    content: msg.content,
  }));

  // Add the current inbound message
  claudeMessages.push({ role: "user", content: inboundContent });

  // Step 1: Concierge — classify intent, sentiment, language, confidence, routing
  const conciergeResult = await runConcierge(
    claudeMessages,
    businessName,
    businessType,
    model,
    {
      priorContext,
      defaultLanguage: qualitySettings.default_language,
    }
  );
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

  // Determine whether the draft must be queued for human approval
  const threshold = qualitySettings.ai_confidence_threshold ?? 0;
  const requireApproval = qualitySettings.require_approval === true;
  const belowThreshold = decision.confidence < threshold;
  const needsApproval =
    !composed.isOptOut &&
    decision.routing !== "human_handoff" &&
    (requireApproval || belowThreshold);

  let approvalId: string | null = null;
  let shouldSend = composed.shouldSend;

  if (needsApproval) {
    const { data: approvalRow, error: approvalError } = await supabase
      .from("ai_approvals")
      .insert({
        user_id: userId,
        conversation_id: conversationId,
        contact_id: contactId,
        draft_content: composed.content,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
        status: "pending",
      })
      .select("id")
      .single();

    if (approvalError) {
      console.error("[Orchestrator] Failed to create approval record:", approvalError);
    } else if (approvalRow) {
      approvalId = (approvalRow as { id: string }).id;
    }

    shouldSend = false;
  }

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
    shouldSend,
    isOptOut: composed.isOptOut,
    intent: decision.intent,
    sentiment: decision.sentiment,
    language: decision.language,
    confidence: decision.confidence,
    queuedForApproval: needsApproval,
    approvalId,
    toolsCalled,
    totalInputTokens,
    totalOutputTokens,
    totalLatencyMs,
  };
}
