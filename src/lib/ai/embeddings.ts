// Embedding generation for the knowledge base (RAG).
//
// Runs a small open-source model LOCALLY via Transformers.js — no API key, no
// per-call cost, fully offline after the model downloads once (~90MB, cached).
// Model: BAAI/bge-small-en-v1.5 (ONNX build) → 384-dimensional vectors.
//
// The DB `knowledge_chunks.embedding` column and the match_* RPCs are all
// vector(384) to match. If you ever change the model, update EMBEDDING_DIMENSIONS
// AND the column/function dimension together (see supabase/migrations).

import { pipeline, type FeatureExtractionPipeline } from "@huggingface/transformers";

const EMBEDDING_MODEL = "Xenova/bge-small-en-v1.5";
export const EMBEDDING_DIMENSIONS = 384;

// bge retrieval models work best when the *query* (not the documents) is
// prefixed with this instruction. Documents are embedded as-is.
const QUERY_INSTRUCTION = "Represent this sentence for searching relevant passages: ";

// Lazy singleton — the model loads once per process and is reused.
let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    extractorPromise = pipeline("feature-extraction", EMBEDDING_MODEL);
  }
  return extractorPromise;
}

/** Embed a single piece of text (a document chunk). Returns 384 floats. */
export async function generateEmbedding(text: string): Promise<number[]> {
  const extractor = await getExtractor();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data as Float32Array);
}

/** Embed a search query (adds the bge query instruction for better recall). */
export async function generateQueryEmbedding(text: string): Promise<number[]> {
  return generateEmbedding(QUERY_INSTRUCTION + text);
}

/** Embed many chunks in one batch. Returns one 384-float vector per input. */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const extractor = await getExtractor();
  const output = await extractor(texts, { pooling: "mean", normalize: true });
  return output.tolist() as number[][];
}
