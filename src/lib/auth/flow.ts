import { z } from "zod";

export const authEmailSchema = z.string().trim().email("Enter a valid email address.").max(254);
export const newPasswordSchema = z.string().min(8, "Use at least 8 characters.").max(128, "Use no more than 128 characters.");

/** All app-controlled post-auth redirects stay on this origin. */
export function safeAuthNext(raw: string | null | undefined, fallback = "/dashboard") {
  if (!raw || raw.length > 2048 || !raw.startsWith("/") || raw.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(raw)) return fallback;
  try {
    const url = new URL(raw, "https://auth.invalid");
    if (url.origin !== "https://auth.invalid") return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch { return fallback; }
}

export function authCallbackUrl(origin: string, next: "/dashboard" | "/reset-password") {
  const url = new URL("/api/auth/callback", origin);
  url.searchParams.set("next", next);
  return url.toString();
}

const opaqueToken = z.string().regex(/^[A-Za-z0-9_-]{16,512}$/);
const otpType = z.enum(["email", "signup", "invite", "recovery"]);
export type AuthCallback =
  | { kind: "code"; code: string; next: string }
  | { kind: "otp"; tokenHash: string; type: z.infer<typeof otpType>; next: string };

export function parseAuthCallback(params: URLSearchParams): AuthCallback | null {
  if (params.has("error") || params.has("error_code")) return null;
  if (["code", "token_hash", "type", "next"].some(key => params.getAll(key).length > 1)) return null;
  const code = params.get("code");
  const tokenHash = params.get("token_hash");
  if (code && tokenHash) return null;
  if (code) {
    if (!opaqueToken.safeParse(code).success) return null;
    return { kind: "code", code, next: safeAuthNext(params.get("next")) };
  }
  const type = otpType.safeParse(params.get("type"));
  if (!tokenHash || !opaqueToken.safeParse(tokenHash).success || !type.success) return null;
  return {
    kind: "otp", tokenHash, type: type.data,
    next: type.data === "invite" || type.data === "recovery" ? "/reset-password" : safeAuthNext(params.get("next")),
  };
}
