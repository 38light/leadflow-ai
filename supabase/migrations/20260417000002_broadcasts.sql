CREATE TABLE broadcasts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  message text NOT NULL,
  channel_type text NOT NULL DEFAULT 'whatsapp' CHECK (channel_type IN ('whatsapp','sms','web_chat')),
  segment_status text[],         -- null = all statuses
  segment_temperature text[],    -- null = all temps
  segment_source_channel text[], -- null = all sources
  recipient_count integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  status text DEFAULT 'draft' CHECK (status IN ('draft','sending','sent','failed')),
  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own broadcasts" ON broadcasts FOR ALL USING (user_id = auth.uid());
