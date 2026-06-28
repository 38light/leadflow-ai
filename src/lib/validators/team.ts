import { z } from "zod";

export const teamRoleSchema = z.enum(["admin", "member", "viewer"]);

export const inviteTeamMemberSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: teamRoleSchema.default("member"),
});

export const updateTeamMemberSchema = z.object({
  role: teamRoleSchema,
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(1, "Token is required"),
});
