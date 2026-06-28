-- Migration: Outbound webhook endpoints + delivery logs
--
-- Tenants register outbound webhook endpoints that LeadFlow POSTs to when
-- subscribed events fire (e.g. contact.created, booking.created). Endpoint URLs
-- are SSRF-guarded in application code (src/lib/webhooks/ssrf-guard.ts) at both
-- creation time and delivery time — there is no way to register a URL that
-- resolves to a private / loopback / metadata address.

-- Endpoints --------------------------------------------------------------

CREATE TABLE webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  url text NOT NULL,
  secret text NOT NULL,                       -- HMAC signing secret (shown once on create)
  events text[] NOT NULL DEFAULT '{}',        -- subscribed event types
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own webhook endpoints" ON webhook_endpoints
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own webhook endpoints" ON webhook_endpoints
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own webhook endpoints" ON webhook_endpoints
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own webhook endpoints" ON webhook_endpoints
  FOR DELETE USING (user_id = auth.uid());

CREATE INDEX idx_webhook_endpoints_user_active
  ON webhook_endpoints (user_id, active);

CREATE TRIGGER set_updated_at BEFORE UPDATE ON webhook_endpoints
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Delivery logs ----------------------------------------------------------

CREATE TABLE webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint_id uuid REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  status text NOT NULL DEFAULT 'failed' CHECK (status IN ('success','failed')),
  status_code integer,
  error text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Tenants read their own delivery history; writes happen from the service-role
-- client inside after() callbacks (no user cookie context at that point).
CREATE POLICY "Users can view own webhook deliveries" ON webhook_deliveries
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role can manage webhook deliveries" ON webhook_deliveries
  FOR ALL USING (auth.role() = 'service_role');

CREATE INDEX idx_webhook_deliveries_endpoint
  ON webhook_deliveries (endpoint_id, created_at DESC);
