import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createBroadcastSchema } from "@/lib/validators/broadcasts";

export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("broadcasts")
    .select("*")
    .eq("user_id", ctx.ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let input;
  try {
    input = createBroadcastSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = await createServerClient();

  // Count matching contacts (preview count before creating broadcast)
  let countQuery = supabase
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.ownerId)
    .eq("opted_out", false);

  if (input.segmentStatus && input.segmentStatus.length > 0) {
    countQuery = countQuery.in("status", input.segmentStatus);
  }
  if (input.segmentTemperature && input.segmentTemperature.length > 0) {
    countQuery = countQuery.in("temperature", input.segmentTemperature);
  }
  if (input.segmentSourceChannel && input.segmentSourceChannel.length > 0) {
    countQuery = countQuery.in("source_channel", input.segmentSourceChannel);
  }

  const { count, error: countError } = await countQuery;

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  const recipientCount = count ?? 0;

  const { data, error } = await supabase
    .from("broadcasts")
    .insert({
      user_id: ctx.ownerId,
      name: input.name,
      message: input.message,
      channel_type: input.channelType,
      segment_status: input.segmentStatus ?? null,
      segment_temperature: input.segmentTemperature ?? null,
      segment_source_channel: input.segmentSourceChannel ?? null,
      recipient_count: recipientCount,
      status: "draft",
    })
    .select()
    .single();

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
