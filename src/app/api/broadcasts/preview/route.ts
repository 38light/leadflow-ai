import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { broadcastPreviewSchema } from "@/lib/validators/broadcasts";

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
    input = broadcastPreviewSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = await createServerClient();

  let query = supabase
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.ownerId)
    .eq("opted_out", false);

  if (input.segmentStatus && input.segmentStatus.length > 0) {
    query = query.in("status", input.segmentStatus);
  }
  if (input.segmentTemperature && input.segmentTemperature.length > 0) {
    query = query.in("temperature", input.segmentTemperature);
  }
  if (input.segmentSourceChannel && input.segmentSourceChannel.length > 0) {
    query = query.in("source_channel", input.segmentSourceChannel);
  }

  const { count, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also count opted-out contacts for the info message
  let optedOutQuery = supabase
    .from("contacts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", ctx.ownerId)
    .eq("opted_out", true);

  if (input.segmentStatus && input.segmentStatus.length > 0) {
    optedOutQuery = optedOutQuery.in("status", input.segmentStatus);
  }
  if (input.segmentTemperature && input.segmentTemperature.length > 0) {
    optedOutQuery = optedOutQuery.in("temperature", input.segmentTemperature);
  }
  if (input.segmentSourceChannel && input.segmentSourceChannel.length > 0) {
    optedOutQuery = optedOutQuery.in("source_channel", input.segmentSourceChannel);
  }

  const { count: optedOutCount } = await optedOutQuery;

  return NextResponse.json({
    data: {
      count: count ?? 0,
      optedOutCount: optedOutCount ?? 0,
    },
  });
}
