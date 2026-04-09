import { z } from "zod";

export const createLeadSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  email: z.string().email("Invalid email address").optional(),
  phone: z.string().max(20).optional(),
  company: z.string().max(200).optional(),
  source: z.string().max(100).optional(),
  notes: z.string().max(5000).optional(),
});

export const updateLeadSchema = createLeadSchema.partial();

export type CreateLeadInput = z.infer<typeof createLeadSchema>;
export type UpdateLeadInput = z.infer<typeof updateLeadSchema>;
