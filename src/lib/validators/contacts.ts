import { z } from "zod";

const sourceChannels = ["whatsapp", "instagram", "facebook", "sms", "voice", "web_chat", "manual", "hubspot"] as const;
const statuses = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"] as const;
const temperatures = ["cold", "warm", "hot"] as const;

export const createContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email").optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  company: z.string().max(200).optional().nullable(),
  source_channel: z.enum(sourceChannels).optional().nullable(),
  status: z.enum(statuses).default("new"),
  tags: z.array(z.string().max(50)).max(20).default([]),
  metadata: z.record(z.unknown()).default({}),
  notes: z.string().max(5000).optional(),
});

export const updateContactSchema = createContactSchema.partial().extend({
  temperature: z.enum(temperatures).optional(),
  score: z.number().int().min(0).optional(),
  opted_out: z.boolean().optional(),
});

export const contactFiltersSchema = z.object({
  status: z.enum(statuses).optional(),
  temperature: z.enum(temperatures).optional(),
  source_channel: z.enum(sourceChannels).optional(),
  search: z.string().max(200).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactFilters = z.infer<typeof contactFiltersSchema>;
