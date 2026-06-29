-- Switch the knowledge base from 1536-dim (OpenAI) to 384-dim (local
-- Transformers.js model: BAAI/bge-small-en-v1.5). The embedding column was
-- vector(1536) but the app now generates 384-dim vectors locally — they must
-- match. Safe to re-type in place: knowledge_chunks holds no real data yet.

-- 1. Re-type the embedding column. The ivfflat index references the column, so
--    drop it first and recreate after.
DROP INDEX IF EXISTS idx_knowledge_chunks_embedding;

ALTER TABLE knowledge_chunks
  ALTER COLUMN embedding TYPE vector(384);

CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- 2. Redefine the authenticated-caller match function at the new dimension.
--    (Body unchanged from 20260628000001 — only vector(1536) → vector(384).)
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  p_knowledge_base_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  document_id uuid,
  chunk_index integer,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;
  IF p_user_id IS NOT NULL AND p_user_id <> v_user_id THEN
    RAISE EXCEPTION 'permission denied: cannot query another tenant''s knowledge base';
  END IF;
  RETURN QUERY
  SELECT kc.id, kc.content, kc.document_id, kc.chunk_index,
         1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE kc.user_id = v_user_id
    AND (p_knowledge_base_id IS NULL OR kc.knowledge_base_id = p_knowledge_base_id)
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

REVOKE ALL ON FUNCTION match_knowledge_chunks(vector, float, int, uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION match_knowledge_chunks(vector, float, int, uuid, uuid)
  TO authenticated, service_role;

-- 3. Backend retrieval function. The AI orchestrator processes inbound messages
--    with the service-role client (no user session → auth.uid() is NULL), so it
--    cannot use the function above. This variant trusts an explicit p_user_id:
--      * service_role (trusted backend, auth.uid() NULL) → may pass any user id
--      * authenticated → may only pass their OWN id (guarded below)
--    Not granted to anon: no anonymous RAG.
CREATE OR REPLACE FUNCTION match_knowledge_chunks_for_user(
  query_embedding vector(384),
  p_user_id uuid,
  match_threshold float DEFAULT 0.3,
  match_count int DEFAULT 5,
  p_knowledge_base_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  document_id uuid,
  chunk_index integer,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'p_user_id is required';
  END IF;
  -- An authenticated caller may only query their own knowledge base. A NULL
  -- auth.uid() means the service-role/backend caller, which is trusted.
  IF v_uid IS NOT NULL AND v_uid <> p_user_id THEN
    RAISE EXCEPTION 'permission denied: cannot query another tenant''s knowledge base';
  END IF;
  RETURN QUERY
  SELECT kc.id, kc.content, kc.document_id, kc.chunk_index,
         1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE kc.user_id = p_user_id
    AND (p_knowledge_base_id IS NULL OR kc.knowledge_base_id = p_knowledge_base_id)
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

REVOKE ALL ON FUNCTION match_knowledge_chunks_for_user(vector, uuid, float, int, uuid) FROM public;
GRANT EXECUTE ON FUNCTION match_knowledge_chunks_for_user(vector, uuid, float, int, uuid)
  TO authenticated, service_role;
