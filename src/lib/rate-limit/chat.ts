import { createHash } from "node:crypto";
import type { NextRequest } from "next/server";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number; // Unix seconds, including when Upstash returns milliseconds.
}

/** Deployed requests use durable limits and fail closed on service failure. */
export async function checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<RateLimitResult> {
  const keyHash = createHash("sha256").update(key).digest("hex");
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const deployed = process.env.NODE_ENV === "production" || !!process.env.VERCEL_ENV || process.env.VERCEL === "1";
  if (!deployed && !redisUrl && !redisToken) return { allowed: true, remaining: limit, reset: 0 };
  try {
    if (redisUrl || redisToken) {
      if (!redisUrl || !redisToken) throw new Error("Incomplete rate limit configuration");
      const { Redis } = await import("@upstash/redis");
      const { Ratelimit } = await import("@upstash/ratelimit");
      const redis = new Redis({ url: redisUrl, token: redisToken });
      const limiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`), prefix: "leadflow:rl" });
      const result = await limiter.limit(keyHash);
      if (typeof result.success !== "boolean" || !Number.isFinite(result.remaining) || !Number.isFinite(result.reset)) {
        throw new Error("Rate limit service returned an invalid response");
      }
      return { allowed: result.success, remaining: result.remaining, reset: Math.ceil(result.reset / 1000) };
    }
    const { createAdminClient } = await import("@/lib/supabase/server");
    const { data, error } = await createAdminClient().rpc("consume_public_rate_limit", {
      p_key_hash: keyHash, p_limit: limit, p_window_seconds: windowSeconds,
    });
    if (error || !data || typeof data.allowed !== "boolean" || !Number.isFinite(data.remaining) || !Number.isFinite(data.reset)) {
      throw new Error("Rate limit service unavailable");
    }
    return { allowed: data.allowed, remaining: data.remaining, reset: data.reset };
  } catch {
    console.error("[Rate limit] Service unavailable; request denied");
    return { allowed: false, remaining: 0, reset: Math.ceil(Date.now() / 1000) + 60 };
  }
}

export function getClientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
}

export function rateLimitByIp(req: NextRequest, bucket: string, limit: number, windowSeconds: number) {
  return checkRateLimit(`${bucket}:${getClientIp(req)}`, limit, windowSeconds);
}

export function rateLimitChatInit(req: NextRequest) {
  return rateLimitByIp(req, "chat:init", 10, 60);
}

export function rateLimitChatMessage(sessionId: string) {
  return checkRateLimit(`chat:msg:${sessionId}`, 30, 60);
}

export function rateLimitBusinessAI(businessId: string) {
  // Each enquiry can call several agents. Exhausted quotas leave it for staff.
  const configured = Number(process.env.CHAT_AI_DAILY_LIMIT ?? 100);
  const limit = Number.isSafeInteger(configured) && configured > 0 && configured <= 10000 ? configured : 100;
  return checkRateLimit(`chat:ai:business:${businessId}`, limit, 86400);
}
