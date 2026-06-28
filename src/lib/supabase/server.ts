import { createServerClient as createSSRClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { skipAuthEnabled } from "@/lib/security/skip-auth";

/**
 * Create a Supabase client with the service role key (bypasses RLS).
 * Only use this in server-side admin routes.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.local"
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// TODO: Add Database generic once Supabase project is connected and types are generated
// import type { Database } from "@/types/supabase";

export async function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    throw new Error("Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL in .env.local");
  }

  // DEV MODE: Use service role key to bypass RLS (no auth session exists).
  // skipAuthEnabled() throws if SKIP_AUTH is ever set on a real deployment.
  if (skipAuthEnabled()) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      throw new Error("SKIP_AUTH requires SUPABASE_SERVICE_ROLE_KEY in .env.local");
    }
    return createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });
  }

  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseAnonKey) {
    throw new Error("Set NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local");
  }

  const cookieStore = await cookies();

  return createSSRClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}
