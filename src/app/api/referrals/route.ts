import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";

interface ReferredUser {
  user_id: string;
  business_name: string | null;
  signed_up_at: string;
  subscription_tier: string | null;
}

interface ReferralCreditRow {
  id: string;
  amount_cents: number;
  reason: string;
  related_user_id: string | null;
  created_at: string;
}

// Generate a referral code as a fallback if the trigger hasn't populated one yet.
// Mirrors `generate_referral_code()` in 20260419000002_referrals.sql.
function generateLocalReferralCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 8; i++) {
    result += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return result;
}

function buildAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://leadflow.ai"
  ).replace(/\/$/, "");
}

// GET /api/referrals — returns code, share link, total credits, referred users list
export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerClient();

  // 1. Load (and lazily generate) the user's referral code
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("referral_code")
    .eq("user_id", ctx.ownerId)
    .single();

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  let code: string | null = (profile as { referral_code: string | null } | null)?.referral_code ?? null;

  // App-level fallback: if for some reason the trigger didn't populate a code, generate one.
  if (!code) {
    for (let attempt = 0; attempt < 5 && !code; attempt++) {
      const candidate = generateLocalReferralCode();
      const { data: updated, error: updateError } = await supabase
        .from("profiles")
        .update({ referral_code: candidate })
        .eq("user_id", ctx.ownerId)
        .select("referral_code")
        .single();
      if (!updateError && updated) {
        code = (updated as { referral_code: string }).referral_code;
      }
    }
  }

  if (!code) {
    return NextResponse.json(
      { error: "Could not generate referral code. Please try again." },
      { status: 500 }
    );
  }

  // 2. Load referred users (other profiles whose referred_by_code === our code)
  const { data: referredRows, error: referredError } = await supabase
    .from("profiles")
    .select("user_id, business_name, subscription_tier, created_at")
    .eq("referred_by_code", code);

  if (referredError) {
    return NextResponse.json({ error: referredError.message }, { status: 500 });
  }

  const referredUsers: ReferredUser[] = (referredRows ?? []).map((r) => {
    const row = r as {
      user_id: string;
      business_name: string | null;
      subscription_tier: string | null;
      created_at: string;
    };
    return {
      user_id: row.user_id,
      business_name: row.business_name,
      subscription_tier: row.subscription_tier,
      signed_up_at: row.created_at,
    };
  });

  // 3. Load credits
  const { data: creditRows, error: creditsError } = await supabase
    .from("referral_credits")
    .select("id, amount_cents, reason, related_user_id, created_at")
    .eq("user_id", ctx.ownerId)
    .order("created_at", { ascending: false });

  if (creditsError) {
    return NextResponse.json({ error: creditsError.message }, { status: 500 });
  }

  const credits: ReferralCreditRow[] = (creditRows ?? []) as ReferralCreditRow[];
  const totalCreditsCents = credits.reduce((sum, c) => sum + (c.amount_cents ?? 0), 0);

  const shareLink = `${buildAppUrl()}/register?ref=${encodeURIComponent(code)}`;

  return NextResponse.json({
    data: {
      code,
      share_link: shareLink,
      total_credits_cents: totalCreditsCents,
      referred_users: referredUsers,
      credits,
    },
  });
}
