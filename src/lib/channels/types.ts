export type ChannelType = "whatsapp" | "instagram" | "facebook" | "sms" | "voice" | "web_chat";

export interface NormalizedMessage {
  externalMessageId: string;
  externalThreadId: string;
  senderExternalId: string;
  senderName?: string;
  senderPhone?: string;
  senderEmail?: string;
  content: string;
  contentType: "text" | "image" | "audio" | "video" | "document" | "location";
  mediaUrl?: string;
  channelType: ChannelType;
  rawPayload: unknown;
  timestamp: Date;
}

export interface OutboundMessage {
  to: string;
  content: string;
  contentType: "text" | "image" | "audio" | "video" | "document";
  mediaUrl?: string;
  channelType: ChannelType;
  channelConfig: Record<string, unknown>;
}

export interface SendResult {
  success: boolean;
  externalMessageId?: string;
  error?: string;
}

export interface ChannelAdapter {
  readonly channelType: ChannelType;
  normalizeInbound(rawPayload: unknown): NormalizedMessage | null;
  sendOutbound(message: OutboundMessage): Promise<SendResult>;
  verifyWebhook(request: Request): Promise<boolean>;
}

export interface WebhookContext {
  userId: string;
  channelId: string;
  channelConfig: Record<string, unknown>;
}
