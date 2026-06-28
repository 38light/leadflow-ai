import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { assertSafeWebhookUrl } from "@/lib/webhooks/ssrf-guard";
import { nanoid } from "nanoid";

// GET /api/settings/webhooks — list user's webhook endpoints (secret masked)
export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("webhook_endpoints")
    .select("id, url, description, events, secret, is_active, last_triggered_at, failure_count, created_at")
    .eq("user_id", ctx.ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[settings/webhooks]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // Mask secret — show only last 4 chars as ****xxxx
  const masked = (data ?? []).map((endpoint) => ({
    ...endpoint,
    secret: `****${endpoint.secret.slice(-4)}`,
  }));

  return NextResponse.json({ data: masked });
}

// POST /api/settings/webhooks — create a new webhook endpoint
export async function POST(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { url?: string; description?: string; events?: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }
  if (!url.startsWith("https://")) {
    return NextResponse.json({ error: "URL must start with https://" }, { status: 400 });
  }
  // SSRF guard: reject private/reserved/metadata destinations at registration time.
  try {
    await assertSafeWebhookUrl(url);
  } catch {
    return NextResponse.json(
      { error: "URL must be a public https endpoint (private/reserved addresses are not allowed)" },
      { status: 400 }
    );
  }

  const events = Array.isArray(body.events) ? body.events : [];
  if (events.length === 0) {
    return NextResponse.json({ error: "At least one event must be selected" }, { status: 400 });
  }

  const description = typeof body.description === "string" ? body.description.trim() : null;

  // Generate signing secret: whs_ + nanoid(32)
  const secret = `whs_${nanoid(32)}`;

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("webhook_endpoints")
    .insert({
      user_id: ctx.ownerId,
      url,
      description,
      events,
      secret,
      is_active: true,
      failure_count: 0,
    })
    .select("id, url, description, events, is_active, last_triggered_at, failure_count, created_at")
    .single();

  if (error) {
    console.error("[settings/webhooks]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // Return the secret ONCE in the creation response
  return NextResponse.json({ data: { ...data, secret } }, { status: 201 });
}
