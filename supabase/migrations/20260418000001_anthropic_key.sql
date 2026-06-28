-- Add anthropic_api_key to profiles so users can configure it via the Settings UI
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS anthropic_api_key text;
