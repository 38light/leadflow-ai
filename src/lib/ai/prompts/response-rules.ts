export const OPT_OUT_KEYWORDS = [
  "stop",
  "unsubscribe",
  "opt out",
  "opt-out",
  "remove me",
  "don't contact",
  "dont contact",
  "cancel",
];

export function isOptOutMessage(content: string): boolean {
  const lower = content.toLowerCase().trim();
  return OPT_OUT_KEYWORDS.some((keyword) => lower === keyword || lower.startsWith(keyword));
}

export function getAIDisclaimer(businessName: string): string {
  return `Hi! I'm ${businessName}'s AI assistant. I can help with enquiries, availability, pricing, and more. How can I help you today?`;
}

export function getOptOutResponse(): string {
  return "You've been unsubscribed. You won't receive any more messages from us. If you change your mind, just reach out again.";
}

export const COMPLIANCE_RULES = {
  maxResponseLength: 1000,
  mustIdentifyAsAI: true,
  honorOptOut: true,
  noMedicalLegalAdvice: true,
} as const;
