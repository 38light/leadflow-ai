import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAPIContext } from "@/lib/auth/get-user";
import { createServerClient } from "@/lib/supabase/server";

const FUNNEL_STAGES = [
  "new",
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
  "won",
] as const;

type FunnelStage = (typeof FUNNEL_STAGES)[number];

const sourceChannels = [
  "whatsapp",
  "instagram",
  "facebook",
  "sms",
  "voice",
  "web_chat",
  "manual",
  "hubspot",
] as const;

const querySchema = z.object({
  days: z.coerce.number().int().min(1).max(3650).default(90),
  source_channel: z.enum(sourceChannels).optional(),
});

export interface FunnelStageResult {
  stage: FunnelStage;
  count: number;
  drop_off_pct: number; // % drop vs previous stage (0 for "new")
  conversion_pct: number; // % of "new" that reached this stage
}

export interface FunnelResponse {
  stages: FunnelStageResult[];
  overallConversionPct: number; // new -> won
  totalLost: number;
  totalContacts: number;
  days: number;
  sourceChannel: string | null;
}

export async function GET(req: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    days: searchParams.get("days") ?? undefined,
    source_channel: searchParams.get("source_channel") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query parameters", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const { days, source_channel } = parsed.data;

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  const supabase = await createServerClient();
  const ownerId = ctx.ownerId;

  let query = supabase
    .from("contacts")
    .select("status")
    .eq("user_id", ownerId)
    .gte("created_at", sinceISO);

  if (source_channel) {
    query = query.eq("source_channel", source_channel);
  }

  const { data: contacts, error } = await query;

  if (error) {
    console.error("[GET /api/analytics/funnel] contacts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch funnel data" },
      { status: 500 }
    );
  }

  const rows = contacts ?? [];

  // Count each status
  const counts: Record<string, number> = {};
  for (const row of rows) {
    const s = (row.status as string) ?? "new";
    counts[s] = (counts[s] ?? 0) + 1;
  }

  const totalLost = counts["lost"] ?? 0;

  // Cumulative count per stage: contacts at stage X include all contacts that
  // reached or passed stage X (i.e. current status index >= stage index).
  const stageIndex: Record<string, number> = {};
  FUNNEL_STAGES.forEach((s, i) => {
    stageIndex[s] = i;
  });

  // Build "reached" counts per stage: # of contacts whose status is this stage or further.
  // "lost" is excluded from forward progress — they drop out wherever they are,
  // but since we don't track their max stage, they are counted only as lost.
  const reachedAt: number[] = FUNNEL_STAGES.map((stage) => {
    const idx = stageIndex[stage];
    let n = 0;
    for (const s in counts) {
      const sIdx = stageIndex[s];
      if (sIdx !== undefined && sIdx >= idx) {
        n += counts[s];
      }
    }
    return n;
  });

  const newCount = reachedAt[0] ?? 0;

  const stages: FunnelStageResult[] = FUNNEL_STAGES.map((stage, i) => {
    const count = reachedAt[i] ?? 0;
    const prev = i === 0 ? count : reachedAt[i - 1] ?? 0;
    const dropOff = i === 0 || prev === 0 ? 0 : ((prev - count) / prev) * 100;
    const conversion = newCount === 0 ? 0 : (count / newCount) * 100;
    return {
      stage,
      count,
      drop_off_pct: Math.round(dropOff * 10) / 10,
      conversion_pct: Math.round(conversion * 10) / 10,
    };
  });

  const wonCount = counts["won"] ?? 0;
  const overallConversionPct =
    newCount === 0 ? 0 : Math.round((wonCount / newCount) * 1000) / 10;

  const response: FunnelResponse = {
    stages,
    overallConversionPct,
    totalLost,
    totalContacts: rows.length,
    days,
    sourceChannel: source_channel ?? null,
  };

  return NextResponse.json({ data: response });
}
