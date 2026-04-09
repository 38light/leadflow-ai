import type {
  ChannelAdapter,
  NormalizedMessage,
  OutboundMessage,
  SendResult,
} from "../types";

/**
 * Web chat channel adapter.
 *
 * Unlike WhatsApp / Instagram / SMS, web chat messages arrive directly via our
 * own public API (`/api/chat/message`) rather than through an external webhook.
 *
 * Normalisation expects a simple JSON shape from the chat widget:
 *   { sessionId: string; content: string; senderName?: string }
 *
 * Outbound is a no-op: responses are returned synchronously from the API
 * handler and stored in the conversation record — there is no external
 * delivery step.
 */

interface WebChatPayload {
  sessionId: string;
  content: string;
  senderName?: string;
  timestamp?: string;
}

function isWebChatPayload(payload: unknown): payload is WebChatPayload {
  if (typeof payload !== "object" || payload === null) return false;
  const p = payload as Record<string, unknown>;
  return typeof p.sessionId === "string" && typeof p.content === "string";
}

export class WebChatAdapter implements ChannelAdapter {
  readonly channelType = "web_chat" as const;

  normalizeInbound(rawPayload: unknown): NormalizedMessage | null {
    if (!isWebChatPayload(rawPayload)) {
      return null;
    }

    return {
      externalMessageId: `webchat-${rawPayload.sessionId}-${Date.now()}`,
      externalThreadId: rawPayload.sessionId,
      senderExternalId: rawPayload.sessionId,
      senderName: rawPayload.senderName,
      content: rawPayload.content,
      contentType: "text",
      channelType: "web_chat",
      rawPayload,
      timestamp: rawPayload.timestamp
        ? new Date(rawPayload.timestamp)
        : new Date(),
    };
  }

  async sendOutbound(_message: OutboundMessage): Promise<SendResult> {
    // Web chat responses are returned directly via the API handler and stored
    // in the conversation — no external delivery step required.
    return { success: true };
  }

  async verifyWebhook(_request: Request): Promise<boolean> {
    // No external webhook to verify. The public chat API is rate-limited
    // at the route level instead.
    return true;
  }
}
