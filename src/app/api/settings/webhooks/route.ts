import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { createWebhookSchema } from "@/lib/validators/webhooks";
import { assertSafeWebhookUrl, WebhookUrlError } from "@/lib/webhooks/ssrf-guard";

function maskSecret(secret: string): string {
  return `whsec_…${secret.slice(-4)}`;
}

export async function GET() {
  const user = await getUser();
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("webhook_endpoints")
    .select("id, url, events, description, active, created_at, updated_at, secret")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Never return the raw signing secret on list — only a masked preview.
  const endpoints = (data ?? []).map((row) => {
    const { secret, ...rest } = row;
    return { ...rest, secret_preview: maskSecret(secret) };
  });

  return NextResponse.json({ data: endpoints });
}

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
    input = createWebhookSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // SSRF guard: reject private/loopback/metadata targets before persisting.
  try {
    await assertSafeWebhookUrl(input.url);
  } catch (err) {
    const message = err instanceof WebhookUrlError ? err.message : "Invalid webhook URL.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const secret = `whsec_${randomBytes(24).toString("hex")}`;

  const { data, error } = await supabase
    .from("webhook_endpoints")
    .insert({
      user_id: user.id,
      url: input.url,
      events: input.events,
      description: input.description ?? null,
      secret,
    })
    .select("id, url, events, description, active, created_at, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // The signing secret is returned exactly once, at creation.
  return NextResponse.json({ data: { ...data, secret } }, { status: 201 });
}
