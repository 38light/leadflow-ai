import { createBrowserClient } from "@supabase/ssr";

// TODO: Add Database generic once Supabase project is connected and types are generated
// import type { Database } from "@/types/supabase";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
