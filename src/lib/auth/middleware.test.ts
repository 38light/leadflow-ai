import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const authMock = vi.hoisted(() => ({ user: null as { id: string } | null }));
vi.mock("@/lib/security/skip-auth", () => ({ skipAuthEnabled: () => false }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: (_url: string, _key: string, options: { cookies: { setAll: (cookies: unknown[]) => void } }) => ({
    auth: { getUser: async () => {
      options.cookies.setAll([{ name: "sb-refresh-test", value: "rotated-cookie", options: { path: "/", httpOnly: true, secure: true, sameSite: "lax" } }]);
      return { data: { user: authMock.user } };
    } },
  }),
}));
import { updateSession } from "@/lib/supabase/middleware";

beforeEach(() => {
  authMock.user = null;
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-test-key");
});
afterEach(() => vi.unstubAllEnvs());

describe("session cookies survive middleware redirects", () => {
  it("preserves refreshed cookies when redirecting an unauthenticated dashboard request", async () => {
    const response = await updateSession(new NextRequest("https://pilot.example/dashboard"));
    expect(response.headers.get("location")).toBe("https://pilot.example/login");
    expect(response.cookies.get("sb-refresh-test")).toMatchObject({ value: "rotated-cookie", path: "/", httpOnly: true, secure: true, sameSite: "lax" });
  });
  it("preserves refreshed cookies when an authenticated user leaves sign-in", async () => {
    authMock.user = { id: "owner" };
    const response = await updateSession(new NextRequest("https://pilot.example/login"));
    expect(response.headers.get("location")).toBe("https://pilot.example/dashboard");
    expect(response.cookies.get("sb-refresh-test")?.value).toBe("rotated-cookie");
  });
  it("keeps an authenticated password-setup request on its page", async () => {
    authMock.user = { id: "invitee" };
    const response = await updateSession(new NextRequest("https://pilot.example/reset-password"));
    expect(response.headers.get("location")).toBeNull();
    expect(response.cookies.get("sb-refresh-test")?.value).toBe("rotated-cookie");
  });
});
