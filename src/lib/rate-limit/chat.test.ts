import { createHash } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  createAdminClient: vi.fn(),
  redisConstructor: vi.fn(),
  limiterConstructor: vi.fn(),
  slidingWindow: vi.fn(),
  redisLimit: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({ createAdminClient: mocks.createAdminClient }));
vi.mock("@upstash/redis", () => ({
  Redis: class {
    constructor(config: unknown) { mocks.redisConstructor(config); }
  },
}));
vi.mock("@upstash/ratelimit", () => ({
  Ratelimit: class {
    static slidingWindow = mocks.slidingWindow;
    constructor(config: unknown) { mocks.limiterConstructor(config); }
    limit = mocks.redisLimit;
  },
}));

import { checkRateLimit, getClientIp, rateLimitBusinessAI, rateLimitByIp } from "./chat";

function reqWithHeaders(headers: Record<string, string>): NextRequest {
  return { headers: new Headers(headers) } as unknown as NextRequest;
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("VERCEL_ENV", undefined);
  vi.stubEnv("VERCEL", undefined);
  vi.stubEnv("UPSTASH_REDIS_REST_URL", undefined);
  vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", undefined);
  vi.stubEnv("CHAT_AI_DAILY_LIMIT", undefined);
  vi.spyOn(Date, "now").mockReturnValue(1_800_000_000_001);
  vi.spyOn(console, "error").mockImplementation(() => {});
  mocks.createAdminClient.mockReturnValue({ rpc: mocks.rpc });
  mocks.rpc.mockResolvedValue({ data: { allowed: true, remaining: 4, reset: 1_800_000_060 }, error: null });
  mocks.slidingWindow.mockReturnValue("mock-window");
  mocks.redisLimit.mockResolvedValue({ success: true, remaining: 4, reset: 1_800_000_060_001 });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("getClientIp", () => {
  it("takes the first forwarded hop", () => {
    expect(getClientIp(reqWithHeaders({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe("1.2.3.4");
  });
  it("trims forwarded IP whitespace", () => {
    expect(getClientIp(reqWithHeaders({ "x-forwarded-for": "  9.9.9.9 ,1.1.1.1" }))).toBe("9.9.9.9");
  });
  it("falls back to x-real-ip", () => {
    expect(getClientIp(reqWithHeaders({ "x-real-ip": "8.8.8.8" }))).toBe("8.8.8.8");
  });
  it("uses a shared unknown bucket when no IP is available", () => {
    expect(getClientIp(reqWithHeaders({}))).toBe("unknown");
  });
});

describe("durable production limits", () => {
  beforeEach(() => { vi.stubEnv("NODE_ENV", "production"); });

  it("uses the database limiter without Redis and sends only a hashed bucket key", async () => {
    const result = await rateLimitByIp(reqWithHeaders({ "x-forwarded-for": "1.2.3.4" }), "chat:init", 5, 60);
    expect(result).toEqual({ allowed: true, remaining: 4, reset: 1_800_000_060 });
    expect(mocks.rpc).toHaveBeenCalledWith("consume_public_rate_limit", {
      p_key_hash: createHash("sha256").update("chat:init:1.2.3.4").digest("hex"),
      p_limit: 5,
      p_window_seconds: 60,
    });
    expect(JSON.stringify(mocks.rpc.mock.calls)).not.toContain("1.2.3.4");
    expect(mocks.redisConstructor).not.toHaveBeenCalled();
  });

  it("preserves a database quota denial", async () => {
    mocks.rpc.mockResolvedValue({ data: { allowed: false, remaining: 0, reset: 1_800_000_060 }, error: null });
    expect(await checkRateLimit("quota", 5, 60)).toEqual({ allowed: false, remaining: 0, reset: 1_800_000_060 });
  });

  it.each([
    { data: null, error: { message: "database unavailable" } },
    { data: null, error: null },
    { data: {}, error: null },
    { data: { allowed: "true", remaining: 4, reset: 1_800_000_060 }, error: null },
    { data: { allowed: true, remaining: Number.NaN, reset: 1_800_000_060 }, error: null },
    { data: { allowed: true, remaining: 4, reset: Number.POSITIVE_INFINITY }, error: null },
  ])("denies on a database error or malformed result %#", async (rpcResult) => {
    mocks.rpc.mockResolvedValue(rpcResult);
    expect(await checkRateLimit("private-bucket", 5, 60)).toEqual({ allowed: false, remaining: 0, reset: 1_800_000_061 });
  });

  it("denies when the database request rejects", async () => {
    mocks.rpc.mockRejectedValue(new Error("connection refused"));
    expect((await checkRateLimit("quota", 5, 60)).allowed).toBe(false);
  });

  it("also treats a Vercel preview as deployed when NODE_ENV is not production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("VERCEL_ENV", "preview");
    await checkRateLimit("preview-quota", 5, 60);
    expect(mocks.rpc).toHaveBeenCalledOnce();
  });
});

describe("Redis limits", () => {
  it.each(["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN"])("denies a partial configuration containing only %s", async (name) => {
    vi.stubEnv(name, name.endsWith("URL") ? "https://redis.example.test" : "test-token");
    expect((await checkRateLimit("quota", 5, 60)).allowed).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
    expect(mocks.redisConstructor).not.toHaveBeenCalled();
  });

  it("converts millisecond resets to Unix seconds and hashes keys before sending", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    const result = await checkRateLimit("visitor:private-session", 5, 60);
    expect(result).toEqual({ allowed: true, remaining: 4, reset: 1_800_000_061 });
    expect(mocks.redisLimit).toHaveBeenCalledWith(createHash("sha256").update("visitor:private-session").digest("hex"));
    expect(mocks.slidingWindow).toHaveBeenCalledWith(5, "60 s");
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it.each([
    { success: undefined, remaining: 4, reset: 1_800_000_060_001 },
    { success: true, remaining: Number.NaN, reset: 1_800_000_060_001 },
    { success: true, remaining: 4, reset: Number.POSITIVE_INFINITY },
  ])("denies malformed Redis responses %#", async (response) => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    mocks.redisLimit.mockResolvedValue(response);
    expect((await checkRateLimit("quota", 5, 60)).allowed).toBe(false);
  });

  it("fails closed if Redis rejects without opening an alternate budget", async () => {
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://redis.example.test");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");
    mocks.redisLimit.mockRejectedValue(new Error("service unavailable"));
    expect((await checkRateLimit("quota", 5, 60)).allowed).toBe(false);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
});

describe("local development", () => {
  it.each(["development", "test"] as const)("allows %s requests without configured external limit services", async (environment) => {
    vi.stubEnv("NODE_ENV", environment);
    expect(await checkRateLimit("local", 5, 60)).toEqual({ allowed: true, remaining: 5, reset: 0 });
    expect(mocks.createAdminClient).not.toHaveBeenCalled();
    expect(mocks.redisConstructor).not.toHaveBeenCalled();
  });
});

describe("business AI budget", () => {
  it.each<[string | undefined, number]>([
    [undefined, 100],
    ["25", 25],
    ["10000", 10000],
    ["10001", 100],
    ["0", 100],
    ["-1", 100],
    ["1.5", 100],
    ["not-a-number", 100],
  ])("bounds configured daily limit %s to %i", async (configured, expectedLimit) => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("CHAT_AI_DAILY_LIMIT", configured);
    await rateLimitBusinessAI("business-one");
    expect(mocks.rpc).toHaveBeenCalledWith("consume_public_rate_limit", {
      p_key_hash: createHash("sha256").update("chat:ai:business:business-one").digest("hex"),
      p_limit: expectedLimit,
      p_window_seconds: 86400,
    });
  });
});
