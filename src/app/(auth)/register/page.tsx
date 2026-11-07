"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Gift, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { authCallbackUrl, authEmailSchema, newPasswordSchema } from "@/lib/auth/flow";

function RegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const refParam = searchParams.get("ref");
  const refCode = refParam ? refParam.trim().toUpperCase() : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);

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
    if (process.env.NEXT_PUBLIC_PILOT_MODE === "true") { setError("Account creation is by invitation."); return; }
    const parsedEmail = authEmailSchema.safeParse(email);
    const parsedPassword = newPasswordSchema.safeParse(password);
    if (!parsedEmail.success || !parsedPassword.success) { setError("Enter a valid email and a password between 8 and 128 characters."); return; }
    setSubmitting(true);

    try {
      const supabase = createClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: parsedEmail.data,
        password: parsedPassword.data,
        options: {
          emailRedirectTo: authCallbackUrl(window.location.origin, "/dashboard"),
          // Stash the ref code in user_metadata so a server-side webhook
          // (or a follow-up apply call once the session is live) can attribute it.
          data: refCode && refValid ? { referred_by_code: refCode } : undefined,
        },
      });

      if (signUpError) {
        setError("Unable to create an account. Check your details and try again, or sign in if you already have an account.");
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

      if (!data.session) {
        setPassword("");
        setConfirmationSent(true);
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmationSent) {
    return <div className="w-full max-w-md px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-950">Check your email</h1>
      <p role="status" className="mt-4 text-sm text-gray-700">If confirmation is needed for this address, you’ll receive a link to finish creating your account. Check your inbox and spam folder.</p>
      <Link href="/login" className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Back to sign in</Link>
    </div>;
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
              maxLength={254}
              disabled={submitting}
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
              maxLength={128}
              disabled={submitting}
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div role="alert" className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
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
        <p className="mt-5 text-sm text-gray-600">Already have an account? <Link href="/login" className="font-medium text-blue-700 hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  // This is presentation only. Hosted Supabase must also disable public signup
  // for an invitation-only pilot; a client flag cannot secure the Auth API.
  if (process.env.NEXT_PUBLIC_PILOT_MODE === "true") {
    return <div className="w-full max-w-md px-5 py-12">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-950">Join by invitation</h1>
      <p className="mt-4 text-sm text-gray-700">LeadFlow is currently available to invited businesses. Use the invitation email from your account owner to set your password.</p>
      <Link href="/login" className="mt-6 inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Sign in</Link>
    </div>;
  }
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}
