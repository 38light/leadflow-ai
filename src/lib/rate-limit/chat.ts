/**
 * Rate limiting for public chat endpoints.
 *
 * Uses Upstash Redis when UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN
 * are configured. Degrades gracefully (allow-all) when env vars are absent,
 * so local dev works without Redis.
 *
 * Limits:
 *   - /api/chat/init  — 10 inits per IP per minute
 *   - /api/chat/message — 30 messages per sessionId per minute
 */

import { NextRequest } from "next/server";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number; // Unix timestamp (seconds)
}

function isUpstashConfigured(): boolean {
  return (
    typeof process.env.UPSTASH_REDIS_REST_URL === "string" &&
    process.env.UPSTASH_REDIS_REST_URL.length > 0 &&
    typeof process.env.UPSTASH_REDIS_REST_TOKEN === "string" &&
    process.env.UPSTASH_REDIS_REST_TOKEN.length > 0
  );
}

async function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  if (!isUpstashConfigured()) {
    // Degrade gracefully — allow all requests in dev/unconfigured environments
    return { allowed: true, remaining: limit, reset: 0 };
  }

  const { Redis } = await import("@upstash/redis");
  const { Ratelimit } = await import("@upstash/ratelimit");

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  const ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    prefix: "leadflow:rl",
  });

  const { success, remaining, reset } = await ratelimit.limit(key);
  return { allowed: success, remaining, reset };
}

export async function rateLimitChatInit(req: NextRequest): Promise<RateLimitResult> {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  return checkRateLimit(`chat:init:${ip}`, 10, 60);
}

export async function rateLimitChatMessage(sessionId: string): Promise<RateLimitResult> {
  return checkRateLimit(`chat:msg:${sessionId}`, 30, 60);
}
