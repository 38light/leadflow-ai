import type {
  ChannelAdapter,
  NormalizedMessage,
  OutboundMessage,
  SendResult,
} from "../types";

/**
 * Vapi voice channel adapter.
 *
 * Vapi sends webhook events for call lifecycle. The two events we care about
 * for message normalisation are:
 *   - "transcript"           — interim/final speech-to-text during a call
 *   - "end-of-call-report"   — full call summary once the call ends
 *
 * Outbound is a no-op: Vapi handles TTS on its side; we simply acknowledge
 * that the response text was provided.
 */

interface VapiTranscriptEvent {
  type: "transcript";
  call: { id: string; customer?: { number?: string; name?: string } };
  transcript: string;
  timestamp?: string;
}

interface VapiEndOfCallEvent {
  type: "end-of-call-report";
  call: { id: string; customer?: { number?: string; name?: string } };
  summary?: string;
  transcript?: string;
  recordingUrl?: string;
  timestamp?: string;
}

function isVapiTranscript(payload: unknown): payload is VapiTranscriptEvent {
  return (
    typeof payload === "object" &&
    payload !== null &&
    (payload as Record<string, unknown>).type === "transcript"
  );
}

function isVapiEndOfCall(payload: unknown): payload is VapiEndOfCallEvent {
  return (
    typeof payload === "object" &&
    payload !== null &&
    (payload as Record<string, unknown>).type === "end-of-call-report"
  );
}

export class VoiceAdapter implements ChannelAdapter {
  readonly channelType = "voice" as const;

  normalizeInbound(rawPayload: unknown): NormalizedMessage | null {
    if (isVapiTranscript(rawPayload)) {
      return this.normalizeTranscript(rawPayload);
    }

    if (isVapiEndOfCall(rawPayload)) {
      return this.normalizeEndOfCall(rawPayload);
    }

    // Unrecognised event — nothing to normalise
    return null;
  }

  async sendOutbound(_message: OutboundMessage): Promise<SendResult> {
    // Voice is primarily inbound. Vapi handles TTS on its side — we simply
    // acknowledge that the response text was provided to the caller.
    return { success: true };
  }

  async verifyWebhook(request: Request): Promise<boolean> {
    const secret = process.env.VAPI_WEBHOOK_SECRET;
    if (!secret) {
      console.error("[VoiceAdapter] VAPI_WEBHOOK_SECRET not configured — rejecting webhook");
      return false;
    }

    const headerSecret = request.headers.get("x-vapi-secret");
    if (!headerSecret) return false;

    // Timing-safe comparison
    try {
      const { timingSafeEqual } = await import("crypto");
      return timingSafeEqual(Buffer.from(headerSecret), Buffer.from(secret));
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private normalizeTranscript(event: VapiTranscriptEvent): NormalizedMessage {
    const customer = event.call.customer;
    return {
      externalMessageId: `${event.call.id}-transcript-${Date.now()}`,
      externalThreadId: event.call.id,
      senderExternalId: customer?.number ?? event.call.id,
      senderName: customer?.name,
      senderPhone: customer?.number,
      content: event.transcript,
      contentType: "text",
      channelType: "voice",
      rawPayload: event,
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
    };
  }

  private normalizeEndOfCall(event: VapiEndOfCallEvent): NormalizedMessage {
    const customer = event.call.customer;
    const content =
      event.summary ?? event.transcript ?? "Call ended — no transcript available";

    return {
      externalMessageId: `${event.call.id}-end`,
      externalThreadId: event.call.id,
      senderExternalId: customer?.number ?? event.call.id,
      senderName: customer?.name,
      senderPhone: customer?.number,
      content,
      contentType: "text",
      mediaUrl: event.recordingUrl,
      channelType: "voice",
      rawPayload: event,
      timestamp: event.timestamp ? new Date(event.timestamp) : new Date(),
    };
  }
}
