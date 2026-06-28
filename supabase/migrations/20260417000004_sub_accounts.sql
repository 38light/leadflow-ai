-- Migration: Sub-accounts for Agency / White-Label mode

CREATE TABLE sub_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,  -- the agency
  business_name text NOT NULL,
  contact_name text,
  contact_email text,
  branding_color text DEFAULT '#4f46e5',
  logo_url text,
  custom_domain text,
  status text DEFAULT 'active' CHECK (status IN ('active','suspended','cancelled')),
  plan text DEFAULT 'starter' CHECK (plan IN ('starter','pro','enterprise')),
  monthly_fee_cents integer DEFAULT 0,
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sub_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners manage own sub_accounts" ON sub_accounts FOR ALL USING (owner_id = auth.uid());

CREATE INDEX idx_sub_accounts_owner ON sub_accounts(owner_id);
CREATE INDEX idx_sub_accounts_status ON sub_accounts(owner_id, status);
