import { after } from "next/server";
import { createHmac } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import { assertSafeWebhookUrl, WebhookUrlError } from "./ssrf-guard";
import type { WebhookEvent } from "./events";

export { WEBHOOK_EVENTS } from "./events";
export type { WebhookEvent } from "./events";

const DELIVERY_TIMEOUT_MS = 5000;

interface EndpointRow {
  id: string;
  user_id: string;
  url: string;
  secret: string;
  events: string[];
  active: boolean;
}

/**
 * Load the user's active endpoints subscribed to `event` and schedule delivery
 * to each one AFTER the HTTP response is sent (`after()`), so the originating
 * request (e.g. POST /api/contacts) is never blocked by a slow receiver.
 *
 * Endpoints are read with the caller's RLS-scoped client while the request
 * context is still live; delivery + logging then run with a service-role client.
 */
export async function dispatchWebhookEvent(params: {
  supabase: SupabaseClient;
  userId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
}): Promise<void> {
  const { supabase, userId, event, payload } = params;

  const { data: endpoints, error } = await supabase
    .from("webhook_endpoints")
    .select("id, user_id, url, secret, events, active")
    .eq("user_id", userId)
    .eq("active", true)
    .contains("events", [event]);

  if (error || !endpoints || endpoints.length === 0) return;

  // Sign and serialize the body once; identical for every endpoint.
  const body = JSON.stringify({
    event,
    created_at: new Date().toISOString(),
    data: payload,
  });

  after(async () => {
    await Promise.all(
      (endpoints as EndpointRow[]).map((endpoint) =>
        deliverWebhookEvent(endpoint, event, body)
      )
    );
  });
}

/**
 * Deliver a single signed event to one endpoint. Best-effort: every outcome
 * (success, non-2xx, redirect, timeout, DNS failure, SSRF re-rejection) is
 * recorded in webhook_deliveries. Never throws into the caller.
 */
export async function deliverWebhookEvent(
  endpoint: EndpointRow,
  event: WebhookEvent,
  body: string
): Promise<void> {
  const admin = createAdminClient();

  let status: "success" | "failed" = "failed";
  let statusCode: number | null = null;
  let errorMessage: string | null = null;

  try {
    // Defense in depth: re-validate right before the fetch. A hostname that was
    // public at creation time can re-resolve to a private IP (DNS rebinding).
    const url = await assertSafeWebhookUrl(endpoint.url);

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHmac("sha256", endpoint.secret)
      .update(`${timestamp}.${body}`)
      .digest("hex");

    const response = await fetch(url, {
      method: "POST",
      // Do NOT follow redirects: a public URL could 30x to a private target.
      redirect: "manual",
      signal: AbortSignal.timeout(DELIVERY_TIMEOUT_MS),
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "LeadFlow-Webhooks/1.0",
        "X-Webhook-Event": event,
        "X-Webhook-Id": endpoint.id,
        "X-Webhook-Signature": `t=${timestamp},v1=${signature}`,
      },
      body,
    });

    statusCode = response.status;

    if (response.type === "opaqueredirect" || (statusCode >= 300 && statusCode < 400)) {
      errorMessage = "Webhook endpoint attempted a redirect, which is not allowed.";
    } else if (statusCode >= 200 && statusCode < 300) {
      status = "success";
    } else {
      errorMessage = `Webhook endpoint returned HTTP ${statusCode}.`;
    }
  } catch (err) {
    if (err instanceof WebhookUrlError) {
      errorMessage = err.message;
    } else if (err instanceof Error) {
      errorMessage =
        err.name === "TimeoutError" || err.name === "AbortError"
          ? "Webhook delivery timed out."
          : err.message;
    } else {
      errorMessage = "Webhook delivery failed.";
    }
  }

  try {
    await admin.from("webhook_deliveries").insert({
      user_id: endpoint.user_id,
      endpoint_id: endpoint.id,
      event_type: event,
      status,
      status_code: statusCode,
      error: errorMessage,
    });
  } catch {
    // Logging is best-effort; never surface a logging failure.
  }
}
