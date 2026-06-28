/**
 * SKIP_AUTH is a LOCAL-DEV-ONLY backdoor. When set it makes every request
 * authenticate as a fixed super-admin AND swaps in the RLS-bypassing service-role
 * Supabase client — i.e. it disables BOTH the auth layer and the database isolation
 * layer at once. It exists only because the dev box has no real auth session.
 *
 * This helper centralizes the check and FAILS CLOSED: if SKIP_AUTH is ever set on a
 * real (deployed) environment, it throws instead of silently bypassing security.
 *
 * Use this everywhere instead of reading `process.env.SKIP_AUTH` directly.
 */
export function skipAuthEnabled(): boolean {
  if (process.env.SKIP_AUTH !== "true") return false;

  // Never honor SKIP_AUTH on a Vercel deployment (production OR preview).
  if (process.env.VERCEL_ENV || process.env.VERCEL === "1") {
    throw new Error(
      "SKIP_AUTH=true is forbidden on a deployed environment — remove SKIP_AUTH from the deployment env."
    );
  }

  // Defense in depth: only honor it against a localhost Supabase URL, so it can
  // never bypass auth against a real database even if NODE_ENV/VERCEL look local.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  if (url && !/^https?:\/\/(127\.0\.0\.1|localhost|host\.docker\.internal|\[?::1\]?)(:|\/|$)/i.test(url)) {
    throw new Error(
      `SKIP_AUTH=true is only allowed against a localhost Supabase URL (got ${url}).`
    );
  }

  return true;
}
