-- Migration: AI Quality features
-- Confidence threshold + approval queue, per-contact memory, multilingual,
-- training opt-out, default language, conversation quality scoring

-- 1. Profile additions
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS ai_confidence_threshold numeric DEFAULT 0.0
    CHECK (ai_confidence_threshold >= 0 AND ai_confidence_threshold <= 1),
  ADD COLUMN IF NOT EXISTS require_approval boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_memory_depth integer DEFAULT 3
    CHECK (ai_memory_depth >= 0 AND ai_memory_depth <= 10),
  ADD COLUMN IF NOT EXISTS training_data_opt_out boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_language text DEFAULT 'en';

-- 2. Conversations metadata jsonb (for quality_rubric and other AI extras)
ALTER TABLE conversations
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- 3. AI approvals queue
CREATE TABLE IF NOT EXISTS ai_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  draft_content text NOT NULL,
  confidence numeric,
  reasoning text,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  approved_by uuid REFERENCES auth.users(id),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_approvals_user_status
  ON ai_approvals (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_approvals_conversation
  ON ai_approvals (conversation_id);

ALTER TABLE ai_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai_approvals"
  ON ai_approvals FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own ai_approvals"
  ON ai_approvals FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own ai_approvals"
  ON ai_approvals FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own ai_approvals"
  ON ai_approvals FOR DELETE
  USING (user_id = auth.uid());
