import twilio from "twilio";
import { validateRequest } from "twilio/lib/webhooks/webhooks";
import type {
  ChannelAdapter,
  NormalizedMessage,
  OutboundMessage,
  SendResult,
} from "../types";

interface TwilioWhatsAppPayload {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  ProfileName?: string;
  WaId?: string;
}

let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient(): ReturnType<typeof twilio> {
  if (!twilioClient) {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;

    if (!accountSid || !authToken) {
      throw new Error(
        "Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN environment variables"
      );
    }

    twilioClient = twilio(accountSid, authToken);
  }

  return twilioClient;
}

function stripWhatsAppPrefix(address: string): string {
  return address.replace(/^whatsapp:/, "");
}

export class WhatsAppAdapter implements ChannelAdapter {
  readonly channelType = "whatsapp" as const;

  normalizeInbound(rawPayload: unknown): NormalizedMessage | null {
    try {
      const payload = rawPayload as TwilioWhatsAppPayload;

      if (!payload.MessageSid || !payload.From) {
        return null;
      }

      const hasMedia =
        parseInt(payload.NumMedia || "0", 10) > 0 && payload.MediaUrl0;

      let contentType: NormalizedMessage["contentType"] = "text";
      if (hasMedia && payload.MediaContentType0) {
        if (payload.MediaContentType0.startsWith("image/")) {
          contentType = "image";
        } else if (payload.MediaContentType0.startsWith("audio/")) {
          contentType = "audio";
        } else if (payload.MediaContentType0.startsWith("video/")) {
          contentType = "video";
        } else {
          contentType = "document";
        }
      }

      const senderPhone = stripWhatsAppPrefix(payload.From);

      return {
        externalMessageId: payload.MessageSid,
        externalThreadId: `${stripWhatsAppPrefix(payload.From)}-${stripWhatsAppPrefix(payload.To)}`,
        senderExternalId: payload.From,
        senderName: payload.ProfileName,
        senderPhone,
        content: payload.Body || "",
        contentType,
        mediaUrl: hasMedia ? payload.MediaUrl0 : undefined,
        channelType: this.channelType,
        rawPayload,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("[WhatsAppAdapter] Failed to normalize inbound:", error);
      return null;
    }
  }

  async sendOutbound(message: OutboundMessage): Promise<SendResult> {
    try {
      const client = getTwilioClient();

      const fromNumber =
        (message.channelConfig.twilioWhatsAppNumber as string | undefined) ||
        process.env.TWILIO_WHATSAPP_NUMBER;

      if (!fromNumber) {
        return {
          success: false,
          error: "Missing WhatsApp sender number configuration",
        };
      }

      const createParams: {
        to: string;
        from: string;
        body: string;
        mediaUrl?: string[];
      } = {
        to: message.to.startsWith("whatsapp:")
          ? message.to
          : `whatsapp:${message.to}`,
        from: fromNumber.startsWith("whatsapp:")
          ? fromNumber
          : `whatsapp:${fromNumber}`,
        body: message.content,
      };

      if (
        message.mediaUrl &&
        message.contentType !== "text"
      ) {
        createParams.mediaUrl = [message.mediaUrl];
      }

      const result = await client.messages.create(createParams);

      return {
        success: true,
        externalMessageId: result.sid,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error sending WhatsApp message";
      console.error("[WhatsAppAdapter] Send failed:", errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async verifyWebhook(request: Request): Promise<boolean> {
    try {
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      if (!authToken) {
        console.error("[WhatsAppAdapter] Missing TWILIO_AUTH_TOKEN for webhook verification");
        return false;
      }

      const twilioSignature = request.headers.get("x-twilio-signature");
      if (!twilioSignature) {
        console.error("[WhatsAppAdapter] Missing X-Twilio-Signature header");
        return false;
      }

      const url = request.url;
      const body = await request.clone().text();

      // Parse form-encoded body into params object
      const params: Record<string, string> = {};
      const searchParams = new URLSearchParams(body);
      for (const [key, value] of searchParams.entries()) {
        params[key] = value;
      }

      return validateRequest(authToken, twilioSignature, url, params);
    } catch (error) {
      console.error("[WhatsAppAdapter] Webhook verification failed:", error);
      return false;
    }
  }
}
