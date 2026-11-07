"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { createClient } from "@/lib/supabase/client";
import { authEmailSchema, safeAuthNext } from "@/lib/auth/flow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const linkError = params.get("error") === "auth_failed";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = authEmailSchema.safeParse(email);
    if (!parsed.success || !password) { setError("Enter your email and password."); return; }
    setSubmitting(true);
    try {
      const { data, error: signInError } = await createClient().auth.signInWithPassword({ email: parsed.data, password });
      if (signInError || !data.session) {
        setError(signInError?.code === "email_not_confirmed"
          ? "Confirm your email using the link in your inbox, then sign in."
          : "Unable to sign in. Check your email and password, or reset your password.");
        return;
      }
      router.replace(safeAuthNext(params.get("next")) as Route);
      router.refresh();
    } catch {
      setError("Unable to connect. Please try again.");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="w-full max-w-md px-5 py-12">
      <Link href="/" className="text-sm font-semibold text-blue-700">LeadFlow AI</Link>
      <h1 className="mt-6 text-3xl font-semibold tracking-tight text-gray-950">Welcome back</h1>
      <p className="mt-2 text-sm text-gray-600">Sign in to see what needs your attention today.</p>
      {linkError && <p role="alert" className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">This sign-in link is invalid or has expired. Sign in below, request a password reset, or ask your account owner for a new invitation.</p>}
      <form onSubmit={submit} className="mt-7 space-y-5">
        <Input id="login-email" label="Email" type="email" autoComplete="username" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} disabled={submitting} />
        <Input id="login-password" label="Password" type="password" autoComplete="current-password" required maxLength={128} value={password} onChange={event => setPassword(event.target.value)} disabled={submitting} />
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <Button type="submit" loading={submitting} className="w-full">{submitting ? "Signing in…" : "Sign in"}</Button>
      </form>
      <Link href="/forgot-password" className="mt-5 block text-sm text-blue-700 hover:underline">Forgot your password?</Link>
      {process.env.NEXT_PUBLIC_PILOT_MODE === "true"
        ? <p className="mt-6 text-sm text-gray-600">Access is by invitation. Use the invitation from your account owner to get started.</p>
        : <p className="mt-6 text-sm text-gray-600">New to LeadFlow? <Link href="/register" className="font-medium text-blue-700 hover:underline">Create an account</Link></p>}
    </div>
  );
}

export default function LoginPage() {
  return <Suspense fallback={<p className="p-8 text-sm text-gray-600">Loading sign in…</p>}><LoginForm /></Suspense>;
}
