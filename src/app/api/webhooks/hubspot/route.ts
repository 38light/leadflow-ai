import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { createServerClient } from "@/lib/supabase/server";

const MAX_TIMESTAMP_SKEW_MS = 5 * 60 * 1000; // 5 minutes

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export async function POST(request: NextRequest) {
  // Read raw body FIRST for signature verification
  const rawBody = await request.text();

  const clientSecret = process.env.HUBSPOT_CLIENT_SECRET;
  const shouldSkip =
    process.env.NODE_ENV !== "production" && !clientSecret;

  if (!shouldSkip) {
    if (!clientSecret) {
      return new Response("Forbidden", { status: 403 });
    }

    const sigV3 = request.headers.get("x-hubspot-signature-v3");
    const timestamp = request.headers.get("x-hubspot-request-timestamp");
    const sigV1 = request.headers.get("x-hubspot-signature");

    let verified = false;

    if (sigV3 && timestamp) {
      // Replay protection: reject if timestamp is older than 5 minutes
      const ts = Number(timestamp);
      if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > MAX_TIMESTAMP_SKEW_MS) {
        return new Response("Forbidden", { status: 403 });
      }

      const method = request.method;
      const uri = request.url;
      const baseString = `${method}${uri}${rawBody}${timestamp}`;
      const expected = createHmac("sha256", clientSecret)
        .update(baseString)
        .digest("base64");

      verified = safeEqual(expected, sigV3);
    } else if (sigV1) {
      // Fallback: HubSpot v1 signature = SHA-256(clientSecret + rawBody)
      const expected = createHmac("sha256", clientSecret)
        .update(clientSecret + rawBody)
        .digest("hex");
      verified = safeEqual(expected, sigV1);
    }

    if (!verified) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  let body: Array<{ subscriptionType?: string }> | Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Log webhook for debugging
  console.log("[HubSpot Webhook]", JSON.stringify(body).slice(0, 500));

  const supabase = await createServerClient();

  const eventType =
    Array.isArray(body) && body[0]?.subscriptionType
      ? body[0].subscriptionType
      : "unknown";

  // Log to webhook_logs
  await supabase.from("webhook_logs").insert({
    source: "hubspot",
    event_type: eventType,
    payload: body,
    status: "received",
  });

  // TODO: Phase 5 — process HubSpot events
  // - contact.propertyChange: sync contact updates back to our contacts table
  // - deal.propertyChange: sync deal stage changes
  // - contact.creation: create contact in our system if bidirectional sync enabled

  return NextResponse.json({ received: true });
}
