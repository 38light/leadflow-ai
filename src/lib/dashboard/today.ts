import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthContext } from "@/lib/auth/get-user";
import { canEditFollowUps, FOLLOW_UP_LIMIT, getAssignees, listFollowUps } from "@/lib/follow-ups/service";
import type { TodayApproval, TodayBooking, TodayData, TodayReply } from "@/types/today";

export function validTimezone(timezone: string | null | undefined): string {
  try {
    if (timezone) {
      new Intl.DateTimeFormat("en", { timeZone: timezone }).format();
      return timezone;
    }
  } catch { /* A stale profile setting should not make the day view unavailable. */ }
  return "Australia/Sydney";
}

function dateKey(date: Date, formatter: Intl.DateTimeFormat): string {
  const parts = formatter.formatToParts(date);
  const part = (type: string) => parts.find((value) => value.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

/** First instant in a local calendar date, including 23/25-hour DST days. */
function startOfLocalDate(date: string, formatter: Intl.DateTimeFormat): number {
  const nominal = Date.parse(`${date}T00:00:00.000Z`);
  let low = nominal - 36 * 60 * 60 * 1000;
  let high = nominal + 36 * 60 * 60 * 1000;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (dateKey(new Date(middle), formatter) < date) low = middle + 1;
    else high = middle;
  }
  return low;
}

export function businessDayBounds(now: Date, timezone: string) {
  if (!Number.isFinite(now.getTime())) throw new Error("Invalid reference date");
  const zone = validTimezone(timezone);
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit", calendar: "gregory", numberingSystem: "latn",
  });
  const businessDate = dateKey(now, formatter);
  const nextNominal = new Date(`${businessDate}T00:00:00.000Z`);
  nextNominal.setUTCDate(nextNominal.getUTCDate() + 1);
  const tomorrow = nextNominal.toISOString().slice(0, 10);
  return {
    timezone: zone,
    businessDate,
    start: new Date(startOfLocalDate(businessDate, formatter)).toISOString(),
    end: new Date(startOfLocalDate(tomorrow, formatter)).toISOString(),
    localTime: new Intl.DateTimeFormat("en-GB", { timeZone: zone, hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).format(now),
  };
}

interface ApprovalRecord {
  id: string; contact_id: string | null; conversation_id: string | null;
  draft_content: string; reasoning: string | null; created_at: string;
  contact: { name: string | null; email: string | null; phone: string | null } | null;
  conversation: { channel_type: string } | null;
}

interface ReplyRecord {
  id: string; contact_id: string; contact_name: string; channel: string;
  last_message_at: string; preview: string; total_count: number;
}

export async function loadToday(supabase: SupabaseClient, ctx: AuthContext, now = new Date()): Promise<TodayData> {
  const { data: timezone, error: profileError } = await supabase.rpc("today_timezone", { p_owner_id: ctx.ownerId });
  if (profileError) throw profileError;
  const day = businessDayBounds(now, validTimezone(timezone));
  const [followUps, assignees, approvalsResult, repliesResult, bookingsResult, completedResult] = await Promise.all([
    listFollowUps(supabase, ctx.ownerId, { status: "pending" }),
    getAssignees(supabase, ctx.ownerId, ctx.user.id),
    supabase.from("ai_approvals")
      .select("id,contact_id,conversation_id,draft_content,reasoning,created_at,contact:contacts(name,email,phone),conversation:conversations(channel_type)", { count: "exact" })
      .eq("user_id", ctx.ownerId).eq("status", "pending").order("created_at").limit(FOLLOW_UP_LIMIT),
    supabase.rpc("today_needs_reply", { p_owner_id: ctx.ownerId, p_limit: FOLLOW_UP_LIMIT }),
    supabase.from("bookings")
      .select("id,contact_id,client_name,booking_date,start_time,end_time,status", { count: "exact" })
      .eq("user_id", ctx.ownerId).eq("booking_date", day.businessDate).in("status", ["pending", "confirmed"])
      .gte("end_time", day.localTime).order("start_time").limit(FOLLOW_UP_LIMIT),
    supabase.from("follow_ups").select("id", { count: "exact", head: true })
      .eq("user_id", ctx.ownerId).eq("status", "completed").gte("completed_at", day.start).lt("completed_at", day.end),
  ]);
  for (const result of [approvalsResult, repliesResult, bookingsResult, completedResult]) {
    if (result.error) throw result.error;
  }
  const approvals: TodayApproval[] = ((approvalsResult.data ?? []) as unknown as ApprovalRecord[]).map((row) => ({
    id: row.id, contactId: row.contact_id, conversationId: row.conversation_id,
    contactName: row.contact?.name || row.contact?.email || row.contact?.phone || "Customer",
    channel: row.conversation?.channel_type ?? "unknown", draftContent: row.draft_content,
    reasoning: row.reasoning, createdAt: row.created_at,
  }));
  const replyRows = (repliesResult.data ?? []) as ReplyRecord[];
  const needsReply: TodayReply[] = replyRows.map((row) => ({
    id: row.id, contactId: row.contact_id, contactName: row.contact_name,
    channel: row.channel, lastMessageAt: row.last_message_at, preview: row.preview,
  }));
  const bookings: TodayBooking[] = (bookingsResult.data ?? []).map((row) => ({
    id: row.id, contactId: row.contact_id, clientName: row.client_name, bookingDate: row.booking_date,
    startTime: row.start_time, endTime: row.end_time, status: row.status,
  }));
  const totals = {
    followUps: followUps.total, approvals: approvalsResult.count ?? 0,
    needsReply: Number(replyRows[0]?.total_count ?? 0), bookings: bookingsResult.count ?? 0,
  };
  return {
    timezone: day.timezone, businessDate: day.businessDate,
    canEdit: canEditFollowUps(ctx), currentUserId: ctx.user.id, assignees,
    followUps: followUps.data, approvals, needsReply, bookings,
    completedToday: completedResult.count ?? 0, totals,
    truncated: (Object.keys(totals) as Array<keyof typeof totals>).filter((key) => totals[key] > FOLLOW_UP_LIMIT),
  };
}
