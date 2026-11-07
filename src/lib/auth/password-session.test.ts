import { describe, expect, it, vi } from "vitest";
import { consumePasswordLink, initializePasswordSession, updatePasswordForIdentity } from "./password-session";

const accessToken = "header.payload.signature";
const refreshToken = "test_refresh_token";
const origin = "https://leadflow-ai-green-alpha.vercel.app";
function fragment(type = "invite") {
  return new URLSearchParams({ access_token: accessToken, refresh_token: refreshToken, token_type: "bearer", type, expires_in: "3600" }).toString();
}
function browser(suffix = "") {
  const location = { href: `${origin}/reset-password${suffix}` };
  return {
    location,
    history: {
      state: { nextState: "preserved" },
      replaceState: vi.fn((_state: unknown, _unused: string, url?: string | URL | null) => {
        location.href = new URL(String(url), origin).toString();
      }),
    },
  };
}
function client() {
  return {
    auth: {
      setSession: vi.fn().mockResolvedValue({ data: { session: { access_token: accessToken }, user: { id: "invited-user", email: "invited@example.test" } }, error: null }),
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "invited-user", email: "invited@example.test" } }, error: null }),
    },
  };
}

describe("default Supabase password links", () => {
  it.each(["invite", "recovery"])("accepts a %s fragment and replaces history without credentials", type => {
    const page = browser(`?source=mail#${fragment(type)}`);
    expect(consumePasswordLink(page)).toEqual({ kind: "session", access_token: accessToken, refresh_token: refreshToken });
    expect(page.location.href).toBe(`${origin}/reset-password?source=mail&password_link_error=1`);
    expect(page.history.replaceState).toHaveBeenCalledWith(page.history.state, "", "/reset-password?source=mail&password_link_error=1");
  });

  it("clears fragments before constructing the PKCE browser client or waiting for the network", async () => {
    const page = browser(`#${fragment()}`);
    const supabase = client();
    const factory = vi.fn(() => {
      expect(page.location.href).toBe(`${origin}/reset-password?password_link_error=1`);
      return supabase;
    });
    expect(await initializePasswordSession(page, factory)).toEqual({ id: "invited-user", email: "invited@example.test" });
    expect(page.location.href).toBe(`${origin}/reset-password`);
    expect(supabase.auth.setSession).toHaveBeenCalledWith({ access_token: accessToken, refresh_token: refreshToken });
    expect(supabase.auth.getUser).toHaveBeenCalledOnce();
    expect(supabase.auth.setSession.mock.invocationCallOrder[0]).toBeLessThan(supabase.auth.getUser.mock.invocationCallOrder[0]);
  });

  it.each([
    "#error=access_denied&error_code=otp_expired&error_description=Sensitive+diagnostic",
    `#${fragment()}&access_token=duplicate`,
    `#${fragment("signup")}`,
    `#${fragment().replace("token_type=bearer", "token_type=other")}`,
    "#access_token=malformed&refresh_token=test_refresh_token&token_type=bearer&type=invite",
    "#access_token=header.payload.signature&token_type=bearer&type=invite",
    `?code=callback-code#${fragment()}`,
    "?error=access_denied&error_code=otp_expired",
  ])("rejects invalid/error links without using an existing account: %s", async suffix => {
    const page = browser(suffix);
    const factory = vi.fn(() => client());
    expect(await initializePasswordSession(page, factory)).toBeNull();
    expect(factory).not.toHaveBeenCalled();
    expect(page.location.href).toBe(`${origin}/reset-password?password_link_error=1`);
  });

  it("rejects oversized fragments after clearing the URL", () => {
    const page = browser(`#${fragment()}&padding=${"x".repeat(24_000)}`);
    expect(consumePasswordLink(page)).toEqual({ kind: "invalid" });
    expect(page.location.href).toBe(`${origin}/reset-password?password_link_error=1`);
  });

  it("fails closed if URL credentials cannot be removed", async () => {
    const page = browser(`#${fragment()}`);
    page.history.replaceState.mockImplementation(() => { throw new Error("History unavailable"); });
    const factory = vi.fn(() => client());
    expect(await initializePasswordSession(page, factory)).toBeNull();
    expect(factory).not.toHaveBeenCalled();
  });

  it("keeps a failed link closed across reloads even with another account already signed in", async () => {
    const page = browser("#error=access_denied&error_code=otp_expired");
    const factory = vi.fn(() => client());
    expect(await initializePasswordSession(page, factory)).toBeNull();
    expect(page.location.href).toBe(`${origin}/reset-password?password_link_error=1`);
    expect(await initializePasswordSession(page, factory)).toBeNull();
    expect(factory).not.toHaveBeenCalled();
  });

  it("leaves the failure marker after a rejected token and accepts a new valid link", async () => {
    const page = browser(`#${fragment()}`);
    const rejected = client();
    rejected.auth.setSession.mockResolvedValue({ data: { session: null, user: null }, error: { message: "Expired" } });
    expect(await initializePasswordSession(page, () => rejected)).toBeNull();
    const staleFactory = vi.fn(() => client());
    expect(await initializePasswordSession(page, staleFactory)).toBeNull();
    expect(staleFactory).not.toHaveBeenCalled();
    page.location.href += `#${fragment("recovery")}`;
    expect(await initializePasswordSession(page, () => client())).toEqual({ id: "invited-user", email: "invited@example.test" });
    expect(page.location.href).toBe(`${origin}/reset-password`);
  });

  it.each(["expired", "missing-session", "missing-user", "network"])("does not fall back to saved auth when token import fails: %s", async failure => {
    const supabase = client();
    if (failure === "network") supabase.auth.setSession.mockRejectedValue(new Error("Network failure"));
    else supabase.auth.setSession.mockResolvedValue({
      data: { session: failure === "missing-session" ? null : {}, user: failure === "missing-user" ? null : { id: "invited-user", email: "invited@example.test" } },
      error: failure === "expired" ? { message: "Expired refresh token" } : null,
    });
    expect(await initializePasswordSession(browser(`#${fragment()}`), () => supabase)).toBeNull();
    expect(supabase.auth.getUser).not.toHaveBeenCalled();
  });

  it.each(["different-account", "missing-user", "server-error"])("requires server-verified identity after importing a session: %s", result => {
    const supabase = client();
    supabase.auth.getUser.mockResolvedValue({
      data: { user: result === "missing-user" ? null : { id: result === "different-account" ? "previous-user" : "invited-user" } },
      error: result === "server-error" ? { message: "Invalid JWT" } : null,
    });
    return expect(initializePasswordSession(browser(`#${fragment()}`), () => supabase)).resolves.toBeNull();
  });

  it("keeps the established server PKCE/reload session path", async () => {
    const supabase = client();
    const page = browser();
    expect(await initializePasswordSession(page, () => supabase)).toEqual({ id: "invited-user", email: "invited@example.test" });
    expect(supabase.auth.setSession).not.toHaveBeenCalled();
    expect(supabase.auth.getUser).toHaveBeenCalledOnce();
    expect(page.history.replaceState).not.toHaveBeenCalled();
  });

  it("rejects a missing or expired established session", async () => {
    const supabase = client();
    supabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: { message: "Missing session" } });
    expect(await initializePasswordSession(browser(), () => supabase)).toBeNull();
  });
});

