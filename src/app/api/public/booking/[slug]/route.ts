import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/public/booking/[slug] — public endpoint for booking page data
// Returns booking settings, active services, availability schedules, and blocked dates
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const supabase = await createServerClient();

  // Look up booking settings by slug via a SECURITY DEFINER RPC (the public
  // SELECT policy was dropped to stop cross-tenant enumeration — see migration
  // 20260628000003).
  const { data: settingsRows, error: settingsError } = await supabase.rpc(
    "get_public_booking_settings",
    { p_slug: slug }
  );
  const settings = settingsRows?.[0];

  if (settingsError || !settings) {
    return NextResponse.json(
      { error: "Booking page not found" },
      { status: 404 }
    );
  }

  const userId = settings.user_id;

  // Look up hide_branding from the owning profile (paid plans only)
  const { data: ownerProfile } = await supabase
    .from("profiles")
    .select("hide_branding, subscription_tier")
    .eq("user_id", userId)
    .single();

  const profileRow = (ownerProfile ?? {}) as {
    hide_branding?: boolean | null;
    subscription_tier?: string | null;
  };
  const tier = profileRow.subscription_tier ?? "free";
  const hideBranding = tier !== "free" && Boolean(profileRow.hide_branding);

  // Fetch active services, availability schedules, and blocked dates in parallel
  const [servicesResult, availabilityResult, blockedDatesResult] =
    await Promise.all([
      supabase
        .from("services")
        .select("id, name, description, duration_minutes, price_cents, currency, color, sort_order")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true }),

      supabase
        .from("availability_schedules")
        .select("id, day_of_week, start_time, end_time, is_active")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("day_of_week", { ascending: true })
        .order("start_time", { ascending: true }),

      supabase
        .from("blocked_dates")
        .select("id, blocked_date, reason, all_day, start_time, end_time")
        .eq("user_id", userId)
        .gte("blocked_date", new Date().toISOString().split("T")[0]),
    ]);

  if (servicesResult.error || availabilityResult.error || blockedDatesResult.error) {
    return NextResponse.json(
      { error: "Failed to load booking data" },
      { status: 500 }
    );
  }

  // Return public-safe settings (exclude internal fields)
  const publicSettings = {
    business_name: settings.business_name,
    business_description: settings.business_description,
    logo_url: settings.logo_url,
    min_notice_hours: settings.min_notice_hours,
    max_advance_days: settings.max_advance_days,
    slot_duration_minutes: settings.slot_duration_minutes,
    buffer_minutes: settings.buffer_minutes,
    require_payment: settings.require_payment,
    deposit_amount_cents: settings.deposit_amount_cents,
    confirmation_message: settings.confirmation_message,
    cancellation_policy: settings.cancellation_policy,
    timezone: settings.timezone,
    allowed_areas: settings.allowed_areas,
    hide_branding: hideBranding,
  };

  return NextResponse.json({
    data: {
      settings: publicSettings,
      services: servicesResult.data ?? [],
      availability: availabilityResult.data ?? [],
      blocked_dates: blockedDatesResult.data ?? [],
    },
  });
}
