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
  metadata: Record<string, unknown>;
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

// Platform roles
export type PlatformRole = "super_admin" | "user";
export type TeamRole = "admin" | "member" | "viewer";
export type InvitationStatus = "pending" | "accepted" | "declined" | "expired";

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
  role: PlatformRole;
  ai_confidence_threshold: number;
  require_approval: boolean;
  ai_memory_depth: number;
  training_data_opt_out: boolean;
  default_language: string;
  created_at: string;
  updated_at: string;
}

// AI Approval Queue
export type AIApprovalStatus = "pending" | "approved" | "rejected";

export interface AIApproval {
  id: string;
  user_id: string;
  conversation_id: string | null;
  contact_id: string | null;
  draft_content: string;
  confidence: number | null;
  reasoning: string | null;
  status: AIApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  // Joined fields (optional)
  contact?: Contact;
  conversation?: Conversation;
}

// AI Conversation Quality Rubric
export type SentimentFinal = "positive" | "neutral" | "negative";

export interface ConversationQualityRubric {
  resolved: boolean;
  booked: boolean;
  escalated: boolean;
  sentiment_final: SentimentFinal;
  quality_score: number; // 1-5
  notes: string;
  scored_at: string;
}

// Team Member
export interface TeamMember {
  id: string;
  owner_id: string;
  member_user_id: string;
  role: TeamRole;
  created_at: string;
  updated_at: string;
  // Joined fields
  member_profile?: Profile;
  member_email?: string;
}

// Team Invitation
export interface TeamInvitation {
  id: string;
  owner_id: string;
  email: string;
  role: TeamRole;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
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

// Booking System
export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
export type PaymentStatus = "unpaid" | "deposit_paid" | "paid" | "refunded";

export interface Service {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  currency: string;
  is_active: boolean;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface AvailabilitySchedule {
  id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BlockedDate {
  id: string;
  user_id: string;
  blocked_date: string;
  reason: string | null;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  created_at: string;
}

export interface BookingSettings {
  id: string;
  user_id: string;
  booking_url_slug: string | null;
  business_name: string | null;
  business_description: string | null;
  logo_url: string | null;
  min_notice_hours: number;
  max_advance_days: number;
  slot_duration_minutes: number;
  buffer_minutes: number;
  require_payment: boolean;
  deposit_amount_cents: number;
  confirmation_message: string;
  cancellation_policy: string | null;
  timezone: string;
  allowed_areas: string[];
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  service_id: string | null;
  contact_id: string | null;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: BookingStatus;
  notes: string | null;
  internal_notes: string | null;
  location: string | null;
  area: string | null;
  payment_status: PaymentStatus;
  payment_amount_cents: number;
  stripe_payment_intent_id: string | null;
  stripe_checkout_session_id: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  confirmed_at: string | null;
  completed_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined fields
  service?: Service;
}

// Notifications
export type NotificationType = 'new_message' | 'new_lead' | 'booking_confirmed' | 'booking_cancelled' | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

// Audit Log
export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_label: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
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
