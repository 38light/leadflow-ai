import { createServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { PlatformRole, TeamRole } from "@/types";
import { skipAuthEnabled } from "@/lib/security/skip-auth";

const DEV_USER: User = {
  id: "784e8466-82e2-4f57-a68b-1e289b62b54a",
  email: "dev@leadflow.ai",
  app_metadata: {},
  user_metadata: { name: "Dev User" },
  aud: "authenticated",
  created_at: new Date().toISOString(),
} as User;

export interface AuthContext {
  user: User;
  platformRole: PlatformRole;
  teamRole: TeamRole | null;
  ownerId: string; // The business owner whose data this user accesses
  isOwner: boolean;
  isSuperAdmin: boolean;
}

/**
 * Get the authenticated user or redirect to login.
 * Use this in Server Components and API routes.
 */
export async function getUser() {
  // DEV MODE: return mock user to skip auth (local-only; throws if set on a deploy)
  if (skipAuthEnabled()) {
    return DEV_USER;
  }

  let supabase;
  try {
    supabase = await createServerClient();
  } catch {
    redirect("/login");
  }

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
  if (skipAuthEnabled()) {
    return DEV_USER;
  }

  let supabase;
  try {
    supabase = await createServerClient();
  } catch {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/**
 * Get full auth context including platform role, team membership, and effective owner_id.
 * Use this when you need to check permissions or determine whose data to access.
 */
export async function getAuthContext(): Promise<AuthContext> {
  const user = await getUser();
  const supabase = await createServerClient();

  // DEV MODE: return super_admin context
  if (skipAuthEnabled()) {
    return {
      user,
      platformRole: "super_admin",
      teamRole: null,
      ownerId: user.id,
      isOwner: true,
      isSuperAdmin: true,
    };
  }

  // Get profile to determine platform role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const platformRole: PlatformRole = (profile?.role as PlatformRole) ?? "user";
  const isSuperAdmin = platformRole === "super_admin";

  // Check if user is a team member under someone
  const { data: membership } = await supabase
    .from("team_members")
    .select("owner_id, role")
    .eq("member_user_id", user.id)
    .limit(1)
    .single();

  const teamRole = membership ? (membership.role as TeamRole) : null;
  const ownerId = membership ? membership.owner_id : user.id;
  const isOwner = !membership;

  return {
    user,
    platformRole,
    teamRole,
    ownerId,
    isOwner,
    isSuperAdmin,
  };
}

/**
 * Get auth context for API routes (returns context or null, no redirect).
 */
export async function getAPIContext(): Promise<AuthContext | null> {
  if (skipAuthEnabled()) {
    return {
      user: DEV_USER,
      platformRole: "super_admin",
      teamRole: null,
      ownerId: DEV_USER.id,
      isOwner: true,
      isSuperAdmin: true,
    };
  }

  let supabase;
  try {
    supabase = await createServerClient();
  } catch {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  const platformRole: PlatformRole = (profile?.role as PlatformRole) ?? "user";

  const { data: membership } = await supabase
    .from("team_members")
    .select("owner_id, role")
    .eq("member_user_id", user.id)
    .limit(1)
    .single();

  const teamRole = membership ? (membership.role as TeamRole) : null;
  const ownerId = membership ? membership.owner_id : user.id;

  return {
    user,
    platformRole,
    teamRole,
    ownerId,
    isOwner: !membership,
    isSuperAdmin: platformRole === "super_admin",
  };
}
