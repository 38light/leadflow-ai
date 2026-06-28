import { NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createServerClient } from "@/lib/supabase/server";

export interface ChannelFlowNode {
  name: string;
  kind: "channel" | "status";
  rawKey: string;
}

export interface ChannelFlowLink {
  source: number;
  target: number;
  value: number;
}

export interface ChannelFlowData {
  nodes: ChannelFlowNode[];
  links: ChannelFlowLink[];
  total: number;
  days: number;
}

export async function GET(request: Request) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const daysParam = searchParams.get("days");
  const parsedDays = daysParam ? Number.parseInt(daysParam, 10) : 90;
  const days =
    Number.isFinite(parsedDays) && parsedDays > 0 && parsedDays <= 365
      ? parsedDays
      : 90;

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  const supabase = await createServerClient();

  const { data: contacts, error } = await supabase
    .from("contacts")
    .select("source_channel, status")
    .eq("user_id", ctx.ownerId)
    .gte("created_at", sinceISO);

  if (error) {
    console.error("[GET /api/analytics/channel-flow] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch channel flow data" },
      { status: 500 }
    );
  }

  const rows = contacts ?? [];

  // Group by (source_channel, status)
  const pairCounts = new Map<string, number>();
  const channelSet = new Set<string>();
  const statusSet = new Set<string>();

  for (const row of rows) {
    const channel = (row.source_channel ?? "manual") as string;
    const status = (row.status ?? "new") as string;
    channelSet.add(channel);
    statusSet.add(status);
    const key = `${channel}||${status}`;
    pairCounts.set(key, (pairCounts.get(key) ?? 0) + 1);
  }

  // Preserve a sensible ordering
  const CHANNEL_ORDER = [
    "whatsapp",
    "sms",
    "instagram",
    "facebook",
    "voice",
    "web_chat",
    "manual",
    "hubspot",
  ];
  const STATUS_ORDER = [
    "new",
    "contacted",
    "qualified",
    "proposal",
    "negotiation",
    "won",
    "lost",
  ];

  const channels = Array.from(channelSet).sort((a, b) => {
    const ai = CHANNEL_ORDER.indexOf(a);
    const bi = CHANNEL_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const statuses = Array.from(statusSet).sort((a, b) => {
    const ai = STATUS_ORDER.indexOf(a);
    const bi = STATUS_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  // Build nodes array: channels first (left), then statuses (right).
  // Prefix to disambiguate if names collide.
  const nodes: ChannelFlowNode[] = [
    ...channels.map<ChannelFlowNode>((c) => ({
      name: `ch:${c}`,
      kind: "channel",
      rawKey: c,
    })),
    ...statuses.map<ChannelFlowNode>((s) => ({
      name: `st:${s}`,
      kind: "status",
      rawKey: s,
    })),
  ];

  const channelIndex = new Map<string, number>();
  channels.forEach((c, i) => channelIndex.set(c, i));
  const statusIndex = new Map<string, number>();
  statuses.forEach((s, i) => statusIndex.set(s, channels.length + i));

  const links: ChannelFlowLink[] = [];
  let total = 0;
  for (const [key, value] of pairCounts.entries()) {
    const [channel, status] = key.split("||");
    const src = channelIndex.get(channel);
    const tgt = statusIndex.get(status);
    if (src === undefined || tgt === undefined) continue;
    links.push({ source: src, target: tgt, value });
    total += value;
  }

  const payload: ChannelFlowData = {
    nodes,
    links,
    total,
    days,
  };

  return NextResponse.json({ data: payload });
}
