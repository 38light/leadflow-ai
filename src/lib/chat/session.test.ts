import { describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createSessionToken, getChatSession, hashSessionToken, publicReply, sessionCredentialsSchema } from "./session";

describe("web chat capabilities", () => {
  it("creates independent 256-bit tokens and stores only a one-way hash", () => {
    const one = createSessionToken();
    const two = createSessionToken();
    expect(one).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(one).not.toBe(two);
    expect(hashSessionToken(one)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashSessionToken(one)).not.toContain(one);
    expect(hashSessionToken(one)).toBe(hashSessionToken(one));
  });
  it("rejects the old caller-chosen session format and invalid owners", () => {
    expect(sessionCredentialsSchema.safeParse({ businessId: "not-an-owner", sessionId: createSessionToken() }).success).toBe(false);
    expect(sessionCredentialsSchema.safeParse({ businessId: "11111111-1111-4111-8111-111111111111", sessionId: "old-session" }).success).toBe(false);
  });
  it("requires owner match, token hash and unexpired session in the same lookup", async () => {
    const query = { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), gt: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
    const db = { from: vi.fn().mockReturnValue(query) } as unknown as SupabaseClient;
    const token = createSessionToken();
    expect(await getChatSession(db, "owner", token)).toBeNull();
    expect(query.eq).toHaveBeenCalledWith("user_id", "owner");
    expect(query.eq).toHaveBeenCalledWith("token_hash", hashSessionToken(token));
    expect(query.gt).toHaveBeenCalledWith("expires_at", expect.any(String));
  });
  it("never exposes draft content while approval is required", () => {
    expect(publicReply({ shouldSend: false, responseContent: "PRIVATE DRAFT" })).toBeNull();
    expect(publicReply({ shouldSend: true, responseContent: "Approved response" })).toBe("Approved response");
  });
});
