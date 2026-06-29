// Knowledge retrieval for the AI orchestrator.
//
// The orchestrator processes inbound messages with a service-role client (no
// user session / no auth.uid()), so it calls match_knowledge_chunks_for_user —
// a SECURITY DEFINER function that trusts the explicit userId the backend passes
// (granted to service_role; authenticated callers may only pass their own id).

import type { SupabaseClient } from "@supabase/supabase-js";
import { generateQueryEmbedding } from "./embeddings";

export interface RetrievedChunk {
  content: string;
  documentId: string;
  similarity: number;
}

export async function retrieveRelevantChunks(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  options: { knowledgeBaseId?: string | null; matchCount?: number; threshold?: number } = {}
): Promise<RetrievedChunk[]> {
  const { knowledgeBaseId = null, matchCount = 5, threshold = 0.3 } = options;

  const trimmed = query.trim();
  if (!trimmed) return [];

  let queryEmbedding: number[];
  try {
    queryEmbedding = await generateQueryEmbedding(trimmed);
  } catch (error) {
    console.error("[Retrieve] embedding failed:", error);
    return [];
  }

  const { data, error } = await supabase.rpc("match_knowledge_chunks_for_user", {
    // pgvector parses the bracketed string literal; stringify avoids JSON-array cast issues.
    query_embedding: JSON.stringify(queryEmbedding),
    p_user_id: userId,
    match_threshold: threshold,
    match_count: matchCount,
    p_knowledge_base_id: knowledgeBaseId,
  });

  if (error) {
    console.error("[Retrieve] match_knowledge_chunks_for_user failed:", error);
    return [];
  }

  return ((data ?? []) as Array<{ content: string; document_id: string; similarity: number }>).map(
    (row) => ({
      content: row.content,
      documentId: row.document_id,
      similarity: row.similarity,
    })
  );
}
