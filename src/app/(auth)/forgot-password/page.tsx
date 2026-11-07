"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { authCallbackUrl, authEmailSchema } from "@/lib/auth/flow";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = authEmailSchema.safeParse(email);
    if (!parsed.success) { setError("Enter a valid email address."); return; }
    setError(null);
    setSubmitting(true);
    try {
      const { error: resetError } = await createClient().auth.resetPasswordForEmail(parsed.data, {
        redirectTo: authCallbackUrl(window.location.origin, "/reset-password"),
      });
      if (resetError) { setError("Unable to request a reset right now. Please wait a moment and try again."); return; }
      setSent(true);
    } catch { setError("Unable to connect. Please try again."); }
    finally { setSubmitting(false); }
  }

  return <div className="w-full max-w-md px-5 py-12">
    <Link href="/login" className="text-sm font-medium text-blue-700 hover:underline">Back to sign in</Link>
    <h1 className="mt-6 text-3xl font-semibold tracking-tight text-gray-950">Reset your password</h1>
    {sent ? <div role="status" className="mt-6 rounded-xl border border-green-200 bg-green-50 p-5 text-sm text-green-950">
      If an account exists for that email, you will receive a password reset link. Check your inbox and spam folder. The link can only be used once.
    </div> : <>
      <p className="mt-2 text-sm text-gray-600">Enter your account email and we’ll send a reset link.</p>
      <form onSubmit={submit} className="mt-7 space-y-5">
        <Input id="reset-email" label="Email" type="email" autoComplete="email" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} disabled={submitting} />
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <Button type="submit" loading={submitting} className="w-full">{submitting ? "Requesting link…" : "Send reset link"}</Button>
      </form>
    </>}
  </div>;
}
