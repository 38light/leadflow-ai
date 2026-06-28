import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { bulkAvailabilitySchema } from "@/lib/validators/booking";

// GET /api/bookings/availability — list availability schedules for the owner
export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("availability_schedules")
    .select("*")
    .eq("user_id", ctx.ownerId)
    .order("day_of_week", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/bookings/availability — bulk upsert availability (delete all then insert)
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
    input = bulkAvailabilitySchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = await createServerClient();

  // Delete all existing schedules for this owner
  const { error: deleteError } = await supabase
    .from("availability_schedules")
    .delete()
    .eq("user_id", ctx.ownerId);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Insert new schedules
  if (input.schedules.length === 0) {
    return NextResponse.json({ data: [] });
  }

  const rows = input.schedules.map((s) => ({
    ...s,
    user_id: ctx.ownerId,
  }));

  const { data, error: insertError } = await supabase
    .from("availability_schedules")
    .insert(rows)
    .select();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