describe("password update identity binding", () => {
  const identity = { id: "invited-user", email: "invited@example.test" };
  function fixtures() {
    const shared = { auth: { getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: accessToken, refresh_token: refreshToken } }, error: null }) } };
    const isolated = { auth: {
      setSession: vi.fn().mockResolvedValue({ data: { user: identity, session: {} }, error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: { user: identity }, error: null }),
    } };
    return { shared, isolated };
  }
  it("updates only the verified isolated session snapshot", async () => {
    const { shared, isolated } = fixtures();
    isolated.auth.setSession.mockImplementation(async () => {
      // Simulate another tab replacing cookies while verification is pending.
      shared.auth.getSession.mockResolvedValue({ data: { session: { access_token: "other-account", refresh_token: "other-refresh" } }, error: null });
      return { data: { user: identity, session: {} }, error: null };
    });
    expect(await updatePasswordForIdentity(shared, identity, "new-password", () => isolated)).toEqual({ ok: true });
    expect(isolated.auth.setSession).toHaveBeenCalledWith({ access_token: accessToken, refresh_token: refreshToken });
    expect(isolated.auth.updateUser).toHaveBeenCalledWith({ password: "new-password" });
    expect(shared.auth.getSession).toHaveBeenCalledOnce();
  });
  it.each(["wrong-account", "expired"])("does not update when session verification fails: %s", async failure => {
    const { shared, isolated } = fixtures();
    isolated.auth.setSession.mockResolvedValue({ data: { user: { id: "other-account" }, session: {} }, error: failure === "expired" ? { message: "Expired" } : null });
    expect(await updatePasswordForIdentity(shared, identity, "new-password", () => isolated)).toEqual({ ok: false, reason: "identity_changed" });
    expect(isolated.auth.updateUser).not.toHaveBeenCalled();
  });
  it("rejects missing sessions before constructing an update client", async () => {
    const { shared, isolated } = fixtures();
    shared.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
    const factory = vi.fn(() => isolated);
    expect(await updatePasswordForIdentity(shared, identity, "new-password", factory)).toEqual({ ok: false, reason: "identity_changed" });
    expect(factory).not.toHaveBeenCalled();
  });
  it.each(["same_password", "unexpected-provider-error"])("returns a safe error category: %s", async code => {
    const { shared, isolated } = fixtures();
    isolated.auth.updateUser.mockResolvedValue({ data: { user: null }, error: { code, message: "Sensitive diagnostic" } });
    expect(await updatePasswordForIdentity(shared, identity, "new-password", () => isolated))
      .toEqual({ ok: false, reason: code === "same_password" ? "same_password" : "unavailable" });
  });
  it("handles a network failure without claiming the password was saved", async () => {
    const { shared, isolated } = fixtures();
    isolated.auth.updateUser.mockRejectedValue(new Error("Network unavailable"));
    expect(await updatePasswordForIdentity(shared, identity, "new-password", () => isolated)).toEqual({ ok: false, reason: "unavailable" });
  });
});
