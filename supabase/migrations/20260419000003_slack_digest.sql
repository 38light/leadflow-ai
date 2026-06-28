-- Slack notifications + digest configuration
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slack_webhook_url text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slack_notify_hot_leads boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slack_notify_bookings boolean DEFAULT true;

-- Stale-lead alert threshold (used by /api/alerts/stale-hot-leads)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stale_lead_hours integer DEFAULT 2;
