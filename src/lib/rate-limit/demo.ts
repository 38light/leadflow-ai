import { NextRequest } from "next/server";

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}

function isUpstashConfigured(): boolean {
  return (
    typeof process.env.UPSTASH_REDIS_REST_URL === "string" &&
    process.env.UPSTASH_REDIS_REST_URL.length > 0 &&
    typeof process.env.UPSTASH_REDIS_REST_TOKEN === "string" &&
    process.env.UPSTASH_REDIS_REST_TOKEN.length > 0
  );
}

function ipFrom(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function rateLimitDemoMessage(
  req: NextRequest,
  sessionId: string
): Promise<RateLimitResult> {
  const ip = ipFrom(req);

  if (!isUpstashConfigured()) {
    return { allowed: true, remaining: 99, reset: 0 };
  }

  const { Redis } = await import("@upstash/redis");
  const { Ratelimit } = await import("@upstash/ratelimit");

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  });

  // Two-tier limit: 8 messages per IP per 10 minutes (abuse guard),
  // and 8 messages per session (prevent long open sessions).
  const ipLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(15, "600 s"),
    prefix: "leadflow:demo:ip",
  });
  const sessionLimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(8, "1800 s"),
    prefix: "leadflow:demo:session",
  });

  const [ipRes, sessRes] = await Promise.all([
    ipLimit.limit(ip),
    sessionLimit.limit(sessionId),
  ]);

  const allowed = ipRes.success && sessRes.success;
  const remaining = Math.min(ipRes.remaining, sessRes.remaining);
  const reset = Math.max(ipRes.reset, sessRes.reset);

  return { allowed, remaining, reset };
}
