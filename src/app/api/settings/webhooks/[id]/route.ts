import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { updateWebhookSchema } from "@/lib/validators/webhooks";
import { assertSafeWebhookUrl, WebhookUrlError } from "@/lib/webhooks/ssrf-guard";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  const supabase = await createServerClient();
  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let input;
  try {
    input = updateWebhookSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Re-run the SSRF guard whenever the URL changes.
  if (input.url !== undefined) {
    try {
      await assertSafeWebhookUrl(input.url);
    } catch (err) {
      const message = err instanceof WebhookUrlError ? err.message : "Invalid webhook URL.";
      return NextResponse.json({ error: message }, { status: 400 });
    }
  }

  const { data, error } = await supabase
    .from("webhook_endpoints")
    .update(input)
    .eq("id", id)
    .eq("user_id", user.id)
    .select("id, url, events, description, active, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: "Webhook endpoint not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  const supabase = await createServerClient();
  const { id } = await params;

  const { error } = await supabase
    .from("webhook_endpoints")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } });
}
