import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const body = await request.text();

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
