import { z } from "zod";

export const channelTypes = ["whatsapp", "sms", "web_chat"] as const;
export const broadcastStatuses = ["draft", "sending", "sent", "failed"] as const;

export const createBroadcastSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(200),
  message: z.string().min(1, "Message is required").max(1000),
  channelType: z.enum(channelTypes),
  segmentStatus: z.array(z.string()).optional(),
  segmentTemperature: z.array(z.string()).optional(),
  segmentSourceChannel: z.array(z.string()).optional(),
});

export const broadcastPreviewSchema = z.object({
  channelType: z.enum(channelTypes),
  segmentStatus: z.array(z.string()).optional(),
  segmentTemperature: z.array(z.string()).optional(),
  segmentSourceChannel: z.array(z.string()).optional(),
});

export type CreateBroadcastInput = z.infer<typeof createBroadcastSchema>;
export type BroadcastPreviewInput = z.infer<typeof broadcastPreviewSchema>;
