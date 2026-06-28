import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";

export type JourneyEventType =
  | "message_in"
  | "message_out"
  | "ai_reply"
  | "human_reply"
  | "status_change"
  | "booking_created"
  | "booking_completed"
  | "ai_handoff"
  | "contact_created";

export interface JourneyEvent {
  id: string;
  type: JourneyEventType;
  timestamp: string;
  title: string;
  preview?: string;
  channel?: string;
  metadata?: Record<string, unknown>;
}

interface StatusHistoryEntry {
  status: string;
  at: string;
  from?: string;
}

function truncate(text: string | null | undefined, max = 140): string | undefined {
  if (!text) return undefined;
  const trimmed = text.trim();
  if (!trimmed) return undefined;
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function parseStatusHistory(metadata: unknown): StatusHistoryEntry[] {
  if (!metadata || typeof metadata !== "object") return [];
  const record = metadata as Record<string, unknown>;
  const history = record.status_history;
  if (!Array.isArray(history)) return [];
  return history
    .filter((entry): entry is StatusHistoryEntry => {
      if (!entry || typeof entry !== "object") return false;
      const e = entry as Record<string, unknown>;
      return typeof e.status === "string" && typeof e.at === "string";
    })
    .map((entry) => ({
      status: entry.status,
      at: entry.at,
      from: typeof entry.from === "string" ? entry.from : undefined,
    }));
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createServerClient();

  const searchParams = request.nextUrl.searchParams;
  const limit = Math.min(
    Math.max(parseInt(searchParams.get("limit") ?? "50", 10) || 50, 1),
    200
  );
  const offset = Math.max(
    parseInt(searchParams.get("offset") ?? "0", 10) || 0,
    0
  );

  // Verify contact ownership (IDOR guard)
  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id, name, status, metadata, created_at, source_channel")
    .eq("id", id)
    .eq("user_id", ctx.ownerId)
    .single();

  if (contactError || !contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  // Conversations for this contact (used to scope messages + AI logs)
  const { data: conversations } = await supabase
    .from("conversations")
    .select("id, channel_type, is_ai_active, handoff_at, ai_handoff_reason")
    .eq("contact_id", id)
    .eq("user_id", ctx.ownerId);

  const conversationIds = (conversations ?? []).map((c) => c.id);

  // Fetch in parallel
  const [messagesResult, bookingsResult, aiLogsResult] = await Promise.all([
    conversationIds.length > 0
      ? supabase
          .from("messages")
          .select(
            "id, conversation_id, direction, sender_type, content, channel_type, created_at, metadata"
          )
          .in("conversation_id", conversationIds)
          .eq("user_id", ctx.ownerId)
          .order("created_at", { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("bookings")
      .select(
        "id, status, booking_date, start_time, end_time, created_at, completed_at, cancelled_at, client_name, service_id"
      )
      .eq("contact_id", id)
      .eq("user_id", ctx.ownerId),
    conversationIds.length > 0
      ? supabase
          .from("ai_interaction_logs")
          .select(
            "id, agent_type, model, latency_ms, reasoning, error, created_at, conversation_id"
          )
          .in("conversation_id", conversationIds)
          .eq("user_id", ctx.ownerId)
          .order("created_at", { ascending: false })
          .limit(300)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const events: JourneyEvent[] = [];

  // Contact created event
  events.push({
    id: `contact_created:${contact.id}`,
    type: "contact_created",
    timestamp: contact.created_at,
    title: `Contact created${contact.name ? ` — ${contact.name}` : ""}`,
    preview: contact.source_channel
      ? `Source: ${contact.source_channel}`
      : undefined,
    channel: contact.source_channel ?? undefined,
  });

  // Status history (or fallback single event)
  const history = parseStatusHistory(contact.metadata);
  if (history.length > 0) {
    for (const entry of history) {
      events.push({
        id: `status:${contact.id}:${entry.at}`,
        type: "status_change",
        timestamp: entry.at,
        title: entry.from
          ? `Status changed: ${entry.from} → ${entry.status}`
          : `Status set to ${entry.status}`,
        metadata: { status: entry.status, from: entry.from },
      });
    }
  } else {
    events.push({
      id: `status_initial:${contact.id}`,
      type: "status_change",
      timestamp: contact.created_at,
      title: `Created as ${contact.status}`,
      metadata: { status: contact.status },
    });
  }

  // Messages → message_in / message_out / ai_reply / human_reply
  type MessageRow = {
    id: string;
    conversation_id: string | null;
    direction: string | null;
    sender_type: string | null;
    content: string | null;
    channel_type: string | null;
    created_at: string;
    metadata: unknown;
  };
  const messages = (messagesResult.data ?? []) as MessageRow[];
  for (const msg of messages) {
    let type: JourneyEventType;
    let title: string;
    if (msg.direction === "inbound") {
      type = "message_in";
      title = `Inbound message${msg.channel_type ? ` via ${msg.channel_type}` : ""}`;
    } else if (msg.sender_type === "ai") {
      type = "ai_reply";
      title = `AI reply${msg.channel_type ? ` via ${msg.channel_type}` : ""}`;
    } else if (msg.sender_type === "human") {
      type = "human_reply";
      title = `Human reply${msg.channel_type ? ` via ${msg.channel_type}` : ""}`;
    } else {
      type = "message_out";
      title = `Outbound message${msg.channel_type ? ` via ${msg.channel_type}` : ""}`;
    }
    events.push({
      id: `message:${msg.id}`,
      type,
      timestamp: msg.created_at,
      title,
      preview: truncate(msg.content),
      channel: msg.channel_type ?? undefined,
      metadata: {
        direction: msg.direction,
        sender_type: msg.sender_type,
        conversation_id: msg.conversation_id,
      },
    });
  }

  // AI handoff events — one per conversation that was handed off
  for (const conv of conversations ?? []) {
    if (conv.handoff_at) {
      events.push({
        id: `handoff:${conv.id}`,
        type: "ai_handoff",
        timestamp: conv.handoff_at,
        title: "AI handed off to human",
        preview: conv.ai_handoff_reason ?? undefined,
        channel: conv.channel_type ?? undefined,
        metadata: { conversation_id: conv.id },
      });
    }
  }

  // Bookings
  type BookingRow = {
    id: string;
    status: string;
    booking_date: string | null;
    start_time: string | null;
    end_time: string | null;
    created_at: string;
    completed_at: string | null;
    cancelled_at: string | null;
    client_name: string | null;
    service_id: string | null;
  };
  const bookings = (bookingsResult.data ?? []) as BookingRow[];
  for (const booking of bookings) {
    const when = [booking.booking_date, booking.start_time]
      .filter(Boolean)
      .join(" ");
    events.push({
      id: `booking_created:${booking.id}`,
      type: "booking_created",
      timestamp: booking.created_at,
      title: "Booking created",
      preview: when || undefined,
      metadata: {
        booking_id: booking.id,
        status: booking.status,
        service_id: booking.service_id,
      },
    });
    if (booking.status === "completed" && booking.completed_at) {
      events.push({
        id: `booking_completed:${booking.id}`,
        type: "booking_completed",
        timestamp: booking.completed_at,
        title: "Booking completed",
        preview: when || undefined,
        metadata: { booking_id: booking.id },
      });
    }
  }

  // AI interaction logs — surface only meaningful ones (errors or reasoning with agent type)
  type AILogRow = {
    id: string;
    agent_type: string | null;
    model: string | null;
    latency_ms: number | null;
    reasoning: string | null;
    error: string | null;
    created_at: string;
    conversation_id: string | null;
  };
  const aiLogs = (aiLogsResult.data ?? []) as AILogRow[];
  // De-duplicate: if AI reply already covers a timestamp within 2s, skip log.
  // To keep logic simple, only include logs with errors or reasoning text.
  for (const log of aiLogs) {
    if (!log.error && !log.reasoning) continue;
    events.push({
      id: `ai_log:${log.id}`,
      type: log.error ? "ai_handoff" : "ai_reply",
      timestamp: log.created_at,
      title: log.error
        ? `AI error (${log.agent_type ?? "agent"})`
        : `AI reasoning (${log.agent_type ?? "agent"})`,
      preview: truncate(log.error ?? log.reasoning),
      metadata: {
        agent_type: log.agent_type,
        model: log.model,
        latency_ms: log.latency_ms,
        conversation_id: log.conversation_id,
      },
    });
  }

  // Sort descending (newest first) and paginate
  events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  const total = events.length;
  const paged = events.slice(offset, offset + limit);

  return NextResponse.json({
    data: paged,
    pagination: {
      total,
      limit,
      offset,
      hasMore: offset + paged.length < total,
    },
  });
}
