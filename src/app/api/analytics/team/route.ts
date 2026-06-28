import { NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerClient();
  const ownerId = ctx.ownerId;

  // Compute date 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

  // Fetch all needed data in parallel
  const [
    { data: allConversations, error: convsError },
    { data: aiLogs, error: logsError },
  ] = await Promise.all([
    supabase
      .from("conversations")
      .select("id, channel_type, is_ai_active, handoff_at, created_at")
      .eq("user_id", ownerId)
      .gte("created_at", thirtyDaysAgoISO),
    supabase
      .from("ai_interaction_logs")
      .select("latency_ms, created_at")
      .eq("user_id", ownerId)
      .gte("created_at", thirtyDaysAgoISO),
  ]);

  if (convsError) {
    console.error("[GET /api/analytics/team] conversations error:", convsError);
    return NextResponse.json({ error: "Failed to fetch conversation data" }, { status: 500 });
  }

  if (logsError) {
    console.error("[GET /api/analytics/team] ai_interaction_logs error:", logsError);
    return NextResponse.json({ error: "Failed to fetch AI log data" }, { status: 500 });
  }

  const conversations = allConversations ?? [];
  const logs = aiLogs ?? [];

  // ── Summary stats ────────────────────────────────────────────────────────────

  const totalConversations = conversations.length;

  // AI resolved = is_ai_active is true (never handed off, or ai stayed active)
  const aiResolved = conversations.filter((c) => c.is_ai_active === true).length;
  const humanHandled = totalConversations - aiResolved;
  const aiResolutionRate =
    totalConversations > 0 ? Math.round((aiResolved / totalConversations) * 100) : 0;

  // Avg response time from AI interaction logs
  const latencies = logs
    .map((l) => l.latency_ms)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const avgResponseTimeMs =
    latencies.length > 0
      ? Math.round(latencies.reduce((sum, v) => sum + v, 0) / latencies.length)
      : 0;

  // Total messages: count from logs as a proxy (each log = one AI turn)
  // Use conversation count * estimated 3 messages as fallback when no logs
  const totalMessages = logs.length;

  // ── By channel breakdown ─────────────────────────────────────────────────────

  const channelMap = new Map<string, { count: number; aiCount: number }>();
  for (const conv of conversations) {
    const ch = conv.channel_type ?? "unknown";
    if (!channelMap.has(ch)) {
      channelMap.set(ch, { count: 0, aiCount: 0 });
    }
    const entry = channelMap.get(ch)!;
    entry.count++;
    if (conv.is_ai_active) entry.aiCount++;
  }

  const byChannel = Array.from(channelMap.entries())
    .map(([channel, { count, aiCount }]) => ({
      channel,
      count,
      aiRate: count > 0 ? Math.round((aiCount / count) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);

  // ── Daily volume for last 14 days ────────────────────────────────────────────

  const today = new Date();
  const dailyMap = new Map<string, { conversations: number; messages: number }>();

  // Pre-populate last 14 days with zeros
  for (let i = 13; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    dailyMap.set(dateStr, { conversations: 0, messages: 0 });
  }

  // Count conversations per day
  for (const conv of conversations) {
    const dateStr = conv.created_at.slice(0, 10);
    if (dailyMap.has(dateStr)) {
      dailyMap.get(dateStr)!.conversations++;
    }
  }

  // Count AI log interactions per day as proxy for message volume
  for (const log of logs) {
    const dateStr = log.created_at.slice(0, 10);
    if (dailyMap.has(dateStr)) {
      dailyMap.get(dateStr)!.messages++;
    }
  }

  const dailyVolume = Array.from(dailyMap.entries())
    .map(([date, { conversations: convCount, messages: msgCount }]) => ({
      date,
      conversations: convCount,
      messages: msgCount,
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return NextResponse.json({
    data: {
      summary: {
        totalConversations,
        aiResolved,
        humanHandled,
        aiResolutionRate,
        avgResponseTimeMs,
        totalMessages,
      },
      byChannel,
      dailyVolume,
    },
  });
}
