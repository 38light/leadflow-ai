import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";

// GET /api/admin/stats — platform-wide statistics (super admin only)
export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminClient = createAdminClient();

  const [
    { count: totalUsers },
    { count: totalContacts },
    { count: totalConversations },
    { count: totalMessages },
  ] = await Promise.all([
    adminClient.from("profiles").select("*", { count: "exact", head: true }),
    adminClient.from("contacts").select("*", { count: "exact", head: true }),
    adminClient.from("conversations").select("*", { count: "exact", head: true }),
    adminClient.from("messages").select("*", { count: "exact", head: true }),
  ]);

  // Subscription breakdown
  const { data: subs } = await adminClient
    .from("profiles")
    .select("subscription_tier");

  const tiers: Record<string, number> = { free: 0, starter: 0, pro: 0, enterprise: 0 };
  for (const s of subs ?? []) {
    const tier = s.subscription_tier ?? "free";
    tiers[tier] = (tiers[tier] ?? 0) + 1;
  }

  return NextResponse.json({
    data: {
      totalUsers: totalUsers ?? 0,
      totalContacts: totalContacts ?? 0,
      totalConversations: totalConversations ?? 0,
      totalMessages: totalMessages ?? 0,
      subscriptionBreakdown: tiers,
    },
  });
}
