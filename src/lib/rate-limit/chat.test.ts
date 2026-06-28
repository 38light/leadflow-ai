import { describe, it, expect, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";
import { getClientIp, rateLimitByIp } from "./chat";

// Build a minimal stand-in for NextRequest — getClientIp/rateLimitByIp only
// read request headers, so a Headers-backed object is sufficient and hermetic.
function reqWithHeaders(headers: Record<string, string>): NextRequest {
  return { headers: new Headers(headers) } as unknown as NextRequest;
}

describe("getClientIp", () => {
  it("takes the first hop from x-forwarded-for", () => {
    expect(getClientIp(reqWithHeaders({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe(
      "1.2.3.4"
    );
  });

  it("trims whitespace around the forwarded IP", () => {
    expect(getClientIp(reqWithHeaders({ "x-forwarded-for": "  9.9.9.9 ,1.1.1.1" }))).toBe(
      "9.9.9.9"
    );
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    expect(getClientIp(reqWithHeaders({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
  });

  it("returns 'unknown' when no IP headers are present", () => {
    expect(getClientIp(reqWithHeaders({}))).toBe("unknown");
  });
});

describe("rateLimitByIp (graceful degradation)", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {
      UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
      UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    };
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  afterEach(() => {
    for (const [k, v] of Object.entries(saved)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  });

  it("allows all requests when Upstash is not configured", async () => {
    const result = await rateLimitByIp(
      reqWithHeaders({ "x-forwarded-for": "1.2.3.4" }),
      "test:bucket",
      5,
      60
    );
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(5);
  });
});
