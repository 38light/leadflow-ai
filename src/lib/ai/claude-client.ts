import Anthropic from "@anthropic-ai/sdk";

// Per-key client cache — avoids creating a new instance on every call
// while supporting both env-var keys and user-supplied DB keys.
const _clients = new Map<string, Anthropic>();

function getClient(apiKey: string): Anthropic {
  if (!_clients.has(apiKey)) {
    _clients.set(apiKey, new Anthropic({ apiKey }));
  }
  return _clients.get(apiKey)!;
}

function resolveApiKey(override?: string | null): string {
  const key = override ?? process.env.ANTHROPIC_API_KEY;
  if (!key) {
    throw new Error(
      "Anthropic API key not configured. Add it at Settings → Integrations or set ANTHROPIC_API_KEY."
    );
  }
  return key;
}

export interface ClaudeCallParams {
  systemPrompt: string;
  messages: Anthropic.MessageParam[];
  tools?: Anthropic.Tool[];
  maxTokens?: number;
  model?: string;
  temperature?: number;
  /** Optional: pass the owner's DB-stored key to override the env var */
  apiKey?: string | null;
  /**
   * If true, signal to Anthropic that this customer's data should not be used for
   * model training. Required for enterprise/healthcare customers.
   *
   * TODO: confirm the exact opt-out mechanism with Anthropic and update both:
   *   - the request `metadata.training_opt_out` flag (forwarded below), AND
   *   - any required header (e.g. `anthropic-beta: ...`) once documented.
   * See https://docs.anthropic.com (look for "data usage" / "zero-retention").
   */
  trainingDataOptOut?: boolean;
}

export interface ClaudeCallResult {
  response: Anthropic.Message;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export async function callClaude(params: ClaudeCallParams): Promise<ClaudeCallResult> {
  const client = getClient(resolveApiKey(params.apiKey));
  const start = Date.now();

  // Build the request payload. We piggy-back the training-opt-out flag onto
  // `metadata` (passed through to the API). When Anthropic exposes a stable
  // header for this preference, swap to the documented mechanism — see TODO
  // on `ClaudeCallParams.trainingDataOptOut`.
  const metadata = params.trainingDataOptOut
    ? ({ training_opt_out: "true" } as Record<string, string>)
    : undefined;

  const response = await client.messages.create({
    model: params.model ?? "claude-sonnet-4-20250514",
    max_tokens: params.maxTokens ?? 1024,
    temperature: params.temperature,
    system: params.systemPrompt,
    messages: params.messages,
    tools: params.tools,
    // SDK accepts `metadata?: { user_id?: string }` — we extend the bag intentionally;
    // the server tolerates extra keys, and the runtime cast keeps strict TS happy.
    ...(metadata ? { metadata: metadata as unknown as Anthropic.Messages.Metadata } : {}),
  });

  const latencyMs = Date.now() - start;

  return {
    response,
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
    latencyMs,
  };
}

export function extractTextContent(response: Anthropic.Message): string {
  return response.content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n");
}

export function extractToolUse(response: Anthropic.Message): Anthropic.ToolUseBlock | null {
  const toolUse = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === "tool_use"
  );
  return toolUse ?? null;
}
