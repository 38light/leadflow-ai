import { createHmac } from "crypto";
import type {
  ChannelAdapter,
  NormalizedMessage,
  OutboundMessage,
  SendResult,
} from "../types";

interface MetaMessagingEvent {
  sender: { id: string };
  recipient: { id: string };
  timestamp: number;
  message?: {
    mid: string;
    text?: string;
    attachments?: MetaAttachment[];
  };
}

interface MetaAttachment {
  type: "image" | "audio" | "video" | "file" | "location" | "fallback";
  payload: {
    url?: string;
    coordinates?: { lat: number; long: number };
  };
}

interface MetaWebhookBody {
  object: string;
  entry: Array<{
    id: string;
    time: number;
    messaging: MetaMessagingEvent[];
  }>;
}

function mapAttachmentType(
  metaType: MetaAttachment["type"]
): NormalizedMessage["contentType"] {
  switch (metaType) {
    case "image":
      return "image";
    case "audio":
      return "audio";
    case "video":
      return "video";
    case "location":
      return "location";
    case "file":
    case "fallback":
    default:
      return "document";
  }
}

export class InstagramAdapter implements ChannelAdapter {
  readonly channelType = "instagram" as const;

  normalizeInbound(rawPayload: unknown): NormalizedMessage | null {
    try {
      const body = rawPayload as MetaWebhookBody;

      const entry = body.entry?.[0];
      if (!entry) {
        return null;
      }

      const messagingEvent = entry.messaging?.[0];
      if (!messagingEvent?.message) {
        return null;
      }

      const { sender, recipient, message, timestamp } = messagingEvent;

      const attachment = message.attachments?.[0];
      let contentType: NormalizedMessage["contentType"] = "text";
      let mediaUrl: string | undefined;

      if (attachment) {
        contentType = mapAttachmentType(attachment.type);
        mediaUrl = attachment.payload.url;
      }

      // For location attachments, format coordinates as content
      let content = message.text || "";
      if (
        attachment?.type === "location" &&
        attachment.payload.coordinates
      ) {
        const { lat, long } = attachment.payload.coordinates;
        content = content || `Location: ${lat}, ${long}`;
      }

      return {
        externalMessageId: message.mid,
        externalThreadId: `${sender.id}-${recipient.id}`,
        senderExternalId: sender.id,
        content,
        contentType,
        mediaUrl,
        channelType: this.channelType,
        rawPayload,
        timestamp: new Date(timestamp),
      };
    } catch (error) {
      console.error("[InstagramAdapter] Failed to normalize inbound:", error);
      return null;
    }
  }

  async sendOutbound(message: OutboundMessage): Promise<SendResult> {
    try {
      const accessToken = message.channelConfig.pageAccessToken as
        | string
        | undefined;

      if (!accessToken) {
        return {
          success: false,
          error: "Missing pageAccessToken in channel configuration",
        };
      }

      const apiVersion =
        (message.channelConfig.apiVersion as string | undefined) || "v19.0";

      const requestBody: Record<string, unknown> = {
        recipient: { id: message.to },
        messaging_type: "RESPONSE",
      };

      if (message.contentType === "text") {
        requestBody.message = { text: message.content };
      } else if (message.mediaUrl) {
        // Map our content types to Meta attachment types
        let attachmentType: string;
        switch (message.contentType) {
          case "image":
            attachmentType = "image";
            break;
          case "audio":
            attachmentType = "audio";
            break;
          case "video":
            attachmentType = "video";
            break;
          case "document":
          default:
            attachmentType = "file";
            break;
        }

        requestBody.message = {
          attachment: {
            type: attachmentType,
            payload: {
              url: message.mediaUrl,
              is_reusable: true,
            },
          },
        };
      } else {
        // Fallback: send as text
        requestBody.message = { text: message.content };
      }

      const response = await fetch(
        `https://graph.facebook.com/${apiVersion}/me/messages?access_token=${accessToken}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as {
          error?: { message?: string };
        };
        const errorMsg =
          errorData.error?.message || `HTTP ${response.status}`;
        console.error("[InstagramAdapter] Send failed:", errorMsg);
        return { success: false, error: errorMsg };
      }

      const data = (await response.json()) as {
        message_id?: string;
      };

      return {
        success: true,
        externalMessageId: data.message_id,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unknown error sending Instagram message";
      console.error("[InstagramAdapter] Send failed:", errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async verifyWebhook(request: Request): Promise<boolean> {
    try {
      const appSecret = process.env.META_APP_SECRET;
      if (!appSecret) {
        console.error(
          "[InstagramAdapter] Missing META_APP_SECRET for webhook verification"
        );
        return false;
      }

      const signature = request.headers.get("x-hub-signature-256");
      if (!signature) {
        console.error(
          "[InstagramAdapter] Missing X-Hub-Signature-256 header"
        );
        return false;
      }

      const body = await request.clone().text();

      const expectedSignature =
        "sha256=" +
        createHmac("sha256", appSecret).update(body).digest("hex");

      // Constant-time comparison to prevent timing attacks
      if (signature.length !== expectedSignature.length) {
        return false;
      }

      const sigBuffer = Buffer.from(signature);
      const expectedBuffer = Buffer.from(expectedSignature);

      // Use timingSafeEqual for constant-time comparison
      const { timingSafeEqual } = await import("crypto");
      return timingSafeEqual(sigBuffer, expectedBuffer);
    } catch (error) {
      console.error(
        "[InstagramAdapter] Webhook verification failed:",
        error
      );
      return false;
    }
  }
}
