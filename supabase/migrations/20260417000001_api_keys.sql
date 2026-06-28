CREATE TABLE api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  key_hash text NOT NULL,  -- bcrypt/sha256 hash of the key
  key_prefix text NOT NULL,  -- first 8 chars for display (e.g. "lf_live_")
  last_used_at timestamptz,
  expires_at timestamptz,
  is_active boolean DEFAULT true,
  scopes text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own api_keys" ON api_keys FOR ALL USING (user_id = auth.uid());
