/**
 * Outbound webhook event catalog. Kept in its own leaf module so validators can
 * import it without pulling in the delivery machinery (crypto, next/server).
 */
export const WEBHOOK_EVENTS = ["contact.created", "booking.created"] as const;

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];
