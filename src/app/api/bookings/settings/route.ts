import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { bookingSettingsSchema } from "@/lib/validators/booking";

interface ProfileBrandingFields {
  hide_branding: boolean;
  subscription_tier: string;
}

async function loadProfileBranding(
  supabase: Awaited<ReturnType<typeof createServerClient>>,
  ownerId: string
): Promise<ProfileBrandingFields> {
  const { data } = await supabase
    .from("profiles")
    .select("hide_branding, subscription_tier")
    .eq("user_id", ownerId)
    .single();

  const row = (data ?? {}) as { hide_branding?: boolean | null; subscription_tier?: string | null };

  return {
    hide_branding: Boolean(row.hide_branding),
    subscription_tier: row.subscription_tier ?? "free",
  };
}

// GET /api/bookings/settings — get booking settings (create default if not exists).
// Response merges in profile-level branding fields (hide_branding, subscription_tier)
// so the Settings UI can render the toggle + paid-plan gating.
export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerClient();

  const branding = await loadProfileBranding(supabase, ctx.ownerId);

  // Try to get existing settings
  const { data: existing, error: fetchError } = await supabase
    .from("booking_settings")
    .select("*")
    .eq("user_id", ctx.ownerId)
    .limit(1)
    .single();

  if (existing) {
    return NextResponse.json({ data: { ...existing, ...branding } });
  }

  // If not found (PGRST116 = no rows), create default settings
  if (fetchError && fetchError.code === "PGRST116") {
    const { data: created, error: createError } = await supabase
      .from("booking_settings")
      .insert({ user_id: ctx.ownerId })
      .select()
      .single();

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    return NextResponse.json({ data: { ...created, ...branding } }, { status: 201 });
  }

  // Other errors
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { ...existing!, ...branding } });
}

// PUT /api/bookings/settings — update booking settings.
// `hide_branding` is split off and saved on `profiles` (paid plans only).
export async function PUT(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let input;
  try {
    input = bookingSettingsSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = await createServerClient();

  // Pull `hide_branding` out — it goes to profiles, not booking_settings
  const { hide_branding, ...settingsInput } = input;

  // Check if slug is unique (if provided)
  if (settingsInput.booking_url_slug) {
    const { data: slugCheck } = await supabase
      .from("booking_settings")
      .select("id")
      .eq("booking_url_slug", settingsInput.booking_url_slug)
      .neq("user_id", ctx.ownerId)
      .limit(1)
      .single();

    if (slugCheck) {
      return NextResponse.json(
        { error: "This booking URL slug is already taken" },
        { status: 409 }
      );
    }
  }

  // Upsert: update if exists, insert if not
  const { data: existing } = await supabase
    .from("booking_settings")
    .select("id")
    .eq("user_id", ctx.ownerId)
    .limit(1)
    .single();

  let data;
  let error;

  if (existing) {
    const result = await supabase
      .from("booking_settings")
      .update(settingsInput)
      .eq("user_id", ctx.ownerId)
      .select()
      .single();
    data = result.data;
    error = result.error;
  } else {
    const result = await supabase
      .from("booking_settings")
      .insert({ ...settingsInput, user_id: ctx.ownerId })
      .select()
      .single();
    data = result.data;
    error = result.error;
  }

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // Persist hide_branding on the profile — but only if the user is on a paid plan.
  // (Server-side gate: even if a malicious client sends `hide_branding=true`, free users won't get it.)
  let branding = await loadProfileBranding(supabase, ctx.ownerId);
  if (typeof hide_branding === "boolean" && branding.subscription_tier !== "free") {
    const { error: brandingErr } = await supabase
      .from("profiles")
      .update({ hide_branding })
      .eq("user_id", ctx.ownerId);
    if (!brandingErr) {
      branding = { ...branding, hide_branding };
    }
  }

  return NextResponse.json({ data: { ...data, ...branding } });
}
