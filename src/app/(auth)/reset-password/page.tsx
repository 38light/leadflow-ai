"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { newPasswordSchema } from "@/lib/auth/flow";
import { initializePasswordSession, updatePasswordForIdentity, type PasswordIdentity } from "@/lib/auth/password-session";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const [checking, setChecking] = useState(true);
  const [identity, setIdentity] = useState<PasswordIdentity | null>(null);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionCheck = useRef<Promise<PasswordIdentity | null> | null>(null);

  useEffect(() => {
    let active = true;
    // Reuse the same check through StrictMode's effect replay: the fragment is
    // consumed only once, and an invalid link cannot fall back to stored auth.
    sessionCheck.current ??= initializePasswordSession(window, createClient);
    void sessionCheck.current.then(valid => {
      if (active) { setIdentity(valid); setChecking(false); }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!identity) return;
    const { data: { subscription } } = createClient().auth.onAuthStateChange((_event, session) => {
      if (session?.user.id !== identity.id) {
        setIdentity(null);
        setPassword("");
        setConfirmation("");
      }
    });
    return () => subscription.unsubscribe();
  }, [identity]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = newPasswordSchema.safeParse(password);
    if (!parsed.success) { setError(parsed.error.issues[0].message); return; }
    if (password !== confirmation) { setError("Your passwords do not match."); return; }
    if (!identity) { setError("Open a new invitation or reset link first."); return; }
    setSubmitting(true);
    try {
      const result = await updatePasswordForIdentity(createClient(), identity, parsed.data, () => createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: `leadflow-password-update-${crypto.randomUUID()}` } },
      ));
      if (!result.ok && result.reason === "identity_changed") {
        setIdentity(null);
        setPassword("");
        setConfirmation("");
        return;
      }
      if (!result.ok) {
        setError(result.reason === "same_password" ? "Choose a password different from your current one." : "Unable to save your password. Try again or request a new reset link.");
        return;
      }
      setPassword("");
      setConfirmation("");
      setSaved(true);
    } catch { setError("Unable to connect. Please try again."); }
    finally { setSubmitting(false); }
  }

  return <div className="w-full max-w-md px-5 py-12">
    <Link href="/login" className="text-sm font-medium text-blue-700 hover:underline">LeadFlow AI</Link>
    <h1 className="mt-6 text-3xl font-semibold tracking-tight text-gray-950">Set your password</h1>
    {checking ? <p role="status" className="mt-5 text-sm text-gray-600">Checking your sign-in link…</p>
      : saved ? <div className="mt-6 space-y-4"><p role="status" className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-950">Your password is saved. You can use it next time you sign in.</p><Link href="/dashboard" className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white">Open Today</Link></div>
      : !identity ? <div className="mt-6 space-y-4"><p role="alert" className="text-sm text-gray-700">We couldn’t verify your invitation or reset link. It may have expired, already been used, or your sign-in session may have changed. Request a new reset link, or ask your account owner for another invitation.</p><Link href="/forgot-password" className="text-sm font-medium text-blue-700 hover:underline">Request a reset link</Link></div>
      : <form onSubmit={submit} className="mt-7 space-y-5">
        <p className="text-sm text-gray-600">Choose a password with at least 8 characters.</p>
        {identity.email && <p className="text-sm text-gray-600">Account: <span className="font-medium text-gray-950">{identity.email}</span></p>}
        <Input id="new-password" label="New password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={password} onChange={event => setPassword(event.target.value)} disabled={submitting} />
        <Input id="confirm-password" label="Confirm password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required value={confirmation} onChange={event => setConfirmation(event.target.value)} disabled={submitting} />
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <Button type="submit" loading={submitting} className="w-full">{submitting ? "Saving password…" : "Save password"}</Button>
      </form>}
  </div>;
}
