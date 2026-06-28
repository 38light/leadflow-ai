import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "twilio/lib/webhooks/webhooks";

export async function POST(request: NextRequest) {
  const body = await request.text();

  // Parse form-encoded body into params object for signature verification
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(body);
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

  // Log voice call event for now
  console.log("[Twilio Voice Webhook]", body);

  // Return TwiML — basic greeting, will be replaced with Vapi integration
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>Thank you for calling. Our AI assistant is not yet configured. Please try again later.</Say>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
