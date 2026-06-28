export type { Database } from "./supabase";

// Channel types
export type ChannelType = "whatsapp" | "instagram" | "facebook" | "sms" | "voice" | "web_chat";
export type SourceChannel = ChannelType | "manual" | "hubspot";

// Contact / Lead
export type LeadStatus = "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
export type Temperature = "cold" | "warm" | "hot";

export interface Contact {
  id: string;
  user_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  source_channel: SourceChannel | null;
  status: LeadStatus;
  temperature: Temperature;
  last_interaction_at: string | null;
  hubspot_contact_id: string | null;
  hubspot_deal_id: string | null;
  metadata: Record<string, unknown>;
  opted_out: boolean;
  opt_out_at: string | null;
  tags: string[];
  score: number;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

// Channel
export interface Channel {
  id: string;
  user_id: string;
  type: ChannelType;
  name: string;
  is_active: boolean;
  config: Record<string, unknown>;
  webhook_secret: string | null;
  created_at: string;
  updated_at: string;
}

// Conversation
export type ConversationStatus = "active" | "paused" | "closed" | "archived";
export type Sentiment = "positive" | "neutral" | "negative" | "unknown";

export interface Conversation {
  id: string;
  user_id: string;
  contact_id: string;
  channel_id: string | null;
  channel_type: string;
  status: ConversationStatus;
  is_ai_active: boolean;
  ai_handoff_reason: string | null;
  handoff_at: string | null;
  external_thread_id: string | null;
  summary: string | null;
  sentiment: Sentiment;
  intent: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
  updated_at: string;
  // Joined fields (optional)
  contact?: Contact;
}

// Message
export type MessageDirection = "inbound" | "outbound";
export type SenderType = "contact" | "ai" | "human";
export type ContentType = "text" | "image" | "audio" | "video" | "document" | "location" | "voice_transcript";

export interface Message {
  id: string;
  user_id: string;
  conversation_id: string;
  contact_id: string;
  direction: MessageDirection;
  sender_type: SenderType;
  content: string | null;
  content_type: ContentType;
  channel_type: string;
  external_message_id: string | null;
  media_url: string | null;
  media_storage_path: string | null;
  ai_model: string | null;
  ai_confidence: number | null;
  ai_tokens_used: number | null;
  metadata: Record<string, unknown>;
  delivered_at: string | null;
  read_at: string | null;
  created_at: string;
}

// Outbound webhooks
export type WebhookEventType = "contact.created" | "booking.created";

export interface WebhookEndpoint {
  id: string;
  user_id: string;
  url: string;
  secret: string;
  events: WebhookEventType[];
  description: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WebhookDelivery {
  id: string;
  user_id: string;
  endpoint_id: string;
  event_type: WebhookEventType;
  status: "success" | "failed";
  status_code: number | null;
  error: string | null;
  created_at: string;
}

// Knowledge Base
export interface KnowledgeBase {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type DocumentStatus = "pending" | "processing" | "ready" | "error";

export interface KnowledgeDocument {
  id: string;
  user_id: string;
  knowledge_base_id: string;
  title: string;
  file_name: string | null;
  file_type: string | null;
  storage_path: string | null;
  content_text: string | null;
  chunk_count: number;
  status: DocumentStatus;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// AI Agent Config
export type AgentType = "concierge" | "knowledge" | "action";

export interface AIAgentConfig {
  id: string;
  user_id: string;
  agent_type: AgentType;
  name: string;
  system_prompt: string | null;
  enabled: boolean;
  model: string;
  max_tokens: number;
  temperature: number;
  tools_enabled: string[];
  knowledge_base_ids: string[];
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// AI Interaction Log
export interface AIInteractionLog {
  id: string;
  user_id: string;
  conversation_id: string | null;
  message_id: string | null;
  agent_type: string;
  input_tokens: number | null;
  output_tokens: number | null;
  model: string | null;
  latency_ms: number | null;
  tools_called: unknown[];
  reasoning: string | null;
  error: string | null;
  created_at: string;
}

// Subscription
export type PlanTier = "free" | "starter" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing";

export interface Subscription {
  id: string;
  user_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  plan: PlanTier;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  message_count_this_period: number;
  message_limit: number;
  ai_calls_this_period: number;
  ai_calls_limit: number;
  created_at: string;
  updated_at: string;
}

// Profile
export interface Profile {
  id: string;
  user_id: string;
  business_name: string | null;
  business_type: string | null;
  timezone: string;
  phone: string | null;
  website: string | null;
  ai_enabled: boolean;
  subscription_tier: PlanTier;
  created_at: string;
  updated_at: string;
}

// Analytics
export interface AnalyticsEvent {
  id: string;
  user_id: string;
  event_type: string;
  contact_id: string | null;
  conversation_id: string | null;
  channel_type: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// Pipeline (kept for backward compat)
export interface Pipeline {
  id: string;
  user_id: string;
  name: string;
  stages: PipelineStage[];
  created_at: string;
  updated_at: string;
}

export interface PipelineStage {
  id: string;
  name: string;
  order: number;
  color: string;
}
