/**
 * Feature Flags utility
 *
 * Checks whether a feature flag is enabled for a given user.
 * Resolution order:
 *   1. Per-user override (if present, use it directly)
 *   2. Globally enabled flag  (enabled_globally = true → enabled)
 *   3. Rollout percentage     (hash(userId) % 100 < rollout_percentage → enabled)
 *   4. Default: disabled
 */

import { createServerClient } from "@/lib/supabase/server";

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled_globally: boolean;
  rollout_percentage: number;
}

interface FlagOverride {
  enabled: boolean;
}

/**
 * Simple deterministic hash so the same userId always lands in the same bucket.
 * Returns a number in [0, 99].
 */
function hashUserIdToPercent(userId: string): number {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 100;
}

/**
 * Check whether a feature flag is enabled for the current user.
 *
 * Can be called from Server Components, API routes, and Client Components
 * (client components should call a thin API route instead of importing this
 * directly, since it relies on the server-side Supabase client).
 */
export async function isFeatureEnabled(
  flagKey: string,
  userId?: string
): Promise<boolean> {
  let supabase;
  try {
    supabase = await createServerClient();
  } catch {
    // Supabase not configured; default to disabled
    return false;
  }

  // Fetch the flag
  const { data: flag, error: flagError } = await supabase
    .from("feature_flags")
    .select("id, key, name, description, enabled_globally, rollout_percentage")
    .eq("key", flagKey)
    .single<FeatureFlag>();

  if (flagError || !flag) {
    return false;
  }

  // Check per-user override first
  if (userId) {
    const { data: override } = await supabase
      .from("feature_flag_overrides")
      .select("enabled")
      .eq("flag_id", flag.id)
      .eq("user_id", userId)
      .single<FlagOverride>();

    if (override !== null && override !== undefined) {
      return override.enabled;
    }
  }

  // Globally enabled check
  if (flag.enabled_globally) {
    return true;
  }

  // Rollout percentage check (only meaningful when userId is provided)
  if (userId && flag.rollout_percentage > 0) {
    const bucket = hashUserIdToPercent(userId);
    return bucket < flag.rollout_percentage;
  }

  return false;
}
