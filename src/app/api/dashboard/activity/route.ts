import { NextRequest, NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createServerClient } from "@/lib/supabase/server";

export type ActivityEventType =
  | "contact_created"
  | "message_received"
  | "booking_created"
  | "ai_handoff";

export interface ActivityEvent {
  id: string;
  type: ActivityEventType;
  timestamp: string;
  primaryText: string;
  secondaryText: string | null;
  href: string;
  contactId: string | null;
  conversationId: string | null;
}

export interface ActivityResponse {
  data: ActivityEvent[];
}

function clampLimit(raw: string | null): number {
  const parsed = raw ? Number.parseInt(raw, 10) : 20;
  if (!Number.isFinite(parsed) || parsed <= 0) return 20;
  return Math.min(Math.max(parsed, 1), 50);
}

export async function GET(req: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const limit = clampLimit(searchParams.get("limit"));

  const supabase = await createServerClient();
  const ownerId = ctx.ownerId;

  const [contactsRes, messagesRes, bookingsRes, handoffsRes] = await Promise.all([
    supabase
      .from("contacts")
      .select("id, name, source_channel, created_at")
      .eq("user_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("messages")
      .select("id, conversation_id, contact_id, content, channel_type, created_at")
      .eq("user_id", ownerId)
      .eq("direction", "inbound")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("bookings")
      .select("id, client_name, contact_id, booking_date, start_time, created_at")
      .eq("user_id", ownerId)
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("conversations")
      .select("id, contact_id, channel_type, ai_handoff_reason, handoff_at, is_ai_active")
      .eq("user_id", ownerId)
      .eq("is_ai_active", false)
      .not("ai_handoff_reason", "is", null)
      .not("handoff_at", "is", null)
      .order("handoff_at", { ascending: false })
      .limit(limit),
  ]);

  if (contactsRes.error) {
    console.error("[GET /api/dashboard/activity] contacts error:", contactsRes.error);
  }
  if (messagesRes.error) {
    console.error("[GET /api/dashboard/activity] messages error:", messagesRes.error);
  }
  if (bookingsRes.error) {
    console.error("[GET /api/dashboard/activity] bookings error:", bookingsRes.error);
  }
  if (handoffsRes.error) {
    console.error("[GET /api/dashboard/activity] handoffs error:", handoffsRes.error);
  }

  // Resolve contact names for messages/handoffs in a single round-trip.
  const contactIds = new Set<string>();
  for (const m of messagesRes.data ?? []) {
    if (m.contact_id) contactIds.add(m.contact_id);
  }
  for (const h of handoffsRes.data ?? []) {
    if (h.contact_id) contactIds.add(h.contact_id);
  }

  let contactNameMap = new Map<string, string | null>();
  if (contactIds.size > 0) {
    const { data: contactLookups } = await supabase
      .from("contacts")
      .select("id, name")
      .eq("user_id", ownerId)
      .in("id", Array.from(contactIds));
    contactNameMap = new Map(
      (contactLookups ?? []).map((c) => [c.id, c.name ?? null])
    );
  }

  const events: ActivityEvent[] = [];

  for (const c of contactsRes.data ?? []) {
    events.push({
      id: `contact:${c.id}`,
      type: "contact_created",
      timestamp: c.created_at,
      primaryText: `${c.name ?? "New contact"} added`,
      secondaryText: c.source_channel ? `via ${c.source_channel}` : null,
      href: `/contacts/${c.id}`,
      contactId: c.id,
      conversationId: null,
    });
  }

  for (const m of messagesRes.data ?? []) {
    const name = (m.contact_id && contactNameMap.get(m.contact_id)) || "Someone";
    const snippet = (m.content ?? "").trim().slice(0, 60);
    events.push({
      id: `message:${m.id}`,
      type: "message_received",
      timestamp: m.created_at,
      primaryText: `${name} sent a message`,
      secondaryText: snippet
        ? `${m.channel_type} \u2022 ${snippet}`
        : m.channel_type ?? null,
      href: `/conversations/${m.conversation_id}`,
      contactId: m.contact_id,
      conversationId: m.conversation_id,
    });
  }

  for (const b of bookingsRes.data ?? []) {
    events.push({
      id: `booking:${b.id}`,
      type: "booking_created",
      timestamp: b.created_at,
      primaryText: `${b.client_name} booked an appointment`,
      secondaryText: `${b.booking_date} at ${b.start_time}`,
      href: b.contact_id ? `/contacts/${b.contact_id}` : `/bookings`,
      contactId: b.contact_id,
      conversationId: null,
    });
  }

  for (const h of handoffsRes.data ?? []) {
    if (!h.handoff_at) continue;
    const name = (h.contact_id && contactNameMap.get(h.contact_id)) || "Conversation";
    events.push({
      id: `handoff:${h.id}`,
      type: "ai_handoff",
      timestamp: h.handoff_at,
      primaryText: `AI handed off ${name} to a human`,
      secondaryText: h.ai_handoff_reason,
      href: `/conversations/${h.id}`,
      contactId: h.contact_id,
      conversationId: h.id,
    });
  }

  events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const response: ActivityResponse = { data: events.slice(0, limit) };
  return NextResponse.json(response);
}
