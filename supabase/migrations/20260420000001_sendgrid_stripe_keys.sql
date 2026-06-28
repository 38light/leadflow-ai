-- Add sendgrid_api_key and stripe_secret_key columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS sendgrid_api_key text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_secret_key text;
