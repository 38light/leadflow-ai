import { NextRequest, NextResponse } from "next/server";
import { InstagramAdapter } from "@/lib/channels/adapters/instagram";

const instagramAdapter = new InstagramAdapter();

export async function GET(request: NextRequest) {
  // Meta webhook verification (subscription confirmation)
  const searchParams = request.nextUrl.searchParams;

  const mode = searchParams.get("hub.mode");
  const verifyToken = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode !== "subscribe") {
    return NextResponse.json(
      { error: "Invalid hub.mode" },
      { status: 400 }
    );
  }

  const expectedToken = process.env.META_VERIFY_TOKEN;
  if (!expectedToken) {
    console.error("[Meta Webhook] Missing META_VERIFY_TOKEN environment variable");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  if (verifyToken !== expectedToken) {
    console.warn("[Meta Webhook] Verification token mismatch");
    return NextResponse.json(
      { error: "Verification failed" },
      { status: 403 }
    );
  }

  // Return the challenge to confirm the subscription
  return new Response(challenge || "", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const isValid = await instagramAdapter.verifyWebhook(request);

    if (!isValid) {
      console.warn("[Meta Webhook] Invalid signature");
      if (process.env.NODE_ENV === "production") {
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 403 }
        );
      }
    }

    const body = await request.json();

    // Meta sends webhooks for both Instagram and Facebook pages
    // The "object" field tells us which platform
    const objectType = body.object as string;

    if (objectType !== "instagram" && objectType !== "page") {
      console.warn(`[Meta Webhook] Unexpected object type: ${objectType}`);
      return NextResponse.json({ received: true }, { status: 200 });
    }

    // Process each entry's messaging events
    const entries = body.entry as Array<{
      id: string;
      time: number;
      messaging?: Array<Record<string, unknown>>;
    }>;

    if (!entries || entries.length === 0) {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    for (const entry of entries) {
      if (!entry.messaging || entry.messaging.length === 0) {
        continue;
      }

      // Normalize each messaging event
      // We wrap each event back into the Meta webhook structure for the adapter
      for (const messagingEvent of entry.messaging) {
        const wrappedPayload = {
          object: objectType,
          entry: [
            {
              id: entry.id,
              time: entry.time,
              messaging: [messagingEvent],
            },
          ],
        };

        const normalizedMessage =
          instagramAdapter.normalizeInbound(wrappedPayload);

        if (normalizedMessage) {
          console.log(
            `[Meta Webhook] Received ${objectType} message:`,
            {
              messageId: normalizedMessage.externalMessageId,
              senderId: normalizedMessage.senderExternalId,
              content: normalizedMessage.content.substring(0, 100),
              contentType: normalizedMessage.contentType,
            }
          );

          // TODO: Phase 3 - Process message through conversation pipeline
        }
      }
    }

    // Return 200 quickly to acknowledge receipt (Meta requires fast responses)
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error("[Meta Webhook] Error processing webhook:", error);
    // Still return 200 to prevent Meta from retrying
    return NextResponse.json({ received: true }, { status: 200 });
  }
}
