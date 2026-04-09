import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * Get the authenticated user or redirect to login.
 * Use this in Server Components and API routes.
 */
export async function getUser() {
  const supabase = await createServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return user;
}

/**
 * Get the authenticated user or return null (no redirect).
 * Use this when you need to check auth without redirecting.
 */
export async function getUserOptional() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}
