-- Migration 2: AI and Knowledge Base tables
-- Requires pgvector extension

CREATE EXTENSION IF NOT EXISTS vector;

-- Knowledge Bases: per-user RAG knowledge stores
CREATE TABLE knowledge_bases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own knowledge bases" ON knowledge_bases FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own knowledge bases" ON knowledge_bases FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own knowledge bases" ON knowledge_bases FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own knowledge bases" ON knowledge_bases FOR DELETE USING (user_id = auth.uid());

-- Knowledge Documents: uploaded documents for RAG
CREATE TABLE knowledge_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  knowledge_base_id uuid NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  title text NOT NULL,
  file_name text,
  file_type text,
  storage_path text,
  content_text text,
  chunk_count integer DEFAULT 0,
  status text DEFAULT 'pending' CHECK (status IN ('pending','processing','ready','error')),
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON knowledge_documents FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own documents" ON knowledge_documents FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own documents" ON knowledge_documents FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own documents" ON knowledge_documents FOR DELETE USING (user_id = auth.uid());

-- Knowledge Chunks: chunked + embedded text for vector search
CREATE TABLE knowledge_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
  knowledge_base_id uuid NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  content text NOT NULL,
  embedding vector(1536),
  chunk_index integer NOT NULL,
  token_count integer,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chunks" ON knowledge_chunks FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own chunks" ON knowledge_chunks FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own chunks" ON knowledge_chunks FOR DELETE USING (user_id = auth.uid());

-- AI Agent Configs: per-user AI agent configuration
CREATE TABLE ai_agent_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agent_type text NOT NULL CHECK (agent_type IN ('concierge','knowledge','action')),
  name text NOT NULL,
  system_prompt text,
  enabled boolean DEFAULT true,
  model text DEFAULT 'claude-sonnet-4-20250514',
  max_tokens integer DEFAULT 1024,
  temperature real DEFAULT 0.7,
  tools_enabled text[] DEFAULT '{}',
  knowledge_base_ids uuid[] DEFAULT '{}',
  config jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ai_agent_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own agent configs" ON ai_agent_configs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own agent configs" ON ai_agent_configs FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own agent configs" ON ai_agent_configs FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own agent configs" ON ai_agent_configs FOR DELETE USING (user_id = auth.uid());

-- AI Interaction Logs: audit trail for AI decisions
CREATE TABLE ai_interaction_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  message_id uuid REFERENCES messages(id) ON DELETE SET NULL,
  agent_type text NOT NULL,
  input_tokens integer,
  output_tokens integer,
  model text,
  latency_ms integer,
  tools_called jsonb DEFAULT '[]',
  reasoning text,
  error text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ai_interaction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI logs" ON ai_interaction_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own AI logs" ON ai_interaction_logs FOR INSERT WITH CHECK (user_id = auth.uid());
