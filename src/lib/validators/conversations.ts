import { z } from "zod";

const conversationStatuses = ["active", "paused", "closed", "archived"] as const;
const channelTypes = ["whatsapp", "instagram", "facebook", "sms", "voice", "web_chat"] as const;

export const createConversationSchema = z.object({
  contact_id: z.string().uuid("Invalid contact ID"),
  channel_id: z.string().uuid("Invalid channel ID").optional().nullable(),
  channel_type: z.enum(channelTypes),
  external_thread_id: z.string().max(500).optional().nullable(),
});

export const updateConversationSchema = z.object({
  status: z.enum(conversationStatuses).optional(),
  is_ai_active: z.boolean().optional(),
  ai_handoff_reason: z.string().max(500).optional().nullable(),
  summary: z.string().max(5000).optional().nullable(),
});

export const conversationFiltersSchema = z.object({
  status: z.enum(conversationStatuses).optional(),
  channel_type: z.enum(channelTypes).optional(),
  contact_id: z.string().uuid().optional(),
  is_ai_active: z.coerce.boolean().optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const sendMessageSchema = z.object({
  content: z.string().min(1, "Message cannot be empty").max(10000),
  content_type: z.enum(["text", "image", "audio", "video", "document"]).default("text"),
  media_url: z.string().url().optional(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type ConversationFilters = z.infer<typeof conversationFiltersSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
