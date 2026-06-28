import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { sendSlackNotification } from "@/lib/integrations/slack";

const slackSettingsSchema = z.object({
  slack_webhook_url: z
    .string()
    .max(500)
    .refine(
      (v) => v === "" || v.startsWith("https://hooks.slack.com/"),
      "Webhook URL must start with https://hooks.slack.com/"
    )
    .optional()
    .nullable(),
  slack_notify_hot_leads: z.boolean().optional(),
  slack_notify_bookings: z.boolean().optional(),
  test: z.boolean().optional(),
});

// GET /api/settings/slack — current slack config (webhook masked)
export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("slack_webhook_url, slack_notify_hot_leads, slack_notify_bookings")
    .eq("user_id", ctx.ownerId)
    .single();

  if (error) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Never return the raw webhook URL — it is a bearer secret. Return a masked
  // tail only; the PUT handler treats a masked value as "leave unchanged".
  const raw = data.slack_webhook_url ?? "";
  return NextResponse.json({
    data: {
      connected: !!raw,
      webhook_url: raw ? `****${raw.slice(-4)}` : "",
      slack_notify_hot_leads: data.slack_notify_hot_leads ?? true,
      slack_notify_bookings: data.slack_notify_bookings ?? true,
    },
  });
}

// PUT /api/settings/slack — update slack config; if `test:true`, also send a test message
export async function PUT(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // A masked value ("****xxxx") echoed back from GET means "leave unchanged".
  if (typeof body?.slack_webhook_url === "string" && body.slack_webhook_url.startsWith("****")) {
    delete body.slack_webhook_url;
  }

  let input;
  try {
    input = slackSettingsSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const supabase = await createServerClient();

  // Build update payload — only include fields that were provided
  const updatePayload: Record<string, unknown> = {};
  if (input.slack_webhook_url !== undefined) {
    updatePayload.slack_webhook_url = input.slack_webhook_url || null;
  }
  if (input.slack_notify_hot_leads !== undefined) {
    updatePayload.slack_notify_hot_leads = input.slack_notify_hot_leads;
  }
  if (input.slack_notify_bookings !== undefined) {
    updatePayload.slack_notify_bookings = input.slack_notify_bookings;
  }

  if (Object.keys(updatePayload).length > 0) {
    const { error } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("user_id", ctx.ownerId);

    if (error) {
      console.error("[settings/slack]", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  // Optional test ping — uses the value just saved (or fetched)
  let testResult: { sent: boolean } | undefined;
  if (input.test) {
    let webhook = input.slack_webhook_url;
    if (!webhook) {
      const { data } = await supabase
        .from("profiles")
        .select("slack_webhook_url")
        .eq("user_id", ctx.ownerId)
        .single();
      webhook = data?.slack_webhook_url ?? null;
    }
    const sent = webhook
      ? await sendSlackNotification(webhook, {
          text: "LeadFlow AI test message — your Slack integration is working.",
        })
      : false;
    testResult = { sent };
  }

  return NextResponse.json({ data: { ok: true, test: testResult } });
}
