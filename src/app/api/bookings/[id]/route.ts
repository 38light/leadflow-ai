import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { updateBookingSchema } from "@/lib/validators/booking";
import { deliverWebhookEvent } from "@/lib/webhooks/deliver";
import { sendSlackNotification } from "@/lib/integrations/slack";

// GET /api/bookings/[id] — get a single booking
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("bookings")
    .select("*, service:services(*)")
    .eq("id", id)
    .eq("user_id", ctx.ownerId)
    .single();

  if (error) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

// PUT /api/bookings/[id] — update booking status/notes
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let input;
  try {
    input = updateBookingSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = await createServerClient();

  // Build update payload with status-specific timestamps
  const updatePayload: Record<string, unknown> = { ...input };

  if (input.status === "confirmed") {
    updatePayload.confirmed_at = new Date().toISOString();
  } else if (input.status === "cancelled") {
    updatePayload.cancelled_at = new Date().toISOString();
  } else if (input.status === "completed") {
    updatePayload.completed_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("bookings")
    .update(updatePayload)
    .eq("id", id)
    .eq("user_id", ctx.ownerId)
    .select("*, service:services(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Non-blocking webhook delivery for completed bookings
  if (input.status === "completed") {
    void deliverWebhookEvent(supabase, ctx.ownerId, {
      event: "booking.completed",
      timestamp: new Date().toISOString(),
      data: {
        bookingId: data.id,
        clientName: data.client_name,
        clientEmail: data.client_email,
        bookingDate: data.booking_date,
      },
    }).catch((err) =>
      console.error("[bookings/[id]] webhook delivery failed:", err)
    );
  }

  // Non-blocking Slack notification on confirm/complete
  if (input.status === "confirmed" || input.status === "completed") {
    const slackPromise = (async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("slack_webhook_url, slack_notify_bookings")
          .eq("user_id", ctx.ownerId)
          .single();
        if (profile?.slack_webhook_url && profile.slack_notify_bookings) {
          const verb = input.status === "completed" ? "completed" : "confirmed";
          await sendSlackNotification(profile.slack_webhook_url, {
            text: `Booking ${verb}: *${data.client_name}* on ${data.booking_date} at ${data.start_time}`,
          });
        }
      } catch (err) {
        console.error(
          "[bookings/[id]] Slack notification inner error:",
          err
        );
      }
    })();
    void slackPromise.catch((err) =>
      console.error("[bookings/[id]] Slack notification failed:", err)
    );
  }

  // Post-meeting automation: fire-and-forget when booking is completed
  if (input.status === "completed") {
    try {
      // Find matching contact by client email
      let contactId: string | null = null;
      if (data.client_email) {
        const { data: c } = await supabase
          .from("contacts")
          .select("id")
          .eq("user_id", ctx.ownerId)
          .eq("email", data.client_email)
          .maybeSingle();
        contactId = c?.id ?? null;
      }

      // Create follow-up task as a notification
      const contactLink = contactId ? `/contacts/${contactId}` : `/bookings`;
      await supabase.from("notifications").insert({
        user_id: ctx.ownerId,
        type: "follow_up_task",
        title: `Follow up with ${data.client_name}`,
        body: `Meeting completed on ${data.booking_date}. Send a follow-up message to keep momentum.`,
        link: contactLink,
        read: false,
      });
    } catch (e) {
      console.error("[Booking Complete] Post-meeting automation failed:", e);
    }
  }

  return NextResponse.json({ data });
}

// DELETE /api/bookings/[id] — cancel a booking
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", ctx.ownerId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
