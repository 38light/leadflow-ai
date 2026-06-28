import { NextRequest, NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createAdminClient } from "@/lib/supabase/server";

export interface ActivityEvent {
  id: string;
  action: string;
  label: string;
  created_at: string;
  icon_type: "contact" | "conversation" | "booking" | "message" | "admin";
}

// GET /api/admin/users/[id]/activity — returns recent activity timeline for a user
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const adminClient = createAdminClient();

  // Fetch from multiple tables in parallel
  const [contactsRes, conversationsRes, bookingsRes, messagesRes, auditRes] = await Promise.all([
    adminClient
      .from("contacts")
      .select("id, name, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20),

    adminClient
      .from("conversations")
      .select("id, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20),

    adminClient
      .from("bookings")
      .select("id, client_name, booking_date, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20),

    adminClient
      .from("messages")
      .select("id, created_at")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .limit(20),

    // audit_logs: admin actions taken ON this user
    adminClient
      .from("audit_logs")
      .select("id, action, actor_email, created_at")
      .eq("target_id", id)
      .eq("target_type", "user")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const events: ActivityEvent[] = [];

  // Map contacts
  for (const c of contactsRes.data ?? []) {
    events.push({
      id: `contact-${c.id}`,
      action: "contact.created",
      label: c.name ?? "Unknown contact",
      created_at: c.created_at,
      icon_type: "contact",
    });
  }

  // Map conversations
  for (const c of conversationsRes.data ?? []) {
    events.push({
      id: `conversation-${c.id}`,
      action: "conversation.started",
      label: "Started a conversation",
      created_at: c.created_at,
      icon_type: "conversation",
    });
  }

  // Map bookings
  for (const b of bookingsRes.data ?? []) {
    const dateStr = b.booking_date
      ? new Date(b.booking_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      : "";
    events.push({
      id: `booking-${b.id}`,
      action: "booking.created",
      label: `Booking: ${b.client_name ?? "Client"}${dateStr ? ` — ${dateStr}` : ""}`,
      created_at: b.created_at,
      icon_type: "booking",
    });
  }

  // Map messages (group into a single "count" event per day to avoid noise)
  for (const m of messagesRes.data ?? []) {
    events.push({
      id: `message-${m.id}`,
      action: "message.sent",
      label: "Message sent",
      created_at: m.created_at,
      icon_type: "message",
    });
  }

  // Map audit log entries (admin actions on this user)
  for (const a of auditRes.data ?? []) {
    events.push({
      id: `audit-${a.id}`,
      action: a.action,
      label: `Admin action: ${a.action}${a.actor_email ? ` by ${a.actor_email}` : ""}`,
      created_at: a.created_at,
      icon_type: "admin",
    });
  }

  // Sort by created_at DESC and take last 20
  events.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const top20 = events.slice(0, 20);

  return NextResponse.json({ data: top20 });
}
