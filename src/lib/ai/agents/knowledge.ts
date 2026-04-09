import { callClaude, extractTextContent } from "../claude-client";
import { getKnowledgeSystemPrompt } from "../prompts/knowledge-system";
import type Anthropic from "@anthropic-ai/sdk";

interface KnowledgeChunk {
  content: string;
  documentId: string;
  similarity: number;
}

export async function runKnowledgeAgent(
  messages: Anthropic.MessageParam[],
  relevantChunks: KnowledgeChunk[],
  businessName: string,
  model?: string
): Promise<{ response: string; inputTokens: number; outputTokens: number; latencyMs: number }> {
  // Build context from knowledge chunks
  const context = relevantChunks.length > 0
    ? relevantChunks
        .map((chunk, i) => `[Document ${i + 1}]\n${chunk.content}`)
        .join("\n\n---\n\n")
    : "No relevant documents found in the knowledge base.";

  const systemPrompt = `${getKnowledgeSystemPrompt(businessName)}

## Relevant Knowledge Base Context:
${context}`;

  const result = await callClaude({
    systemPrompt,
    messages,
    model,
    maxTokens: 1024,
  });

  return {
    response: extractTextContent(result.response),
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    latencyMs: result.latencyMs,
  };
}
