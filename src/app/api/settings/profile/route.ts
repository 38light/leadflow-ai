import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { updateProfileSchema } from "@/lib/validators/settings";

export async function GET() {
  const user = await getUser();
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, business_name, business_type, timezone, phone, website, ai_enabled, subscription_tier, created_at, updated_at")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function PUT(request: NextRequest) {
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
    input = updateProfileSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(input)
    .eq("user_id", user.id)
    .select("id, user_id, business_name, business_type, timezone, phone, website, ai_enabled, subscription_tier, created_at, updated_at")
    .single();

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data });
}
