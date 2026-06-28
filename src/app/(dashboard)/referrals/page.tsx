"use client";

import { useEffect, useState, useCallback } from "react";
import { Copy, Check, Gift, Users, DollarSign, Share2 } from "lucide-react";

interface ReferredUser {
  user_id: string;
  business_name: string | null;
  signed_up_at: string;
  subscription_tier: string | null;
}

interface ReferralCredit {
  id: string;
  amount_cents: number;
  reason: string;
  related_user_id: string | null;
  created_at: string;
}

interface ReferralData {
  code: string;
  share_link: string;
  total_credits_cents: number;
  referred_users: ReferredUser[];
  credits: ReferralCredit[];
}

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function tierBadgeClasses(tier: string | null): string {
  switch (tier) {
    case "pro":
      return "bg-blue-50 text-blue-700";
    case "starter":
      return "bg-purple-50 text-purple-700";
    case "enterprise":
      return "bg-gray-900 text-white";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

export default function ReferralsPage() {
  const [data, setData] = useState<ReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<"code" | "link" | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/referrals");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load referrals");
      setData(json.data as ReferralData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function copyTo(field: "code" | "link", value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      // ignore — browsers without clipboard permission
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="h-32 bg-gray-100 rounded-xl animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-2xl font-bold mb-4">Referrals</h1>
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          {error ?? "Could not load your referral data."}
        </div>
      </div>
    );
  }

  const referralsSent = data.referred_users.length; // signed-up referrals
  const signedUp = referralsSent;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-600">
          <Gift className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Referrals</h1>
          <p className="text-sm text-gray-500">
            Invite friends — both of you get credit when they sign up.
          </p>
        </div>
      </div>

      {/* Share card */}
      <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 border border-blue-100 rounded-2xl p-6">
        <div className="flex items-start gap-3">
          <Share2 className="h-5 w-5 text-blue-600 mt-1" />
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="font-semibold text-gray-900">Your referral code</h2>
              <p className="text-sm text-gray-500">
                Share this code or link with anyone who&apos;d benefit from LeadFlow.
              </p>
            </div>

            {/* Code */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Code
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-lg font-mono font-bold text-gray-900 tracking-wider">
                  {data.code}
                </code>
                <button
                  type="button"
                  onClick={() => copyTo("code", data.code)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {copiedField === "code" ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Link */}
            <div>
              <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                Share link
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={data.share_link}
                  className="flex-1 rounded-lg bg-white border border-gray-200 px-4 py-2.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => copyTo("link", data.share_link)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  {copiedField === "link" ? (
                    <>
                      <Check className="h-4 w-4 text-green-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Referrals sent</p>
            <Share2 className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">{referralsSent}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Signed up</p>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">{signedUp}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">Credits earned</p>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-3xl font-bold text-green-600">
            {formatMoney(data.total_credits_cents)}
          </p>
        </div>
      </div>

      {/* Referred users table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="font-semibold text-gray-900">Referred users</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Everyone who has signed up using your referral code.
          </p>
        </div>
        {data.referred_users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
              <Users className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">No referrals yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Share your code or link to start earning credits.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Signed up
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.referred_users.map((u) => (
                <tr key={u.user_id}>
                  <td className="px-6 py-3 text-sm font-medium text-gray-900">
                    {u.business_name ?? "—"}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tierBadgeClasses(u.subscription_tier)}`}
                    >
                      {u.subscription_tier ?? "free"}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {formatDate(u.signed_up_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
