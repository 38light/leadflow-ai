import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createBookingSchema } from "@/lib/validators/booking";
import { rateLimitByIp } from "@/lib/rate-limit/chat";

// POST /api/public/booking/[slug]/book — public booking creation
// Validates input, checks slot availability (race condition guard), creates booking
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // Public + unauthenticated: throttle per IP to prevent booking spam / calendar DoS.
  const rl = await rateLimitByIp(request, "booking:create", 10, 3600);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many booking attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": String(Math.max(0, rl.reset - Math.floor(Date.now() / 1000))) } }
    );
  }

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

  // Look up booking settings by slug via a SECURITY DEFINER RPC (the public
  // SELECT policy was dropped to stop cross-tenant enumeration — see migration
  // 20260628000003).
  const { data: settingsRows, error: settingsError } = await supabase.rpc(
    "get_public_booking_settings",
    { p_slug: slug }
  );
  const settings = settingsRows?.[0];

  if (settingsError || !settings) {
    return NextResponse.json(
      { error: "Booking page not found" },
      { status: 404 }
    );
  }

  const userId = settings.user_id;
  const timezone = settings.timezone || "Australia/Sydney";
  const minNoticeHours = settings.min_notice_hours;
  const maxAdvanceDays = settings.max_advance_days;
  const bufferMinutes = settings.buffer_minutes;

  // Validate the service exists and is active
  let serviceDuration: number | null = null;
  if (input.service_id) {
    const { data: service } = await supabase
      .from("services")
      .select("duration_minutes, is_active, price_cents")
      .eq("id", input.service_id)
      .eq("user_id", userId)
      .single();

    if (!service || !service.is_active) {
      return NextResponse.json(
        { error: "Service not found or inactive" },
        { status: 404 }
      );
    }
    serviceDuration = service.duration_minutes;
  }

  // Compute end_time from start_time + service duration (or slot_duration)
  const duration = serviceDuration ?? settings.slot_duration_minutes;
  const endTime = addMinutesToTime(input.start_time, duration);

  // Validate date constraints
  const nowInTz = new Date(
    new Date().toLocaleString("en-US", { timeZone: timezone })
  );
  const todayStr = formatDateLocal(nowInTz);

  // Check date is not in the past
  if (input.booking_date < todayStr) {
    return NextResponse.json(
      { error: "Cannot book a date in the past" },
      { status: 400 }
    );
  }

  // Check min_notice_hours
  if (input.booking_date === todayStr) {
    const minNoticeDate = new Date(
      nowInTz.getTime() + minNoticeHours * 60 * 60 * 1000
    );
    const minNoticeMin =
      minNoticeDate.getHours() * 60 + minNoticeDate.getMinutes();
    const slotStartMin = timeToMinutes(input.start_time);
    if (slotStartMin < minNoticeMin) {
      return NextResponse.json(
        { error: "This time slot does not meet the minimum notice requirement" },
        { status: 400 }
      );
    }
  }

  // Check max_advance_days
  const maxDate = new Date(nowInTz);
  maxDate.setDate(maxDate.getDate() + maxAdvanceDays);
  if (input.booking_date > formatDateLocal(maxDate)) {
    return NextResponse.json(
      { error: "This date is too far in advance" },
      { status: 400 }
    );
  }

  // Validate day_of_week has availability
  const [year, month, day] = input.booking_date.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();

  const { data: availability } = await supabase
    .from("availability_schedules")
    .select("start_time, end_time")
    .eq("user_id", userId)
    .eq("day_of_week", dayOfWeek)
    .eq("is_active", true);

  if (!availability || availability.length === 0) {
    return NextResponse.json(
      { error: "No availability on this day" },
      { status: 400 }
    );
  }

  // Check that the slot falls within an availability window
  const slotStart = timeToMinutes(input.start_time);
  const slotEnd = timeToMinutes(endTime);
  const withinWindow = availability.some((w) => {
    const windowStart = timeToMinutes(w.start_time);
    const windowEnd = timeToMinutes(w.end_time);
    return slotStart >= windowStart && slotEnd <= windowEnd;
  });

  if (!withinWindow) {
    return NextResponse.json(
      { error: "Selected time is outside available hours" },
      { status: 400 }
    );
  }

  // Check blocked dates
  const { data: blockedDates } = await supabase
    .from("blocked_dates")
    .select("all_day, start_time, end_time")
    .eq("user_id", userId)
    .eq("blocked_date", input.booking_date);

  if (blockedDates && blockedDates.length > 0) {
    const isBlocked = blockedDates.some((b) => {
      if (b.all_day) return true;
      if (b.start_time && b.end_time) {
        const blockedStart = timeToMinutes(b.start_time);
        const blockedEnd = timeToMinutes(b.end_time);
        return slotStart < blockedEnd && slotEnd > blockedStart;
      }
      return false;
    });

    if (isBlocked) {
      return NextResponse.json(
        { error: "This time slot is blocked" },
        { status: 400 }
      );
    }
  }

  // Race condition guard: re-check existing bookings right before insert
  const { data: conflictingBookings } = await supabase
    .from("bookings")
    .select("id, start_time, end_time")
    .eq("user_id", userId)
    .eq("booking_date", input.booking_date)
    .in("status", ["pending", "confirmed"]);

  if (conflictingBookings && conflictingBookings.length > 0) {
    const hasConflict = conflictingBookings.some((booking) => {
      const bookingStart = timeToMinutes(booking.start_time) - bufferMinutes;
      const bookingEnd = timeToMinutes(booking.end_time) + bufferMinutes;
      return slotStart < bookingEnd && slotEnd > bookingStart;
    });

    if (hasConflict) {
      return NextResponse.json(
        { error: "This time slot is no longer available" },
        { status: 409 }
      );
    }
  }

  // Create the booking
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      user_id: userId,
      service_id: input.service_id ?? null,
      client_name: input.client_name,
      client_email: input.client_email,
      client_phone: input.client_phone ?? null,
      booking_date: input.booking_date,
      start_time: input.start_time,
      end_time: endTime,
      status: "pending",
      notes: input.notes ?? null,
      location: input.location ?? null,
      area: input.area ?? null,
      payment_status: "unpaid",
      payment_amount_cents: 0,
      metadata: {},
    })
    .select()
    .single();

  if (bookingError) {
    return NextResponse.json(
      { error: bookingError.message },
      { status: 500 }
    );
  }

  // Pipeline auto-advance: if a contact exists with this email/phone, move them
  // to "qualified" (they've committed to a meeting — strong buying signal).
  // Non-blocking: failure here must not fail the booking response.
  try {
    let matchedContact: { id: string; status: string } | null = null;

    if (input.client_email) {
      const { data } = await supabase
        .from("contacts")
        .select("id, status")
        .eq("user_id", userId)
        .eq("email", input.client_email)
        .in("status", ["new", "contacted"])
        .maybeSingle();
      matchedContact = data;
    }

    if (!matchedContact && input.client_phone) {
      const { data } = await supabase
        .from("contacts")
        .select("id, status")
        .eq("user_id", userId)
        .eq("phone", input.client_phone)
        .in("status", ["new", "contacted"])
        .maybeSingle();
      matchedContact = data;
    }

    if (matchedContact) {
      await supabase
        .from("contacts")
        .update({ status: "qualified", temperature: "hot" })
        .eq("id", matchedContact.id);
    }
  } catch (err) {
    console.error("[public-booking] pipeline auto-advance failed:", err);
  }

  return NextResponse.json({ data: booking }, { status: 201 });
}

/**
 * Convert HH:MM or HH:MM:SS time string to total minutes from midnight.
 */
function timeToMinutes(time: string): number {
  const parts = time.split(":").map(Number);
  return parts[0] * 60 + parts[1];
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

/**
 * Format a Date object to YYYY-MM-DD using local date parts.
 */
function formatDateLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
