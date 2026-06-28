import { z } from "zod";
import { WEBHOOK_EVENTS } from "@/lib/webhooks/events";

const eventEnum = z.enum([...WEBHOOK_EVENTS] as [string, ...string[]]);

export const createWebhookSchema = z.object({
  url: z.string().url("Invalid URL").max(2048),
  events: z
    .array(eventEnum)
    .min(1, "Subscribe to at least one event")
    .max(WEBHOOK_EVENTS.length),
  description: z.string().max(200).optional().nullable(),
});

export const updateWebhookSchema = z
  .object({
    url: z.string().url("Invalid URL").max(2048).optional(),
    events: z.array(eventEnum).min(1).max(WEBHOOK_EVENTS.length).optional(),
    description: z.string().max(200).optional().nullable(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "No fields to update",
  });

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;
export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
