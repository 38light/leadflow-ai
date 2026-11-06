import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";

export const sessionCredentialsSchema = z.object({
  businessId: z.string().uuid(),
  sessionId: z.string().regex(/^[A-Za-z0-9_-]{43}$/, "Invalid chat session"),
});

export function createSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function getChatSession(
  supabase: SupabaseClient,
  businessId: string,
  sessionId: string
) {
  const { data, error } = await supabase.from("web_chat_sessions")
    .select("id, user_id, conversation_id, expires_at")
    .eq("user_id", businessId)
    .eq("token_hash", hashSessionToken(sessionId))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error) throw new Error("Unable to verify chat session");
  return data as { id: string; user_id: string; conversation_id: string | null; expires_at: string } | null;
}

/** The only AI content allowed into a public response is a sendable reply. */
export function publicReply(result: { shouldSend: boolean; responseContent: string }) {
  return result.shouldSend ? result.responseContent : null;
}
