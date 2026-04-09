import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { updateIntegrationsSchema } from "@/lib/validators/settings";

export async function GET() {
  const user = await getUser();
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("hubspot_portal_id, twilio_account_sid, twilio_phone_number, meta_page_id, vapi_api_key")
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Return only non-sensitive fields (mask tokens)
  return NextResponse.json({
    data: {
      hubspot: { connected: !!data.hubspot_portal_id, portal_id: data.hubspot_portal_id },
      twilio: { connected: !!data.twilio_account_sid, phone: data.twilio_phone_number },
      meta: { connected: !!data.meta_page_id },
      vapi: { connected: !!data.vapi_api_key },
    },
  });
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
    input = updateIntegrationsSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(input)
    .eq("user_id", user.id)
    .select("hubspot_portal_id, twilio_account_sid, twilio_phone_number, meta_page_id, vapi_api_key")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      hubspot: { connected: !!data.hubspot_portal_id },
      twilio: { connected: !!data.twilio_account_sid },
      meta: { connected: !!data.meta_page_id },
      vapi: { connected: !!data.vapi_api_key },
    },
  });
}
