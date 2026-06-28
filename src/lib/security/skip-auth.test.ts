import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { skipAuthEnabled } from "./skip-auth";

// skipAuthEnabled() is the fail-closed guard around the SKIP_AUTH local-dev
// backdoor (which disables auth AND RLS). A regression here could silently
// disable all security on a deploy, so it gets the most thorough coverage.

const ENV_KEYS = [
  "SKIP_AUTH",
  "VERCEL_ENV",
  "VERCEL",
  "NEXT_PUBLIC_SUPABASE_URL",
] as const;

describe("skipAuthEnabled", () => {
  let saved: Record<string, string | undefined>;

  beforeEach(() => {
    saved = {};
    for (const k of ENV_KEYS) {
      saved[k] = process.env[k];
      delete process.env[k];
    }
  });

  afterEach(() => {
    for (const k of ENV_KEYS) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    }
  });

  it("returns false when SKIP_AUTH is unset", () => {
    expect(skipAuthEnabled()).toBe(false);
  });

  it("returns false when SKIP_AUTH is not exactly 'true'", () => {
    process.env.SKIP_AUTH = "false";
    expect(skipAuthEnabled()).toBe(false);
    process.env.SKIP_AUTH = "1";
    expect(skipAuthEnabled()).toBe(false);
    process.env.SKIP_AUTH = "TRUE";
    expect(skipAuthEnabled()).toBe(false);
  });

  it("returns true for SKIP_AUTH=true against a localhost Supabase URL", () => {
    process.env.SKIP_AUTH = "true";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://127.0.0.1:54421";
    expect(skipAuthEnabled()).toBe(true);
  });

  it("accepts localhost / ::1 / host.docker.internal forms", () => {
    process.env.SKIP_AUTH = "true";
    for (const url of [
      "http://localhost:54421",
      "http://127.0.0.1:54421",
      "http://[::1]:54421",
      "http://host.docker.internal:54421",
    ]) {
      process.env.NEXT_PUBLIC_SUPABASE_URL = url;
      expect(skipAuthEnabled()).toBe(true);
    }
  });

  it("returns true when SKIP_AUTH=true and no Supabase URL is set (url check skipped)", () => {
    process.env.SKIP_AUTH = "true";
    expect(skipAuthEnabled()).toBe(true);
  });

  it("THROWS when SKIP_AUTH=true on a Vercel deployment (VERCEL_ENV set)", () => {
    process.env.SKIP_AUTH = "true";
    process.env.VERCEL_ENV = "preview";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "http://localhost:54421";
    expect(() => skipAuthEnabled()).toThrow(/forbidden on a deployed environment/);
  });

  it("THROWS when SKIP_AUTH=true and VERCEL=1", () => {
    process.env.SKIP_AUTH = "true";
    process.env.VERCEL = "1";
    expect(() => skipAuthEnabled()).toThrow(/forbidden on a deployed environment/);
  });

  it("THROWS when SKIP_AUTH=true against a non-localhost Supabase URL", () => {
    process.env.SKIP_AUTH = "true";
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://myproject.supabase.co";
    expect(() => skipAuthEnabled()).toThrow(/only allowed against a localhost Supabase URL/);
  });
});
