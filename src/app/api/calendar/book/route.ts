import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { createServerClient } from "@/lib/supabase/server";
import { dispatchWebhookEvent } from "@/lib/webhooks/deliver";
import { z } from "zod";

const bookSchema = z.object({
  date: z.string(),
  start_time: z.string(),
  end_time: z.string(),
  contact_id: z.string().uuid(),
  title: z.string().max(200),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const user = await getUser();
  const supabase = await createServerClient();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let input;
  try {
    input = bookSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // TODO: Phase 5 — create event in Google Calendar / Outlook Calendar
  // For now, return a placeholder booking confirmation

  const event = {
    title: input.title,
    start: `${input.date}T${input.start_time}`,
    end: `${input.date}T${input.end_time}`,
    contact_id: input.contact_id,
  };

  // Fire the booking.created webhook (delivered after the response is sent).
  await dispatchWebhookEvent({
    supabase,
    userId: user.id,
    event: "booking.created",
    payload: event,
  });

  return NextResponse.json({
    data: {
      booked: true,
      event,
    },
  });
}
