CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- who did it (null = system)
  actor_email TEXT, -- denormalized for display after user deletion
  action TEXT NOT NULL, -- e.g. 'user.suspend', 'user.plan_change', 'impersonate.start', 'refund.issued', 'flag.toggle'
  target_type TEXT, -- 'user', 'booking', 'contact', 'flag', etc.
  target_id TEXT, -- the ID of the affected record
  target_label TEXT, -- human-readable name e.g. the user's email
  metadata JSONB DEFAULT '{}', -- extra details e.g. { old_plan: 'free', new_plan: 'pro' }
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only super admins can read audit logs (enforced at API level via service role)
-- No user-level SELECT policy — all reads go through admin API with service role

CREATE INDEX idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_target ON audit_logs(target_type, target_id);
