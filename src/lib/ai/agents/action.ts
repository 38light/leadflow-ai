import { callClaude, extractTextContent, extractToolUse } from "../claude-client";
import { getActionSystemPrompt } from "../prompts/action-system";
import type Anthropic from "@anthropic-ai/sdk";

const actionTools: Anthropic.Tool[] = [
  {
    name: "check_calendar",
    description: "Check calendar availability for a specific date.",
    input_schema: {
      type: "object" as const,
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format" },
      },
      required: ["date"],
    },
  },
  {
    name: "book_appointment",
    description: "Book an appointment at a specific date and time.",
    input_schema: {
      type: "object" as const,
      properties: {
        date: { type: "string" },
        start_time: { type: "string", description: "Start time in HH:MM format" },
        title: { type: "string" },
        contact_name: { type: "string" },
      },
      required: ["date", "start_time", "title", "contact_name"],
    },
  },
  {
    name: "generate_payment_link",
    description: "Generate a Stripe payment link for a deposit or payment.",
    input_schema: {
      type: "object" as const,
      properties: {
        amount_aud: { type: "number", description: "Amount in AUD (e.g. 200 for $200)" },
        description: { type: "string" },
        contact_name: { type: "string" },
      },
      required: ["amount_aud", "description", "contact_name"],
    },
  },
  {
    name: "update_contact",
    description: "Update contact metadata with newly learned information.",
    input_schema: {
      type: "object" as const,
      properties: {
        field: { type: "string", description: "The field to update (e.g. wedding_date, venue, partner_names)" },
        value: { type: "string" },
      },
      required: ["field", "value"],
    },
  },
  {
    name: "search_knowledge",
    description: "Search the business knowledge base for information.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
  },
  {
    name: "escalate_to_human",
    description: "Escalate the conversation to a human operator.",
    input_schema: {
      type: "object" as const,
      properties: {
        reason: { type: "string" },
      },
      required: ["reason"],
    },
  },
];

export interface ToolCallResult {
  toolName: string;
  toolInput: Record<string, unknown>;
  result: unknown;
}

export interface ActionAgentResult {
  response: string;
  toolCalls: ToolCallResult[];
  totalInputTokens: number;
  totalOutputTokens: number;
  totalLatencyMs: number;
}

export async function runActionAgent(
  messages: Anthropic.MessageParam[],
  businessName: string,
  executeToolFn: (toolName: string, toolInput: Record<string, unknown>) => Promise<unknown>,
  model?: string,
  maxIterations = 5
): Promise<ActionAgentResult> {
  const toolCalls: ToolCallResult[] = [];
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalLatencyMs = 0;

  // Build conversation with tool results in a loop
  const agentMessages: Anthropic.MessageParam[] = [...messages];

  for (let i = 0; i < maxIterations; i++) {
    const result = await callClaude({
      systemPrompt: getActionSystemPrompt(businessName),
      messages: agentMessages,
      tools: actionTools,
      model,
      maxTokens: 1024,
    });

    totalInputTokens += result.inputTokens;
    totalOutputTokens += result.outputTokens;
    totalLatencyMs += result.latencyMs;

    const toolUse = extractToolUse(result.response);

    if (!toolUse) {
      // No tool call — agent is done, return text response
      return {
        response: extractTextContent(result.response),
        toolCalls,
        totalInputTokens,
        totalOutputTokens,
        totalLatencyMs,
      };
    }

    // Execute the tool
    const toolInput = toolUse.input as Record<string, unknown>;
    const toolResult = await executeToolFn(toolUse.name, toolInput);

    toolCalls.push({
      toolName: toolUse.name,
      toolInput,
      result: toolResult,
    });

    // Add assistant response and tool result to messages for next iteration
    agentMessages.push({
      role: "assistant",
      content: result.response.content,
    });
    agentMessages.push({
      role: "user",
      content: [
        {
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(toolResult),
        },
      ],
    });
  }

  // Max iterations reached — return what we have
  return {
    response: "I've completed the actions requested. Is there anything else I can help with?",
    toolCalls,
    totalInputTokens,
    totalOutputTokens,
    totalLatencyMs,
  };
}
