import Anthropic from "@anthropic-ai/sdk";

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not set");
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export interface ClaudeCallParams {
  systemPrompt: string;
  messages: Anthropic.MessageParam[];
  tools?: Anthropic.Tool[];
  maxTokens?: number;
  model?: string;
  temperature?: number;
}

export interface ClaudeCallResult {
  response: Anthropic.Message;
  inputTokens: number;
  outputTokens: number;
  latencyMs: number;
}

export async function callClaude(params: ClaudeCallParams): Promise<ClaudeCallResult> {
  const client = getClient();
  const start = Date.now();

  const response = await client.messages.create({
    model: params.model ?? "claude-sonnet-4-20250514",
    max_tokens: params.maxTokens ?? 1024,
    temperature: params.temperature,
    system: params.systemPrompt,
    messages: params.messages,
    tools: params.tools,
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
