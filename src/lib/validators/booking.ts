import { z } from "zod";

// Services
export const createServiceSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional().nullable(),
  duration_minutes: z.number().int().min(15).max(480).default(60),
  price_cents: z.number().int().min(0).default(0),
  currency: z.string().length(3).default("AUD"),
  is_active: z.boolean().default(true),
  color: z.string().max(20).default("#3b82f6"),
  sort_order: z.number().int().default(0),
});

export const updateServiceSchema = createServiceSchema.partial();

// Availability
export const availabilityScheduleSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Use HH:MM format"),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, "Use HH:MM format"),
  is_active: z.boolean().default(true),
});

export const bulkAvailabilitySchema = z.object({
  schedules: z.array(availabilityScheduleSchema),
});

// Blocked dates
export const blockedDateSchema = z.object({
  blocked_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD format"),
  reason: z.string().max(200).optional().nullable(),
  all_day: z.boolean().default(true),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable(),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional().nullable(),
});

// Booking settings
export const bookingSettingsSchema = z.object({
  booking_url_slug: z.string().min(3).max(100).regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens").optional().nullable(),
  business_name: z.string().max(200).optional().nullable(),
  business_description: z.string().max(2000).optional().nullable(),
  logo_url: z.string().url().optional().nullable(),
  min_notice_hours: z.number().int().min(0).max(720).default(24),
  max_advance_days: z.number().int().min(1).max(365).default(90),
  slot_duration_minutes: z.number().int().min(15).max(480).default(60),
  buffer_minutes: z.number().int().min(0).max(120).default(15),
  require_payment: z.boolean().default(false),
  deposit_amount_cents: z.number().int().min(0).default(0),
  confirmation_message: z.string().max(2000).optional(),
  cancellation_policy: z.string().max(2000).optional().nullable(),
  timezone: z.string().max(100).default("Australia/Sydney"),
  allowed_areas: z.array(z.string().max(100)).default([]),
  // Branding lives on `profiles.hide_branding` (account-wide, paid plans only).
  // We accept it here for convenience and the route handler persists it to profiles.
  hide_branding: z.boolean().optional(),
});

// Create booking (public — from client booking page)
export const createBookingSchema = z.object({
  service_id: z.string().uuid().optional().nullable(),
  client_name: z.string().min(1).max(200),
  client_email: z.string().email(),
  client_phone: z.string().max(30).optional().nullable(),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  notes: z.string().max(2000).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  area: z.string().max(200).optional().nullable(),
});

// Update booking (admin)
export const updateBookingSchema = z.object({
  status: z.enum(["pending", "confirmed", "cancelled", "completed", "no_show"]).optional(),
  internal_notes: z.string().max(2000).optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  cancellation_reason: z.string().max(500).optional().nullable(),
  payment_status: z.enum(["unpaid", "deposit_paid", "paid", "refunded"]).optional(),
});
