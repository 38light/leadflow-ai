import { z } from "zod";

const channelTypes = ["whatsapp", "instagram", "facebook", "sms", "voice", "web_chat"] as const;

export const createChannelSchema = z.object({
  type: z.enum(channelTypes),
  name: z.string().min(1, "Name is required").max(100),
  config: z.record(z.unknown()).default({}),
  is_active: z.boolean().default(true),
});

export const updateChannelSchema = createChannelSchema.partial();

export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;
