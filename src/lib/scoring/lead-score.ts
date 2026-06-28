import type { Contact } from "@/types";

const SOURCE_CHANNEL_SCORES: Record<string, number> = {
  hubspot: 20,
  whatsapp: 15,
  instagram: 12,
  facebook: 10,
  sms: 10,
  web_chat: 8,
  manual: 5,
};

const TEMPERATURE_SCORES: Record<string, number> = {
  hot: 30,
  warm: 20,
  cold: 5,
};

const STATUS_SCORES: Record<string, number> = {
  won: 100,
  negotiation: 80,
  proposal: 60,
  qualified: 40,
  contacted: 20,
  new: 5,
  lost: 0,
};

export interface LeadScoreInput {
  source_channel?: string | null;
  temperature?: string | null;
  status?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
}

/**
 * Calculate lead score 0-100 based on engagement signals.
 * For won/lost contacts the status score dominates.
 */
export function calculateLeadScore(
  contact: LeadScoreInput | Pick<Contact, "source_channel" | "temperature" | "status" | "email" | "phone" | "company">
): number {
  const status = contact.status ?? "new";

  // Won and lost are fixed scores
  if (status === "won") return 100;
  if (status === "lost") return 0;

  let score = 0;

  // Status progression (base)
  score += STATUS_SCORES[status] ?? 5;

  // Temperature
  score += TEMPERATURE_SCORES[contact.temperature ?? "cold"] ?? 5;

  // Source channel
  score += SOURCE_CHANNEL_SCORES[contact.source_channel ?? ""] ?? 0;

  // Data completeness bonuses
  if (contact.email) score += 5;
  if (contact.phone) score += 5;
  if (contact.company) score += 3;

  // Cap at 100
  return Math.min(100, Math.max(0, score));
}
