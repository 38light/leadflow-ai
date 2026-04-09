import { NextRequest, NextResponse } from "next/server";
import { VoiceAdapter } from "@/lib/channels/adapters/voice";

const voiceAdapter = new VoiceAdapter();

/**
 * POST /api/webhooks/vapi
 *
 * Receives Vapi voice webhook events. Vapi fires events for the full call
 * lifecycle — we handle the ones relevant for lead capture:
 *   - call.started          — log for awareness
 *   - transcript            — normalise and log the spoken text
 *   - end-of-call-report    — normalise and log the call summary
 */
export async function POST(request: NextRequest) {
  try {
    // Verify the webhook signature / secret
    const isValid = await voiceAdapter.verifyWebhook(request);
    if (!isValid) {
      console.warn("[Vapi Webhook] Verification failed");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const event = body as Record<string, unknown>;
    const eventType = event.type as string | undefined;

    switch (eventType) {
      case "call.started": {
        const callId =
          typeof event.call === "object" && event.call !== null
            ? (event.call as Record<string, unknown>).id
            : "unknown";
        console.log(`[Vapi Webhook] Call started: ${callId}`);
        break;
      }

      case "transcript": {
        const normalized = voiceAdapter.normalizeInbound(body);
        if (normalized) {
          console.log(
            `[Vapi Webhook] Transcript received for call ${normalized.externalThreadId}: "${normalized.content.slice(0, 100)}"`
          );
          // Phase 3: forward to AI orchestrator / conversation service
        }
        break;
      }

      case "end-of-call-report": {
        const normalized = voiceAdapter.normalizeInbound(body);
        if (normalized) {
          console.log(
            `[Vapi Webhook] End-of-call report for ${normalized.externalThreadId}: "${normalized.content.slice(0, 100)}"`
          );
          // Phase 3: forward to AI orchestrator / conversation service
        }
        break;
      }

      default:
        console.log(`[Vapi Webhook] Unhandled event type: ${eventType ?? "unknown"}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Vapi Webhook] Error processing event:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
