import { z } from "zod";

const dueAt = z.string().datetime({ offset: true }).refine(
  (value) => Number.isFinite(Date.parse(value)),
  "Provide a valid due date"
);
const title = z.string().trim().min(1, "Add a next step").max(200);
const status = z.enum(["pending", "completed", "cancelled"]);

export const createFollowUpSchema = z.object({
  contact_id: z.string().uuid(),
  title,
  due_at: dueAt,
  assigned_to: z.string().uuid().optional(),
}).strict();

export const updateFollowUpSchema = z.object({
  expected_updated_at: dueAt,
  title: title.optional(),
  due_at: dueAt.optional(),
  assigned_to: z.string().uuid().optional(),
  status: status.optional(),
}).strict().refine(
  (input) => [input.title, input.due_at, input.assigned_to, input.status].some((value) => value !== undefined),
  "Choose a change to save"
);

export const followUpQuerySchema = z.object({
  contact_id: z.string().uuid().optional(),
  status: z.enum(["pending", "completed", "all"]).default("pending"),
});
