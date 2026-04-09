import type { OutboundMessage, SendResult, ChannelType } from "./types";
import { WhatsAppAdapter } from "./adapters/whatsapp";
import { SMSAdapter } from "./adapters/sms";
import { InstagramAdapter } from "./adapters/instagram";
import { VoiceAdapter } from "./adapters/voice";
import { WebChatAdapter } from "./adapters/web-chat";

const adapters = {
  whatsapp: new WhatsAppAdapter(),
  sms: new SMSAdapter(),
  instagram: new InstagramAdapter(),
  facebook: new InstagramAdapter(), // Facebook uses same Graph API
  voice: new VoiceAdapter(),
  web_chat: new WebChatAdapter(),
} as const;

export function getAdapter(channelType: ChannelType) {
  return adapters[channelType];
}

export async function sendMessage(message: OutboundMessage): Promise<SendResult> {
  const adapter = getAdapter(message.channelType);
  if (!adapter) {
    return { success: false, error: `No adapter for channel type: ${message.channelType}` };
  }
  return adapter.sendOutbound(message);
}
