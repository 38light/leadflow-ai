import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createBookingSchema } from "@/lib/validators/booking";
import { sendSlackNotification } from "@/lib/integrations/slack";

// GET /api/bookings — list bookings for the owner (with optional date filters)
export async function GET(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerClient();
  const searchParams = request.nextUrl.searchParams;
  const dateFrom = searchParams.get("date_from");
  const dateTo = searchParams.get("date_to");
  const status = searchParams.get("status");

  let query = supabase
    .from("bookings")
    .select("*, service:services(*)")
    .eq("user_id", ctx.ownerId)
    .order("booking_date", { ascending: true })
    .order("start_time", { ascending: true });

  if (dateFrom) {
    query = query.gte("booking_date", dateFrom);
  }
  if (dateTo) {
    query = query.lte("booking_date", dateTo);
  }
  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/bookings — create a booking (admin)
export async function POST(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let input;
  try {
    input = createBookingSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = await createServerClient();

  // If a service_id is provided, look up the service to get duration
  let endTime = input.start_time;
  if (input.service_id) {
    const { data: service } = await supabase
      .from("services")
      .select("duration_minutes")
      .eq("id", input.service_id)
      .eq("user_id", ctx.ownerId)
      .single();

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    endTime = addMinutesToTime(input.start_time, service.duration_minutes);
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      user_id: ctx.ownerId,
      service_id: input.service_id ?? null,
      client_name: input.client_name,
      client_email: input.client_email,
      client_phone: input.client_phone ?? null,
      booking_date: input.booking_date,
      start_time: input.start_time,
      end_time: endTime,
      notes: input.notes ?? null,
      location: input.location ?? null,
      area: input.area ?? null,
      status: "pending",
      payment_status: "unpaid",
      payment_amount_cents: 0,
      metadata: {},
    })
    .select("*, service:services(*)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Pipeline auto-advance: booking created = qualified lead
  try {
    let matchedContact: { id: string } | null = null;

    if (input.client_email) {
      const { data: byEmail } = await supabase
        .from("contacts")
        .select("id")
        .eq("user_id", ctx.ownerId)
        .eq("email", input.client_email)
        .in("status", ["new", "contacted"])
        .maybeSingle();
      matchedContact = byEmail;
    }

    if (!matchedContact && input.client_phone) {
      const { data: byPhone } = await supabase
        .from("contacts")
        .select("id")
        .eq("user_id", ctx.ownerId)
        .eq("phone", input.client_phone)
        .in("status", ["new", "contacted"])
        .maybeSingle();
      matchedContact = byPhone;
    }

    if (matchedContact) {
      await supabase
        .from("contacts")
        .update({ status: "qualified", temperature: "hot" })
        .eq("id", matchedContact.id);
    }
  } catch (e) {
    console.error("[Bookings] Pipeline auto-advance failed (non-fatal):", e);
  }

  // Non-blocking Slack notification on booking created
  void (async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("slack_webhook_url, slack_notify_bookings")
        .eq("user_id", ctx.ownerId)
        .single();
      if (profile?.slack_webhook_url && profile.slack_notify_bookings) {
        await sendSlackNotification(profile.slack_webhook_url, {
          text: `New booking: *${data.client_name}* on ${data.booking_date} at ${data.start_time}`,
        });
      }
    } catch {
      // swallow
    }
  })();

  return NextResponse.json({ data }, { status: 201 });
}

/**
 * Add minutes to a HH:MM time string and return HH:MM.
 */
function addMinutesToTime(time: string, minutes: number): string {
  const [h, m] = time.split(":").map(Number);
  const totalMinutes = h * 60 + m + minutes;
  const newH = Math.floor(totalMinutes / 60) % 24;
  const newM = totalMinutes % 60;
  return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
}
