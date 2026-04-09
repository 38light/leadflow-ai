import { z } from "zod";

export const createKnowledgeBaseSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().max(1000).optional().nullable(),
});

export const updateKnowledgeBaseSchema = createKnowledgeBaseSchema.partial().extend({
  is_active: z.boolean().optional(),
});

export const uploadDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  file_name: z.string().max(500),
  file_type: z.string().max(50),
});

export type CreateKnowledgeBaseInput = z.infer<typeof createKnowledgeBaseSchema>;
export type UpdateKnowledgeBaseInput = z.infer<typeof updateKnowledgeBaseSchema>;
export type UploadDocumentInput = z.infer<typeof uploadDocumentSchema>;
