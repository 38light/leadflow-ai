import type { NextRequest } from "next/server";
import { checkRateLimit, rateLimitByIp } from "./chat";

export async function rateLimitDemoMessage(req: NextRequest, sessionId: string) {
  const [ip, session] = await Promise.all([
    rateLimitByIp(req, "demo:ip", 15, 600),
    checkRateLimit(`demo:session:${sessionId}`, 8, 1800),
  ]);
  return { allowed: ip.allowed && session.allowed, remaining: Math.min(ip.remaining, session.remaining), reset: Math.max(ip.reset, session.reset) };
}
