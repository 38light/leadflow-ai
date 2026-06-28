-- Internal notes on a user (visible to all admins)
CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_email TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Account labels/tags
CREATE TABLE IF NOT EXISTS account_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tag TEXT NOT NULL, -- 'enterprise', 'vip', 'at-risk', 'churned', 'beta-user', 'partner'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, tag)
);

ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_tags ENABLE ROW LEVEL SECURITY;
-- No user-level policies — accessed via service role from admin API only

CREATE INDEX idx_admin_notes_target_user_id ON admin_notes(target_user_id);
CREATE INDEX idx_admin_notes_created_at ON admin_notes(created_at DESC);
CREATE INDEX idx_account_tags_user_id ON account_tags(user_id);
