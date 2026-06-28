import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "twilio/lib/webhooks/webhooks";

export async function POST(request: NextRequest) {
  const rawBody = await request.text();

  // Parse form-encoded body into params object
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(rawBody);
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  // Verify Twilio signature
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = request.headers.get("x-twilio-signature") || "";

  const shouldSkip =
    process.env.NODE_ENV !== "production" && !authToken;

  if (!shouldSkip) {
    if (!authToken || !signature) {
      return new Response("Forbidden", { status: 403 });
    }
    const isValid = validateRequest(
      authToken,
      signature,
      request.url,
      params
    );
    if (!isValid) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const messageSid = params.MessageSid || "";
  const messageStatus = params.MessageStatus || "";

  console.log(`[Twilio Status] ${messageSid}: ${messageStatus}`);

  // TODO: Update message delivered_at/read_at based on status
  // Statuses: queued, sent, delivered, read, failed, undelivered

  return NextResponse.json({ received: true });
}
