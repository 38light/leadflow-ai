import twilio from "twilio";
import { validateRequest } from "twilio/lib/webhooks/webhooks";
import type {
  ChannelAdapter,
  NormalizedMessage,
  OutboundMessage,
  SendResult,
} from "../types";

interface TwilioSMSPayload {
  MessageSid: string;
  AccountSid: string;
  From: string;
  To: string;
  Body: string;
  NumMedia: string;
  MediaUrl0?: string;
  MediaContentType0?: string;
  FromCity?: string;
  FromState?: string;
  FromCountry?: string;
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

export class SMSAdapter implements ChannelAdapter {
  readonly channelType = "sms" as const;

  normalizeInbound(rawPayload: unknown): NormalizedMessage | null {
    try {
      const payload = rawPayload as TwilioSMSPayload;

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

      return {
        externalMessageId: payload.MessageSid,
        externalThreadId: `${payload.From}-${payload.To}`,
        senderExternalId: payload.From,
        senderPhone: payload.From,
        content: payload.Body || "",
        contentType,
        mediaUrl: hasMedia ? payload.MediaUrl0 : undefined,
        channelType: this.channelType,
        rawPayload,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("[SMSAdapter] Failed to normalize inbound:", error);
      return null;
    }
  }

  async sendOutbound(message: OutboundMessage): Promise<SendResult> {
    try {
      const client = getTwilioClient();

      const fromNumber =
        (message.channelConfig.twilioPhoneNumber as string | undefined) ||
        process.env.TWILIO_PHONE_NUMBER;

      if (!fromNumber) {
        return {
          success: false,
          error: "Missing SMS sender number configuration (TWILIO_PHONE_NUMBER)",
        };
      }

      let body = message.content;

      // Anti-spam: append opt-out text on first outbound if configured
      if (message.channelConfig.includeOptOut === true) {
        body += "\n\nReply STOP to opt out";
      }

      const createParams: {
        to: string;
        from: string;
        body: string;
        mediaUrl?: string[];
      } = {
        to: message.to,
        from: fromNumber,
        body,
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
        error instanceof Error ? error.message : "Unknown error sending SMS";
      console.error("[SMSAdapter] Send failed:", errorMessage);
      return { success: false, error: errorMessage };
    }
  }

  async verifyWebhook(request: Request): Promise<boolean> {
    try {
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      if (!authToken) {
        console.error("[SMSAdapter] Missing TWILIO_AUTH_TOKEN for webhook verification");
        return false;
      }

      const twilioSignature = request.headers.get("x-twilio-signature");
      if (!twilioSignature) {
        console.error("[SMSAdapter] Missing X-Twilio-Signature header");
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
      console.error("[SMSAdapter] Webhook verification failed:", error);
      return false;
    }
  }
}
