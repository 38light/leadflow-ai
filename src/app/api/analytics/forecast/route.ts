import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";

const STAGE_PROBABILITIES: Record<string, number> = {
  new: 0.05,
  contacted: 0.10,
  qualified: 0.25,
  proposal: 0.40,
  negotiation: 0.65,
  won: 1.0,
  lost: 0.0,
};

const DEFAULT_DEAL_VALUE = 500; // $500 default if no paid bookings

export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerClient();

  // Query contacts grouped by status
  const { data: contacts, error: contactsError } = await supabase
    .from("contacts")
    .select("status")
    .eq("user_id", ctx.ownerId);

  if (contactsError) {
    return NextResponse.json({ error: contactsError.message }, { status: 500 });
  }

  // Count contacts per stage
  const stageCounts: Record<string, number> = {};
  for (const contact of contacts ?? []) {
    const stage = contact.status ?? "new";
    stageCounts[stage] = (stageCounts[stage] ?? 0) + 1;
  }

  // Query paid bookings for avg deal value
  const { data: paidBookings, error: bookingsError } = await supabase
    .from("bookings")
    .select("payment_amount_cents")
    .eq("user_id", ctx.ownerId)
    .eq("payment_status", "paid");

  if (bookingsError) {
    return NextResponse.json({ error: bookingsError.message }, { status: 500 });
  }

  // Calculate avg booking value
  const paidCount = paidBookings?.length ?? 0;
  const paidSum = (paidBookings ?? []).reduce(
    (sum, b) => sum + (b.payment_amount_cents ?? 0),
    0
  );
  const avgDealValueCents = paidCount > 0 ? paidSum / paidCount : DEFAULT_DEAL_VALUE * 100;
  const avgDealValue = Math.round(avgDealValueCents / 100);

  // Query won contacts this month
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { data: wonThisMonthContacts } = await supabase
    .from("contacts")
    .select("id")
    .eq("user_id", ctx.ownerId)
    .eq("status", "won")
    .gte("updated_at", startOfMonth);

  const wonThisMonth = wonThisMonthContacts?.length ?? 0;
  const wonValueThisMonth = wonThisMonth * avgDealValue;

  // Build pipeline data for all known stages
  const stageOrder = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
  const pipeline = stageOrder
    .filter((stage) => (stageCounts[stage] ?? 0) > 0)
    .map((stage) => {
      const count = stageCounts[stage] ?? 0;
      const probability = STAGE_PROBABILITIES[stage] ?? 0;
      const value = Math.round(count * avgDealValue * probability);
      return { stage, count, probability, value };
    });

  const totalWeightedValue = pipeline.reduce((sum, p) => sum + p.value, 0);
  const totalPipelineCount = pipeline.reduce((sum, p) => sum + p.count, 0);

  return NextResponse.json({
    data: {
      pipeline,
      totalWeightedValue,
      totalPipelineCount,
      avgDealValue,
      wonThisMonth,
      wonValueThisMonth,
    },
  });
}
