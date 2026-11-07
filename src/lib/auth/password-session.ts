import type { SupabaseClient } from "@supabase/supabase-js";

type PasswordClient = { auth: Pick<SupabaseClient["auth"], "getUser" | "setSession"> };
type PasswordBrowser = {
  location: { href: string };
  history: Pick<History, "state" | "replaceState">;
};
export type PasswordIdentity = { id: string; email: string | null };

type PasswordLink =
  | { kind: "existing" }
  | { kind: "invalid" }
  | { kind: "session"; access_token: string; refresh_token: string };

const authKeys = ["access_token", "refresh_token", "token_type", "type", "expires_in", "expires_at", "error", "error_code", "error_description", "code", "token_hash"];
const accessTokenPattern = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;
const refreshTokenPattern = /^[A-Za-z0-9_-]{8,1024}$/;
const failureMarker = "password_link_error";

function clearFailureMarker(browser: PasswordBrowser) {
  const url = new URL(browser.location.href);
  if (!url.searchParams.has(failureMarker)) return;
  url.searchParams.delete(failureMarker);
  browser.history.replaceState(browser.history.state, "", `${url.pathname}${url.search}`);
}

/** Capture credentials once and remove them before the SDK or any async work. */
export function consumePasswordLink(browser: PasswordBrowser): PasswordLink {
  const url = new URL(browser.location.href);
  const fragment = url.hash.slice(1);
  const queryHasAuth = authKeys.some(key => url.searchParams.has(key));
  const previousFailure = url.searchParams.has(failureMarker);
  url.hash = "";
  for (const key of authKeys) url.searchParams.delete(key);
  if (fragment || queryHasAuth) {
    // Keep a credential-free failure marker until verification succeeds. A
    // refresh during/after failure must not use a previously signed-in account.
    url.searchParams.set(failureMarker, "1");
    browser.history.replaceState(browser.history.state, "", `${url.pathname}${url.search}`);
  }

  // PKCE code and token-hash links belong at the server callback, not this page.
  // A failed link must never silently use a different account's saved session.
  if (queryHasAuth) return { kind: "invalid" };
  if (!fragment) return { kind: previousFailure ? "invalid" : "existing" };
  if (fragment.length > 24_000) return { kind: "invalid" };
  const params = new URLSearchParams(fragment);
  if (authKeys.some(key => params.getAll(key).length > 1)
    || ["error", "error_code", "error_description", "code", "token_hash"].some(key => params.has(key))) {
    return { kind: "invalid" };
  }
  const access_token = params.get("access_token") ?? "";
  const refresh_token = params.get("refresh_token") ?? "";
  const type = params.get("type");
  if ((type !== "invite" && type !== "recovery") || params.get("token_type") !== "bearer"
    || access_token.length > 16_384 || !accessTokenPattern.test(access_token)
    || !refreshTokenPattern.test(refresh_token)) return { kind: "invalid" };

  // These are only credential shapes. Supabase must validate the actual session.
  return { kind: "session", access_token, refresh_token };
}

/** Supports default Supabase invite/recovery fragments alongside server PKCE. */
export async function initializePasswordSession(browser: PasswordBrowser, createClient: () => PasswordClient): Promise<PasswordIdentity | null> {
  try {
    const link = consumePasswordLink(browser);
    if (link.kind === "invalid") return null;
    // createBrowserClient forces PKCE and rejects implicit fragments. The URL is
    // already clean, so explicitly import the fragment session through the SDK.
    const client = createClient();
    if (link.kind === "session") {
      const { data, error } = await client.auth.setSession({ access_token: link.access_token, refresh_token: link.refresh_token });
      if (error || !data.session || !data.user) return null;
      const verified = await client.auth.getUser();
      if (verified.error || !verified.data.user || verified.data.user.id !== data.user.id) return null;
      clearFailureMarker(browser);
      return { id: verified.data.user.id, email: verified.data.user.email ?? null };
    }
    const { data, error } = await client.auth.getUser();
    return !error && data.user ? { id: data.user.id, email: data.user.email ?? null } : null;
  } catch {
    // Never log URL fragments, credentials, or raw provider diagnostics.
    return null;
  }
}

type PasswordUpdateResult = { ok: true } | { ok: false; reason: "identity_changed" | "same_password" | "unavailable" };

/** Bind the mutation to a verified snapshot, even if another tab changes auth. */
export async function updatePasswordForIdentity(
  client: { auth: Pick<SupabaseClient["auth"], "getSession"> },
  identity: PasswordIdentity,
  password: string,
  createIsolatedClient: () => { auth: Pick<SupabaseClient["auth"], "setSession" | "updateUser"> },
): Promise<PasswordUpdateResult> {
  try {
    const { data, error } = await client.auth.getSession();
    if (error || !data.session) return { ok: false, reason: "identity_changed" };
    // This client has no shared storage or auth listeners. updateUser therefore
    // cannot pick up a different account from cookies after validation.
    const isolated = createIsolatedClient();
    const verified = await isolated.auth.setSession({ access_token: data.session.access_token, refresh_token: data.session.refresh_token });
    if (verified.error || !verified.data.session || verified.data.user?.id !== identity.id) return { ok: false, reason: "identity_changed" };
    const result = await isolated.auth.updateUser({ password });
    if (result.error || result.data.user?.id !== identity.id) {
      return { ok: false, reason: result.error?.code === "same_password" ? "same_password" : "unavailable" };
    }
    return { ok: true };
  } catch {
    return { ok: false, reason: "unavailable" };
  }
}
