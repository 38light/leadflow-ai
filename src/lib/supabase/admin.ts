import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. Bypasses RLS and does NOT depend on request
 * cookies, so it is safe to use inside `after()` callbacks that run once the
 * HTTP response has already been sent.
 *
 * Never expose this client or its results to the browser. Use only in trusted
 * server contexts (e.g. webhook delivery logging).
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}
