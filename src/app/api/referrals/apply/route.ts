import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";

const bodySchema = z.object({
  code: z.string().min(1).max(64),
});

// Apply a referral code to the current user's profile.
// Idempotent: only applies when:
//   1. the code is valid (matches another profile's referral_code)
//   2. the code is not the user's own code
//   3. the user does not already have referred_by_code set
export async function POST(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }
  const code = parsed.data.code.trim().toUpperCase();

  const supabase = await createServerClient();

  // Look up current user's profile (need both their own code + existing referred_by_code)
  const { data: ownProfile, error: ownErr } = await supabase
    .from("profiles")
    .select("referral_code, referred_by_code")
    .eq("user_id", ctx.ownerId)
    .single();

  if (ownErr || !ownProfile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const own = ownProfile as { referral_code: string | null; referred_by_code: string | null };

  if (own.referred_by_code) {
    // Already applied — treat as success but note it
    return NextResponse.json({ data: { applied: false, reason: "already_set" } });
  }

  if (own.referral_code && own.referral_code === code) {
    return NextResponse.json({ error: "You can't refer yourself" }, { status: 400 });
  }

  // Validate the code exists
  const { data: referrer } = await supabase
    .from("profiles")
    .select("user_id")
    .eq("referral_code", code)
    .limit(1)
    .single();

  if (!referrer) {
    return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
  }

  const { error: updateErr } = await supabase
    .from("profiles")
    .update({ referred_by_code: code })
    .eq("user_id", ctx.ownerId);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ data: { applied: true } });
}
