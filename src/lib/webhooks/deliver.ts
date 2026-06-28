import crypto from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { assertSafeWebhookUrl } from "@/lib/webhooks/ssrf-guard";

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Deliver a webhook event to all registered endpoints for a user.
 * Signs the payload with HMAC-SHA256 using the endpoint's secret.
 * Non-blocking — call with void, never await in hot paths.
 * Never throws — all errors are caught internally.
 */
export async function deliverWebhookEvent(
  supabase: SupabaseClient,
  userId: string,
  payload: WebhookPayload
): Promise<void> {
  try {
    // Fetch all active endpoints that subscribe to this event
    const { data: endpoints, error } = await supabase
      .from("webhook_endpoints")
      .select("id, url, secret, failure_count")
      .eq("user_id", userId)
      .eq("is_active", true)
      .contains("events", [payload.event]);

    if (error || !endpoints || endpoints.length === 0) {
      return;
    }

    const body = JSON.stringify(payload);

    await Promise.allSettled(
      endpoints.map(async (endpoint: { id: string; url: string; secret: string; failure_count: number }) => {
        try {
          // SSRF guard: refuse to fetch private/reserved/metadata destinations.
          // Re-checked here (not just at registration) to defend against DNS
          // rebinding. A throw is caught below and counts as a delivery failure.
          await assertSafeWebhookUrl(endpoint.url);

          // Sign with HMAC-SHA256
          const digest = crypto
            .createHmac("sha256", endpoint.secret)
            .update(body)
            .digest("hex");

          // 5 second timeout via AbortController
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);

          let success = false;
          try {
            const res = await fetch(endpoint.url, {
              method: "POST",
              // Do NOT follow redirects: a public URL could 30x to a private
              // target, bypassing the SSRF guard above. A 3xx becomes an
              // opaque response (res.ok === false) → counts as a failed delivery.
              redirect: "manual",
              headers: {
                "Content-Type": "application/json",
                "X-LeadFlow-Signature": `sha256=${digest}`,
                "X-LeadFlow-Event": payload.event,
              },
              body,
              signal: controller.signal,
            });
            success = res.ok;
          } finally {
            clearTimeout(timeoutId);
          }

          if (success) {
            // Update last_triggered_at on success
            await supabase
              .from("webhook_endpoints")
              .update({ last_triggered_at: new Date().toISOString(), failure_count: 0 })
              .eq("id", endpoint.id);
          } else {
            // Increment failure count; disable if >= 5
            const newCount = (endpoint.failure_count ?? 0) + 1;
            await supabase
              .from("webhook_endpoints")
              .update({
                failure_count: newCount,
                ...(newCount >= 5 ? { is_active: false } : {}),
              })
              .eq("id", endpoint.id);
          }
        } catch {
          // Per-endpoint failure — increment failure_count
          try {
            const newCount = (endpoint.failure_count ?? 0) + 1;
            await supabase
              .from("webhook_endpoints")
              .update({
                failure_count: newCount,
                ...(newCount >= 5 ? { is_active: false } : {}),
              })
              .eq("id", endpoint.id);
          } catch {
            // Ignore DB errors in error handler
          }
        }
      })
    );
  } catch {
    // Top-level catch — never propagate
  }
}
