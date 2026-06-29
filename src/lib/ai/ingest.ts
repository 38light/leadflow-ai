// Knowledge-document ingestion: extract text → chunk → embed → store.
// Called when a document is uploaded so the AI can retrieve from it later.

import type { SupabaseClient } from "@supabase/supabase-js";
import { generateEmbeddings } from "./embeddings";

/**
 * Extract plain text from an uploaded file buffer.
 * Supports PDF, Word (.docx), and plain-text formats (.txt/.md/.csv).
 * Parsers are imported dynamically so they never load on the edge/client.
 */
export async function extractText(
  buffer: Buffer,
  fileType: string | null,
  fileName: string | null
): Promise<string> {
  const name = (fileName ?? "").toLowerCase();
  const type = (fileType ?? "").toLowerCase();

  const isPdf = type.includes("pdf") || name.endsWith(".pdf");
  const isDocx =
    type.includes("officedocument.wordprocessing") ||
    name.endsWith(".docx") ||
    name.endsWith(".doc");

  if (isPdf) {
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text ?? "";
    } finally {
      await parser.destroy();
    }
  }

  if (isDocx) {
    const mammoth = await import("mammoth");
    const { value } = await mammoth.extractRawText({ buffer });
    return value ?? "";
  }

  // Plain text / markdown / csv and anything else readable as UTF-8.
  return buffer.toString("utf-8");
}

/**
 * Split text into overlapping chunks on paragraph/sentence boundaries.
 * ~1000 chars per chunk with 150-char overlap keeps related context together
 * while staying well under the embedding model's token limit.
 */
export function chunkText(text: string, maxChars = 1000, overlap = 150): string[] {
  const clean = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  // Prefer to break on paragraph, then sentence, then hard char boundaries.
  const units = clean.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  const pushCurrent = () => {
    const trimmed = current.trim();
    if (trimmed) chunks.push(trimmed);
  };

  for (const unit of units) {
    const piece = unit.trim();
    if (!piece) continue;

    if (piece.length > maxChars) {
      // Paragraph itself too big — split by sentence.
      pushCurrent();
      current = "";
      const sentences = piece.match(/[^.!?]+[.!?]+|\S[^.!?]*$/g) ?? [piece];
      for (const sentence of sentences) {
        if ((current + " " + sentence).trim().length > maxChars) {
          pushCurrent();
          current = sentence.trim();
        } else {
          current = (current + " " + sentence).trim();
        }
      }
      continue;
    }

    if ((current + "\n\n" + piece).trim().length > maxChars) {
      pushCurrent();
      current = piece;
    } else {
      current = current ? current + "\n\n" + piece : piece;
    }
  }
  pushCurrent();

  // Add overlap: prepend the tail of the previous chunk to each chunk.
  if (overlap > 0 && chunks.length > 1) {
    for (let i = 1; i < chunks.length; i++) {
      const prevTail = chunks[i - 1].slice(-overlap);
      chunks[i] = (prevTail + " " + chunks[i]).trim();
    }
  }

  return chunks;
}

interface IngestParams {
  supabase: SupabaseClient;
  userId: string;
  knowledgeBaseId: string;
  documentId: string;
  text: string;
}

/**
 * Chunk + embed text and store it in knowledge_chunks, then mark the document
 * ready. Throws on failure so the caller can record an error status.
 */
export async function ingestDocument({
  supabase,
  userId,
  knowledgeBaseId,
  documentId,
  text,
}: IngestParams): Promise<{ chunkCount: number }> {
  await supabase
    .from("knowledge_documents")
    .update({ status: "processing", content_text: text.slice(0, 100_000) })
    .eq("id", documentId);

  // Replace any prior chunks for this document (idempotent re-ingest).
  await supabase.from("knowledge_chunks").delete().eq("document_id", documentId);

  const chunks = chunkText(text);
  if (chunks.length === 0) {
    await supabase
      .from("knowledge_documents")
      .update({ status: "ready", chunk_count: 0 })
      .eq("id", documentId);
    return { chunkCount: 0 };
  }

  const embeddings = await generateEmbeddings(chunks);

  const rows = chunks.map((content, i) => ({
    user_id: userId,
    document_id: documentId,
    knowledge_base_id: knowledgeBaseId,
    content,
    embedding: JSON.stringify(embeddings[i]),
    chunk_index: i,
    token_count: Math.ceil(content.length / 4),
  }));

  const { error: insertError } = await supabase.from("knowledge_chunks").insert(rows);
  if (insertError) {
    throw new Error(`Failed to store chunks: ${insertError.message}`);
  }

  await supabase
    .from("knowledge_documents")
    .update({ status: "ready", chunk_count: chunks.length })
    .eq("id", documentId);

  return { chunkCount: chunks.length };
}
