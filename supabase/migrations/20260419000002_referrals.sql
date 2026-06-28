-- Referrals + Branding + Training Opt-Out
--
-- Adds:
--   * profiles.referral_code      (unique, auto-generated for new and existing rows)
--   * profiles.referred_by_code   (which code was used at signup)
--   * profiles.hide_branding      (paid plans can hide "Powered by LeadFlow" on booking page)
--   * profiles.training_data_opt_out
--       NOTE: this column is shared with the upcoming `20260419_ai_quality.sql` migration.
--       We add it here defensively (`IF NOT EXISTS`) so either migration can run first.
--   * referral_credits table       (tracks $ credits earned per referral event)

-- ---------------------------------------------------------------------------
-- 1. Profile columns
-- ---------------------------------------------------------------------------

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referred_by_code text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hide_branding boolean NOT NULL DEFAULT false;
-- Match the column shape used by 20260419_ai_quality.sql (no NOT NULL, default false)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS training_data_opt_out boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_profiles_referral_code ON profiles (referral_code);
CREATE INDEX IF NOT EXISTS idx_profiles_referred_by_code ON profiles (referred_by_code);

-- ---------------------------------------------------------------------------
-- 2. Auto-generate referral codes (8-char URL-safe upper case alphanumeric)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- omit easily-confused chars (I O 0 1)
  result text := '';
  i int := 0;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION assign_referral_code()
RETURNS trigger AS $$
DECLARE
  candidate text;
  attempts int := 0;
BEGIN
  IF NEW.referral_code IS NOT NULL THEN
    RETURN NEW;
  END IF;

  LOOP
    candidate := generate_referral_code();
    -- Best-effort uniqueness check; UNIQUE constraint is the source of truth.
    PERFORM 1 FROM profiles WHERE referral_code = candidate LIMIT 1;
    EXIT WHEN NOT FOUND OR attempts > 5;
    attempts := attempts + 1;
  END LOOP;

  NEW.referral_code := candidate;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_assign_referral_code ON profiles;
CREATE TRIGGER profiles_assign_referral_code
  BEFORE INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION assign_referral_code();

-- Backfill existing rows that don't yet have a code
UPDATE profiles
SET referral_code = generate_referral_code()
WHERE referral_code IS NULL;

-- ---------------------------------------------------------------------------
-- 3. referral_credits table
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS referral_credits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_cents integer NOT NULL,
  reason text NOT NULL CHECK (reason IN ('referred_signup', 'referred_paid', 'referrer_bonus')),
  related_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referral_credits_user_id ON referral_credits (user_id);
CREATE INDEX IF NOT EXISTS idx_referral_credits_created_at ON referral_credits (created_at DESC);

ALTER TABLE referral_credits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own referral credits" ON referral_credits;
CREATE POLICY "Users can view own referral credits"
  ON referral_credits FOR SELECT
  USING (user_id = auth.uid());

-- (No INSERT/UPDATE/DELETE policies — credits are written by service role only.)
