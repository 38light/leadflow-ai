import { NextRequest, NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createServerClient } from "@/lib/supabase/server";

export interface WaterfallSettings {
  staleDays: number;
  sequence: string[];
}

const DEFAULT_SETTINGS: WaterfallSettings = {
  staleDays: 3,
  sequence: ["whatsapp", "sms", "email", "manual_call"],
};

export async function GET(req: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const staleDays = Math.max(1, Number(searchParams.get("days") ?? DEFAULT_SETTINGS.staleDays));

  const supabase = await createServerClient();
  const ownerId = ctx.ownerId;

  // Threshold date: contacts not interacted with for staleDays+ days
  const threshold = new Date();
  threshold.setDate(threshold.getDate() - staleDays);
  const thresholdISO = threshold.toISOString();

  // Fetch stalled contacts: last_interaction_at older than threshold, active statuses
  const { data: stalledContacts, error: contactsError } = await supabase
    .from("contacts")
    .select("*")
    .eq("user_id", ownerId)
    .not("status", "in", '("won","lost","new")')
    .or(`last_interaction_at.lt.${thresholdISO},last_interaction_at.is.null`)
    .order("last_interaction_at", { ascending: true, nullsFirst: true })
    .limit(50);

  if (contactsError) {
    console.error("[GET /api/automation/waterfall] contacts error:", contactsError);
    return NextResponse.json({ error: "Failed to fetch stalled contacts" }, { status: 500 });
  }

  const contacts = stalledContacts ?? [];

  if (contacts.length === 0) {
    return NextResponse.json({
      data: {
        stalled: [],
        settings: { ...DEFAULT_SETTINGS, staleDays },
      },
    });
  }

  // Fetch the most recent conversation for each stalled contact to determine last channel
  const contactIds = contacts.map((c) => c.id);

  const { data: recentConvs, error: convsError } = await supabase
    .from("conversations")
    .select("contact_id, channel_type, created_at")
    .eq("user_id", ownerId)
    .in("contact_id", contactIds)
    .order("created_at", { ascending: false });

  if (convsError) {
    console.error("[GET /api/automation/waterfall] conversations error:", convsError);
    // Non-fatal: return contacts without channel info
  }

  // Build a map of contactId -> most recent channel
  const lastChannelMap = new Map<string, string>();
  for (const conv of recentConvs ?? []) {
    if (!lastChannelMap.has(conv.contact_id)) {
      lastChannelMap.set(conv.contact_id, conv.channel_type ?? "unknown");
    }
  }

  // Attach lastChannel to each contact result
  const stalledWithChannel = contacts.map((c) => ({
    ...c,
    last_channel: lastChannelMap.get(c.id) ?? c.source_channel ?? "unknown",
  }));

  return NextResponse.json({
    data: {
      stalled: stalledWithChannel,
      settings: { ...DEFAULT_SETTINGS, staleDays },
    },
  });
}
