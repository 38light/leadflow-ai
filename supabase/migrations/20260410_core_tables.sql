-- Migration 1: Core tables for LeadFlow AI
-- profiles, contacts, channels, conversations, messages

-- Profiles: extends auth.users with business data
CREATE TABLE profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  business_name text,
  business_type text,
  timezone text DEFAULT 'Australia/Sydney',
  phone text,
  website text,
  ai_enabled boolean DEFAULT true,
  subscription_tier text DEFAULT 'free' CHECK (subscription_tier IN ('free','starter','pro','enterprise')),
  stripe_customer_id text,
  stripe_subscription_id text,
  hubspot_portal_id text,
  hubspot_access_token text,
  hubspot_refresh_token text,
  meta_page_id text,
  meta_access_token text,
  twilio_account_sid text,
  twilio_auth_token text,
  twilio_phone_number text,
  vapi_api_key text,
  google_calendar_token jsonb,
  outlook_calendar_token jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (user_id = auth.uid());

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Contacts: unified contact entity across all channels
CREATE TABLE contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  email text,
  phone text,
  company text,
  source_channel text CHECK (source_channel IN ('whatsapp','instagram','facebook','sms','voice','web_chat','manual','hubspot')),
  status text DEFAULT 'new' CHECK (status IN ('new','contacted','qualified','proposal','negotiation','won','lost')),
  temperature text DEFAULT 'cold' CHECK (temperature IN ('cold','warm','hot')),
  last_interaction_at timestamptz,
  hubspot_contact_id text,
  hubspot_deal_id text,
  metadata jsonb DEFAULT '{}',
  opted_out boolean DEFAULT false,
  opt_out_at timestamptz,
  tags text[] DEFAULT '{}',
  score integer DEFAULT 0 CHECK (score >= 0),
  assigned_to uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contacts" ON contacts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own contacts" ON contacts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own contacts" ON contacts FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own contacts" ON contacts FOR DELETE USING (user_id = auth.uid());

-- Channels: configured channel instances per user
CREATE TABLE channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('whatsapp','instagram','facebook','sms','voice','web_chat')),
  name text NOT NULL,
  is_active boolean DEFAULT true,
  config jsonb DEFAULT '{}',
  webhook_secret text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own channels" ON channels FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own channels" ON channels FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own channels" ON channels FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own channels" ON channels FOR DELETE USING (user_id = auth.uid());

-- Conversations: one per contact-channel pair
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  channel_id uuid REFERENCES channels(id) ON DELETE SET NULL,
  channel_type text NOT NULL,
  status text DEFAULT 'active' CHECK (status IN ('active','paused','closed','archived')),
  is_ai_active boolean DEFAULT true,
  ai_handoff_reason text,
  handoff_at timestamptz,
  external_thread_id text,
  summary text,
  sentiment text DEFAULT 'unknown' CHECK (sentiment IN ('positive','neutral','negative','unknown')),
  intent text,
  last_message_at timestamptz,
  unread_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own conversations" ON conversations FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE USING (user_id = auth.uid());

-- Messages: all messages across all channels, normalized
CREATE TABLE messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id uuid NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('inbound','outbound')),
  sender_type text NOT NULL CHECK (sender_type IN ('contact','ai','human')),
  content text,
  content_type text DEFAULT 'text' CHECK (content_type IN ('text','image','audio','video','document','location','voice_transcript')),
  channel_type text NOT NULL,
  external_message_id text,
  media_url text,
  media_storage_path text,
  ai_model text,
  ai_confidence real,
  ai_tokens_used integer,
  metadata jsonb DEFAULT '{}',
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own messages" ON messages FOR INSERT WITH CHECK (user_id = auth.uid());
