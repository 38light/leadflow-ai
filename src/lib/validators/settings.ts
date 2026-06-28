import { z } from "zod";

export const updateProfileSchema = z.object({
  business_name: z.string().max(200).optional().nullable(),
  business_type: z.string().max(100).optional().nullable(),
  timezone: z.string().max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  website: z.string().url("Invalid URL").max(500).optional().nullable(),
  ai_enabled: z.boolean().optional(),
});

export const updateIntegrationsSchema = z.object({
  hubspot_portal_id: z.string().max(100).optional().nullable(),
  hubspot_access_token: z.string().max(1000).optional().nullable(),
  hubspot_refresh_token: z.string().max(1000).optional().nullable(),
  twilio_account_sid: z.string().max(200).optional().nullable(),
  twilio_auth_token: z.string().max(200).optional().nullable(),
  twilio_phone_number: z.string().max(20).optional().nullable(),
  meta_page_id: z.string().max(200).optional().nullable(),
  meta_access_token: z.string().max(1000).optional().nullable(),
  vapi_api_key: z.string().max(200).optional().nullable(),
  sendgrid_api_key: z.string().max(500).optional().nullable(),
  stripe_secret_key: z.string().max(500).optional().nullable(),
  anthropic_api_key: z.string().max(500).optional().nullable(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UpdateIntegrationsInput = z.infer<typeof updateIntegrationsSchema>;
