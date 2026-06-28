import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

interface TimeSlot {
  start_time: string;
  end_time: string;
}

// GET /api/public/booking/[slug]/slots?date=YYYY-MM-DD&service_id=xxx
// Computes and returns available time slots for a given date
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const searchParams = request.nextUrl.searchParams;
  const dateStr = searchParams.get("date");
  const serviceId = searchParams.get("service_id");

  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return NextResponse.json(
      { error: "date query parameter is required (YYYY-MM-DD)" },
      { status: 400 }
    );
  }

  const supabase = await createServerClient();

  // Look up booking settings by slug
  const { data: settings, error: settingsError } = await supabase
    .from("booking_settings")
    .select("*")
    .eq("booking_url_slug", slug)
    .limit(1)
    .single();

  if (settingsError || !settings) {
    return NextResponse.json(
      { error: "Booking page not found" },
      { status: 404 }
    );
  }

  const userId = settings.user_id;
  const slotDuration = settings.slot_duration_minutes;
  const bufferMinutes = settings.buffer_minutes;
  const minNoticeHours = settings.min_notice_hours;
  const maxAdvanceDays = settings.max_advance_days;
  const timezone = settings.timezone || "Australia/Sydney";

  // Determine service duration (use service-specific or default slot duration)
  let serviceDuration = slotDuration;
  if (serviceId) {
    const { data: service } = await supabase
      .from("services")
      .select("duration_minutes, is_active")
      .eq("id", serviceId)
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

  // Get the current time in the business timezone
  const nowInTz = new Date(
    new Date().toLocaleString("en-US", { timeZone: timezone })
  );
  const todayStr = formatDateLocal(nowInTz);

  // Compute min notice cutoff time
  const minNoticeDate = new Date(nowInTz.getTime() + minNoticeHours * 60 * 60 * 1000);

  // Check max_advance_days
  const maxDate = new Date(nowInTz);
  maxDate.setDate(maxDate.getDate() + maxAdvanceDays);
  const maxDateStr = formatDateLocal(maxDate);

  if (dateStr > maxDateStr) {
    return NextResponse.json({ data: [] }); // Too far in advance
  }

  // Get day_of_week (0=Sunday, 6=Saturday)
  // We parse the date string to get the correct day
  const [year, month, day] = dateStr.split("-").map(Number);
  const dateObj = new Date(year, month - 1, day);
  const dayOfWeek = dateObj.getDay();

  // Fetch availability, bookings, and blocked dates in parallel
  const [availResult, bookingsResult, blockedResult] = await Promise.all([
    supabase
      .from("availability_schedules")
      .select("start_time, end_time")
      .eq("user_id", userId)
      .eq("day_of_week", dayOfWeek)
      .eq("is_active", true)
      .order("start_time", { ascending: true }),

    supabase
      .from("bookings")
      .select("start_time, end_time")
      .eq("user_id", userId)
      .eq("booking_date", dateStr)
      .in("status", ["pending", "confirmed"]),

    supabase
      .from("blocked_dates")
      .select("all_day, start_time, end_time")
      .eq("user_id", userId)
      .eq("blocked_date", dateStr),
  ]);

  if (availResult.error || bookingsResult.error || blockedResult.error) {
    return NextResponse.json(
      { error: "Failed to compute available slots" },
      { status: 500 }
    );
  }

  const availabilityWindows = availResult.data ?? [];
  const existingBookings = bookingsResult.data ?? [];
  const blockedDates = blockedResult.data ?? [];

  // If the entire date is blocked (all_day), return empty
  if (blockedDates.some((b) => b.all_day)) {
    return NextResponse.json({ data: [] });
  }

  // No availability windows means no slots
  if (availabilityWindows.length === 0) {
    return NextResponse.json({ data: [] });
  }

  // Generate all possible slots from availability windows
  const allSlots: TimeSlot[] = [];

  for (const window of availabilityWindows) {
    const windowStart = timeToMinutes(window.start_time);
    const windowEnd = timeToMinutes(window.end_time);

    let slotStart = windowStart;
    while (slotStart + serviceDuration <= windowEnd) {
      allSlots.push({
        start_time: minutesToTime(slotStart),
        end_time: minutesToTime(slotStart + serviceDuration),
      });
      slotStart += slotDuration; // Advance by slot_duration_minutes (stepping interval)
    }
  }

  // Filter out slots that overlap with existing bookings (+ buffer)
  const availableSlots = allSlots.filter((slot) => {
    const slotStartMin = timeToMinutes(slot.start_time);
    const slotEndMin = timeToMinutes(slot.end_time);

    // Check overlap with existing bookings (including buffer)
    for (const booking of existingBookings) {
      const bookingStart = timeToMinutes(booking.start_time) - bufferMinutes;
      const bookingEnd = timeToMinutes(booking.end_time) + bufferMinutes;

      // Overlap check: slot overlaps if it starts before booking+buffer ends
      // and ends after booking-buffer starts
      if (slotStartMin < bookingEnd && slotEndMin > bookingStart) {
        return false;
      }
    }

    // Check overlap with blocked time ranges (non-all_day)
    for (const blocked of blockedDates) {
      if (!blocked.all_day && blocked.start_time && blocked.end_time) {
        const blockedStart = timeToMinutes(blocked.start_time);
        const blockedEnd = timeToMinutes(blocked.end_time);

        if (slotStartMin < blockedEnd && slotEndMin > blockedStart) {
          return false;
        }
      }
    }

    // Check min_notice_hours: if the date is today, remove past slots
    if (dateStr === todayStr) {
      const minNoticeTimeMin =
        minNoticeDate.getHours() * 60 + minNoticeDate.getMinutes();
      if (slotStartMin < minNoticeTimeMin) {
        return false;
      }
    }

    // If the date is in the past, no slots
    if (dateStr < todayStr) {
      return false;
    }

    return true;
  });

  return NextResponse.json({ data: availableSlots });
}

/**
 * Convert HH:MM or HH:MM:SS time string to total minutes from midnight.
 */
function timeToMinutes(time: string): number {
  const parts = time.split(":").map(Number);
  return parts[0] * 60 + parts[1];
}

/**
 * Convert total minutes from midnight to HH:MM string.
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
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
