-- Migration 3: Subscriptions, Analytics, and Webhook Logs

-- Subscriptions: Stripe subscription state
CREATE TABLE subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE,
  stripe_customer_id text,
  plan text DEFAULT 'free' CHECK (plan IN ('free','starter','pro','enterprise')),
  status text DEFAULT 'active' CHECK (status IN ('active','canceled','past_due','trialing')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  message_count_this_period integer DEFAULT 0,
  message_limit integer DEFAULT 100,
  ai_calls_this_period integer DEFAULT 0,
  ai_calls_limit integer DEFAULT 50,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own subscription" ON subscriptions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own subscription" ON subscriptions FOR UPDATE USING (user_id = auth.uid());

-- Analytics Events: event tracking
CREATE TABLE analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  conversation_id uuid REFERENCES conversations(id) ON DELETE SET NULL,
  channel_type text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events" ON analytics_events FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own events" ON analytics_events FOR INSERT WITH CHECK (user_id = auth.uid());

-- Webhook Logs: debug incoming webhooks
CREATE TABLE webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source text NOT NULL,
  event_type text,
  payload jsonb,
  status text DEFAULT 'received' CHECK (status IN ('received','processed','failed')),
  error text,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;

-- Webhook logs need service role access for unauthenticated webhook handlers
CREATE POLICY "Users can view own webhook logs" ON webhook_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role can manage webhook logs" ON webhook_logs FOR ALL USING (auth.role() = 'service_role');
