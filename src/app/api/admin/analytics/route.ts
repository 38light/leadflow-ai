import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";

// Plan pricing in cents/month
const PLAN_PRICES: Record<string, number> = {
  free: 0,
  starter: 2900,
  professional: 9900,
  pro: 9900, // alias
  enterprise: 29900,
};

function getPlanPrice(tier: string): number {
  return PLAN_PRICES[tier] ?? 0;
}

// GET /api/admin/analytics — enhanced analytics (super admin only)
// Query: ?period=7d|30d|90d (default: 30d)
export async function GET(request: Request) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get("period") ?? "30d";
  const periodDays = periodParam === "7d" ? 7 : periodParam === "90d" ? 90 : 30;

  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - periodDays);

  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const weekStart = new Date(now);
  weekStart.setDate(weekStart.getDate() - 7);

  const monthStart = new Date(now);
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const dau30Start = new Date(now);
  dau30Start.setDate(dau30Start.getDate() - 30);

  const supabase = await createServerClient();

  // ─── Fetch all profiles in one query ───
  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("user_id, subscription_tier, is_active, created_at, updated_at");

  const profiles = allProfiles ?? [];
  const totalUsers = profiles.length;

  // ─── Signups ───
  const signupsToday = profiles.filter(
    (p) => new Date(p.created_at) >= todayStart
  ).length;

  const signupsThisWeek = profiles.filter(
    (p) => new Date(p.created_at) >= weekStart
  ).length;

  const signupsThisMonth = profiles.filter(
    (p) => new Date(p.created_at) >= monthStart
  ).length;

  // Daily signups over the period: bucket by date
  const signupsByDayMap: Record<string, number> = {};
  for (let i = 0; i < periodDays; i++) {
    const d = new Date(periodStart);
    d.setDate(d.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    signupsByDayMap[key] = 0;
  }
  for (const p of profiles) {
    const key = p.created_at.slice(0, 10);
    if (key in signupsByDayMap) {
      signupsByDayMap[key] = (signupsByDayMap[key] ?? 0) + 1;
    }
  }
  const byDay = Object.entries(signupsByDayMap).map(([date, count]) => ({
    date,
    count,
  }));

  // ─── Active users (proxy: updated_at) ───
  const dauThreshold = new Date(now);
  dauThreshold.setDate(dauThreshold.getDate() - 1);

  const wauThreshold = new Date(now);
  wauThreshold.setDate(wauThreshold.getDate() - 7);

  const mauThreshold = new Date(now);
  mauThreshold.setDate(mauThreshold.getDate() - 30);

  const dau = profiles.filter(
    (p) => p.updated_at && new Date(p.updated_at) >= dauThreshold
  ).length;

  const wau = profiles.filter(
    (p) => p.updated_at && new Date(p.updated_at) >= wauThreshold
  ).length;

  const mau = profiles.filter(
    (p) => p.updated_at && new Date(p.updated_at) >= mauThreshold
  ).length;

  // ─── Plan distribution ───
  const planCounts: Record<string, number> = {
    free: 0,
    starter: 0,
    professional: 0,
    enterprise: 0,
  };
  for (const p of profiles) {
    const tier = p.subscription_tier ?? "free";
    // Normalize "pro" -> "professional"
    const normalized = tier === "pro" ? "professional" : tier;
    if (normalized in planCounts) {
      planCounts[normalized] = (planCounts[normalized] ?? 0) + 1;
    } else {
      planCounts.free = (planCounts.free ?? 0) + 1;
    }
  }

  // ─── MRR / ARR ───
  let totalMrrCents = 0;
  const mrrByPlanMap: Record<string, { users: number; mrr_cents: number }> = {
    free: { users: 0, mrr_cents: 0 },
    starter: { users: 0, mrr_cents: 0 },
    professional: { users: 0, mrr_cents: 0 },
    enterprise: { users: 0, mrr_cents: 0 },
  };

  for (const p of profiles) {
    const tier = p.subscription_tier ?? "free";
    const normalized = tier === "pro" ? "professional" : tier;
    const price = getPlanPrice(tier);
    totalMrrCents += price;

    const planKey = normalized in mrrByPlanMap ? normalized : "free";
    if (mrrByPlanMap[planKey]) {
      mrrByPlanMap[planKey].users += 1;
      mrrByPlanMap[planKey].mrr_cents += price;
    }
  }

  const mrrByPlan = Object.entries(mrrByPlanMap).map(([plan, val]) => ({
    plan,
    users: val.users,
    mrr_cents: val.mrr_cents,
  }));

  const arrTotalCents = totalMrrCents * 12;

  // ─── Churn (approximate) ───
  // Count profiles where is_active is false and created_at > 7 days ago
  // These are users who signed up (not brand new) and are now inactive
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const cancelledThisMonth = profiles.filter(
    (p) =>
      p.is_active === false &&
      new Date(p.created_at) <= sevenDaysAgo
  ).length;

  // Churn rate = churned / (paid users last month)
  const paidUsers = profiles.filter(
    (p) => (p.subscription_tier ?? "free") !== "free"
  ).length;
  const churnRatePct =
    paidUsers > 0
      ? Math.round((cancelledThisMonth / paidUsers) * 1000) / 10
      : 0;

  // ─── Conversion (trial → paid) ───
  // Approximate: treat "starter" tier as conversion from free
  const totalTrials = profiles.filter(
    (p) => (p.subscription_tier ?? "free") === "free"
  ).length;
  const totalPaid = paidUsers;
  const trialToPaidPct =
    totalUsers > 0
      ? Math.round((totalPaid / totalUsers) * 1000) / 10
      : 0;

  return NextResponse.json({
    data: {
      signups: {
        today: signupsToday,
        this_week: signupsThisWeek,
        this_month: signupsThisMonth,
        by_day: byDay,
      },
      active_users: {
        dau,
        wau,
        mau,
      },
      plans: {
        free: planCounts.free ?? 0,
        starter: planCounts.starter ?? 0,
        professional: planCounts.professional ?? 0,
        enterprise: planCounts.enterprise ?? 0,
      },
      churn: {
        cancelled_this_month: cancelledThisMonth,
        churn_rate_pct: churnRatePct,
      },
      mrr: {
        total_cents: totalMrrCents,
        by_plan: mrrByPlan,
      },
      arr: {
        total_cents: arrTotalCents,
      },
      conversion: {
        trial_to_paid_pct: trialToPaidPct,
        total_trials: totalTrials,
        total_paid: totalPaid,
      },
      total_users: totalUsers,
    },
  });
}
