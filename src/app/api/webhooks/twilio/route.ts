import { NextRequest } from "next/server";
import { WhatsAppAdapter } from "@/lib/channels/adapters/whatsapp";
import { SMSAdapter } from "@/lib/channels/adapters/sms";

const whatsAppAdapter = new WhatsAppAdapter();
const smsAdapter = new SMSAdapter();

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();

    // Parse form-encoded body
    const params: Record<string, string> = {};
    const searchParams = new URLSearchParams(body);
    for (const [key, value] of searchParams.entries()) {
      params[key] = value;
    }

    const from = params.From || "";

    // Determine channel type by checking if From starts with "whatsapp:"
    const isWhatsApp = from.startsWith("whatsapp:");
    const adapter = isWhatsApp ? whatsAppAdapter : smsAdapter;

    // Verify webhook signature
    // We need to reconstruct the request with the body for verification
    const verificationRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      body,
    });

    const isValid = await adapter.verifyWebhook(verificationRequest);

    if (!isValid) {
      console.warn(
        `[Twilio Webhook] Invalid signature for ${isWhatsApp ? "WhatsApp" : "SMS"} message`
      );
      // Reject forged payloads everywhere. The only bypass is an explicit,
      // non-default dev flag — never gate this on NODE_ENV.
      if (process.env.ALLOW_UNVERIFIED_WEBHOOKS !== "true") {
        return new Response("Forbidden", { status: 403 });
      }
    }

    // Normalize the inbound message
    const normalizedMessage = adapter.normalizeInbound(params);

    if (normalizedMessage) {
      console.log(
        `[Twilio Webhook] Received ${isWhatsApp ? "WhatsApp" : "SMS"} message:`,
        {
          messageId: normalizedMessage.externalMessageId,
          from: normalizedMessage.senderExternalId,
          content: normalizedMessage.content.substring(0, 100),
          contentType: normalizedMessage.contentType,
        }
      );

      // TODO: Phase 3 - Process message through conversation pipeline
    } else {
      console.warn("[Twilio Webhook] Failed to normalize inbound message");
    }

    // Return TwiML empty response
    return new Response("<Response></Response>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("[Twilio Webhook] Error processing webhook:", error);
    return new Response("<Response></Response>", {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  }
}

export async function GET() {
  // Twilio health check endpoint
  return new Response("OK", { status: 200 });
}
