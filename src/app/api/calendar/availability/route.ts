import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { z } from "zod";

const querySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function GET(request: NextRequest) {
  await getUser();

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const { date } = querySchema.parse(params);

  // TODO: Phase 5 — integrate with Google Calendar / Outlook Calendar
  // For now, return placeholder availability
  const slots = [
    { start: `${date}T09:00:00`, end: `${date}T09:30:00`, available: true },
    { start: `${date}T10:00:00`, end: `${date}T10:30:00`, available: true },
    { start: `${date}T11:00:00`, end: `${date}T11:30:00`, available: false },
    { start: `${date}T14:00:00`, end: `${date}T14:30:00`, available: true },
    { start: `${date}T15:00:00`, end: `${date}T15:30:00`, available: true },
  ];

  return NextResponse.json({ data: { date, slots } });
}
