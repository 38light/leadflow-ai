import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { authCallbackUrl, authEmailSchema, newPasswordSchema, parseAuthCallback, safeAuthNext } from "./flow";

const auth = vi.hoisted(() => ({ exchangeCodeForSession: vi.fn(), verifyOtp: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createServerClient: async () => ({ auth }) }));
import { GET } from "@/app/api/auth/callback/route";

const token = "a".repeat(56);
const code = "11111111-1111-4111-8111-111111111111";
beforeEach(() => {
  vi.clearAllMocks();
  auth.exchangeCodeForSession.mockResolvedValue({ data: { session: { access_token: "never-exposed" } }, error: null });
  auth.verifyOtp.mockResolvedValue({ data: { session: { access_token: "never-exposed" } }, error: null });
});

describe("same-origin authentication redirects", () => {
  it.each(["https://evil.test", "//evil.test", "/\\evil.test", "/\nevil.test", "javascript:alert(1)"])("rejects %s", target => {
    expect(safeAuthNext(target)).toBe("/dashboard");
  });
  it("preserves a valid app path and query", () => {
    expect(safeAuthNext("/contacts?status=new")).toBe("/contacts?status=new");
  });
  it("creates confirmation and recovery links on the caller's app origin", () => {
    const url = new URL(authCallbackUrl("https://pilot.example", "/reset-password"));
    expect(url.origin).toBe("https://pilot.example");
    expect(url.pathname).toBe("/api/auth/callback");
    expect(url.searchParams.get("next")).toBe("/reset-password");
  });
  it("validates new passwords without weakening legacy password login", () => {
    expect(newPasswordSchema.safeParse("short").success).toBe(false);
    expect(newPasswordSchema.safeParse("long-enough-password").success).toBe(true);
    expect(authEmailSchema.parse("  person@example.com ")).toBe("person@example.com");
  });
});

describe("callback credentials", () => {
  it("forces invitation and recovery links to password setup", () => {
    for (const type of ["invite", "recovery"]) {
      expect(parseAuthCallback(new URLSearchParams({ token_hash: token, type, next: "//evil.test" })))
        .toMatchObject({ kind: "otp", type, next: "/reset-password" });
    }
  });
  it("rejects unsupported types, malformed tokens, mixed and duplicate credentials", () => {
    expect(parseAuthCallback(new URLSearchParams({ token_hash: token, type: "sms" }))).toBeNull();
    expect(parseAuthCallback(new URLSearchParams({ token_hash: "bad token", type: "invite" }))).toBeNull();
    expect(parseAuthCallback(new URLSearchParams({ token_hash: token, type: "invite", code }))).toBeNull();
    expect(parseAuthCallback(new URLSearchParams(`code=${code}&code=${code}`))).toBeNull();
    expect(parseAuthCallback(new URLSearchParams({ code, error: "expired" }))).toBeNull();
  });
  it("exchanges PKCE codes, strips credentials and refuses off-site destinations", async () => {
    const res = await GET(new NextRequest(`https://pilot.example/api/auth/callback?code=${code}&next=https://evil.test`));
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith(code);
    expect(res.headers.get("location")).toBe("https://pilot.example/dashboard");
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
    expect(await res.text()).not.toContain("never-exposed");
  });
  it("verifies invitation hashes with the validated type", async () => {
    const res = await GET(new NextRequest(`https://pilot.example/api/auth/callback?token_hash=${token}&type=invite`));
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: token, type: "invite" });
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
    expect(res.headers.get("location")).toBe("https://pilot.example/reset-password");
  });
  it("rejects invalid callbacks without calling Supabase", async () => {
    const res = await GET(new NextRequest("https://pilot.example/api/auth/callback?type=invite&token_hash=short"));
    expect(res.headers.get("location")).toBe("https://pilot.example/login?error=auth_failed");
    expect(auth.verifyOtp).not.toHaveBeenCalled();
    expect(auth.exchangeCodeForSession).not.toHaveBeenCalled();
  });
  it("treats expired tokens or missing sessions as failures without leaking provider errors", async () => {
    auth.verifyOtp.mockResolvedValue({ data: { session: null }, error: { message: "sensitive auth diagnostic" } });
    const res = await GET(new NextRequest(`https://pilot.example/api/auth/callback?token_hash=${token}&type=recovery`));
    expect(res.headers.get("location")).toBe("https://pilot.example/login?error=auth_failed");
    expect(res.headers.get("referrer-policy")).toBe("no-referrer");
    expect(await res.text()).not.toContain("sensitive auth diagnostic");
  });
});
