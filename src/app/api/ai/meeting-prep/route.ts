import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { callClaude } from "@/lib/ai/claude-client";

/**
 * POST /api/ai/meeting-prep
 *
 * Generates an AI meeting prep brief for a booked appointment.
 * Returns a structured summary of the contact's history, lead score,
 * recent conversation highlights, and suggested talking points.
 *
 * Body: { bookingId: string }
 */

const schema = z.object({
  bookingId: z.string().uuid("bookingId must be a valid UUID"),
});

export async function POST(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const { bookingId } = parsed.data;
  const supabase = await createServerClient();

  // Fetch booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("*, service:services(name, duration_minutes)")
    .eq("id", bookingId)
    .eq("user_id", ctx.ownerId)
    .single();

  if (bookingError || !booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  // Find matching contact by email or phone
  let contactData: Record<string, unknown> | null = null;
  let recentMessages: Array<{ content: string; direction: string; created_at: string }> = [];

  if (booking.client_email) {
    const { data: contact } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", ctx.ownerId)
      .eq("email", booking.client_email)
      .maybeSingle();
    contactData = contact;
  }

  if (!contactData && booking.client_phone) {
    const { data: contact } = await supabase
      .from("contacts")
      .select("*")
      .eq("user_id", ctx.ownerId)
      .eq("phone", booking.client_phone)
      .maybeSingle();
    contactData = contact;
  }

  // Fetch recent conversation messages if contact found
  if (contactData?.id) {
    const { data: conversations } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", ctx.ownerId)
      .eq("contact_id", contactData.id as string)
      .order("last_message_at", { ascending: false })
      .limit(2);

    if (conversations && conversations.length > 0) {
      const conversationIds = conversations.map((c) => c.id);
      const { data: msgs } = await supabase
        .from("messages")
        .select("content, direction, created_at")
        .in("conversation_id", conversationIds)
        .order("created_at", { ascending: false })
        .limit(15);
      recentMessages = msgs ?? [];
    }
  }

  // Build context for Claude
  const contactContext = contactData
    ? [
        `Name: ${contactData.name ?? "Unknown"}`,
        `Status: ${contactData.status ?? "unknown"}`,
        `Temperature: ${contactData.temperature ?? "unknown"}`,
        `Source: ${contactData.source_channel ?? "unknown"}`,
        `Company: ${contactData.company ?? "N/A"}`,
        `Tags: ${Array.isArray(contactData.tags) ? (contactData.tags as string[]).join(", ") : "none"}`,
        contactData.notes ? `Notes: ${contactData.notes}` : null,
      ]
        .filter(Boolean)
        .join("\n")
    : "No existing contact record found. This may be a new lead.";

  const messageContext =
    recentMessages.length > 0
      ? recentMessages
          .slice()
          .reverse()
          .map(
            (m) =>
              `[${m.direction === "inbound" ? "Client" : "Agent"}]: ${m.content}`
          )
          .join("\n")
      : "No prior conversation history.";

  const prompt = `You are a sales intelligence assistant. Generate a concise meeting prep brief for the following appointment.

BOOKING DETAILS:
- Client: ${booking.client_name}
- Email: ${booking.client_email ?? "N/A"}
- Phone: ${booking.client_phone ?? "N/A"}
- Date: ${booking.booking_date} at ${booking.start_time}
- Service: ${typeof booking.service === "object" && booking.service !== null ? (booking.service as Record<string, unknown>).name : "General meeting"}
- Notes: ${booking.notes ?? "None"}

CONTACT RECORD:
${contactContext}

RECENT CONVERSATION HISTORY (last 15 messages):
${messageContext}

Generate a structured meeting prep brief with these sections:
1. **Quick Summary** (2-3 sentences about who this person is and why they're meeting)
2. **Lead Status** (their pipeline stage, temperature, how engaged they've been)
3. **Key Context** (anything important from their conversation history — pain points, objections, interests)
4. **Suggested Talking Points** (3-5 bullet points for this specific meeting)
5. **Watch Out For** (any concerns or objections to be prepared for)

Keep it concise and actionable. Focus on what the rep needs to know BEFORE walking into this call.`;

  try {
    const result = await callClaude({
      systemPrompt: "You are a sales intelligence assistant that generates concise, actionable meeting prep briefs.",
      messages: [{ role: "user", content: prompt }],
      maxTokens: 1024,
    });

    const brief =
      result.response.content[0]?.type === "text"
        ? result.response.content[0].text
        : "";

    return NextResponse.json({
      data: {
        brief,
        booking: {
          id: booking.id,
          clientName: booking.client_name,
          date: booking.booking_date,
          time: booking.start_time,
          service: typeof booking.service === "object" && booking.service !== null
            ? (booking.service as Record<string, unknown>).name
            : "General meeting",
        },
        hasContactRecord: !!contactData,
        messageCount: recentMessages.length,
      },
    });
  } catch (error) {
    console.error("[Meeting Prep] Claude error:", error);
    return NextResponse.json({ error: "Failed to generate brief" }, { status: 500 });
  }
}
