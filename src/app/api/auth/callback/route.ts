import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { parseAuthCallback } from "@/lib/auth/flow";

function redirectWithoutToken(url: URL) {
  const response = NextResponse.redirect(url);
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  return response;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const callback = parseAuthCallback(searchParams);
  const failure = new URL("/login?error=auth_failed", origin);
  if (!callback) return redirectWithoutToken(failure);
  try {
    const supabase = await createServerClient();
    const { data, error } = callback.kind === "code"
      ? await supabase.auth.exchangeCodeForSession(callback.code)
      : await supabase.auth.verifyOtp({ token_hash: callback.tokenHash, type: callback.type });
    if (error || !data.session) return redirectWithoutToken(failure);
    return redirectWithoutToken(new URL(callback.next, origin));
  } catch {
    // Never log callback URLs or auth tokens.
    console.error("[Auth callback] Unable to establish a session");
    return redirectWithoutToken(failure);
  }
}
