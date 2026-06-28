"use client";

import { useEffect, useState, useCallback } from "react";
import { Shield, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIQualitySettings {
  training_data_opt_out: boolean;
}

export default function ComplianceSettingsPage() {
  const [optOut, setOptOut] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/ai-quality");
      if (res.ok) {
        const json = await res.json();
        const data = (json.data ?? {}) as Partial<AIQualitySettings>;
        setOptOut(Boolean(data.training_data_opt_out));
      } else {
        setOptOut(false);
      }
    } catch {
      setOptOut(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  async function toggleOptOut() {
    if (optOut === null) return;
    const next = !optOut;
    setOptOut(next); // optimistic
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/ai-quality", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ training_data_opt_out: next }),
      });
      if (!res.ok) {
        // revert on failure
        setOptOut(!next);
        const json = await res.json().catch(() => ({}));
        setMessage(json.error ?? "Failed to save preference.");
      } else {
        setMessage("Preference saved.");
      }
    } catch {
      setOptOut(!next);
      setMessage("Network error. Please try again.");
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Compliance</h1>
          <p className="text-sm text-gray-500">
            Privacy, data sovereignty, and AI transparency controls.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Training data opt-out */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="flex-1">
              <h2 className="font-semibold text-gray-900">
                Don&apos;t send our data to Anthropic for training
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                When enabled, conversations sent to Claude include an opt-out signal so
                Anthropic does not use your customers&apos; data to improve future models.
                Recommended for healthcare, legal, and enterprise accounts.
              </p>
              {message && (
                <p
                  className={cn(
                    "text-xs mt-2 inline-flex items-center gap-1",
                    message.includes("saved") ? "text-green-600" : "text-red-600"
                  )}
                >
                  {message.includes("saved") && <Check className="h-3 w-3" />}
                  {message}
                </p>
              )}
            </div>
            {loading || optOut === null ? (
              <Loader2 className="h-5 w-5 text-gray-400 animate-spin mt-1" />
            ) : (
              <button
                type="button"
                onClick={toggleOptOut}
                disabled={saving}
                aria-pressed={optOut}
                className={cn(
                  "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 mt-1",
                  optOut ? "bg-blue-600" : "bg-gray-200",
                  saving && "opacity-60"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    optOut ? "translate-x-6" : "translate-x-1"
                  )}
                />
              </button>
            )}
          </div>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-2">AI Transparency</h2>
          <p className="text-sm text-gray-500">
            Your AI assistant identifies itself as an AI in the first message of every conversation,
            complying with Australian consumer protection guidelines.
          </p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-2">Opt-Out Handling</h2>
          <p className="text-sm text-gray-500">
            When a contact sends &quot;STOP&quot;, &quot;UNSUBSCRIBE&quot;, or similar keywords,
            the system automatically marks them as opted out and stops all outbound messages.
          </p>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-2">Data Sovereignty</h2>
          <p className="text-sm text-gray-500">
            All data is stored in your Supabase instance. For Australian Privacy Principles (APP)
            compliance, ensure your Supabase project is hosted in the Sydney (ap-southeast-2) region.
          </p>
        </div>
      </div>
    </div>
  );
}
