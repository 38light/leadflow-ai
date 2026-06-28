"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Gift, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const refParam = searchParams.get("ref");
  const refCode = refParam ? refParam.trim().toUpperCase() : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Referral lookup state
  const [invitedBy, setInvitedBy] = useState<string | null>(null);
  const [refValid, setRefValid] = useState<boolean | null>(null);

  useEffect(() => {
    if (!refCode) {
      setRefValid(null);
      setInvitedBy(null);
      return;
    }
    let active = true;
    (async () => {
      try {
        const res = await fetch(`/api/referrals/lookup?code=${encodeURIComponent(refCode)}`);
        const json = await res.json();
        if (!active) return;
        if (res.ok && json.valid) {
          setRefValid(true);
          setInvitedBy(json.data.invited_by);
        } else {
          setRefValid(false);
          setInvitedBy(null);
        }
      } catch {
        if (active) {
          setRefValid(false);
          setInvitedBy(null);
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [refCode]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          // Stash the ref code in user_metadata so a server-side webhook
          // (or a follow-up apply call once the session is live) can attribute it.
          data: refCode && refValid ? { referred_by_code: refCode } : undefined,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      // If we have a session immediately (email confirmation off), apply the
      // ref code via the authenticated endpoint so the trigger-created profile
      // gets `referred_by_code` set.
      if (data.session && refCode && refValid) {
        try {
          await fetch("/api/referrals/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: refCode }),
          });
        } catch {
          // non-fatal — user can still proceed
        }
      }

      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign-up failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-12 bg-gray-50">
      <div className="w-full max-w-md bg-white border border-gray-200 rounded-2xl shadow-sm p-8">
        <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Start your 14-day free trial. No credit card required.
        </p>

        {/* Invited-by banner */}
        {refCode && refValid && invitedBy && (
          <div className="mt-6 flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 px-3 py-2.5 text-sm">
            <Gift className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="text-blue-900">
              Invited by <span className="font-semibold">{invitedBy}</span>
            </span>
          </div>
        )}
        {refCode && refValid === false && (
          <div className="mt-6 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2.5 text-sm text-amber-800">
            That referral code wasn&apos;t recognized — but you can still sign up.
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              minLength={8}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
