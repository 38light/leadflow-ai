"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User,
  Calendar,
  Clock,
  Contact,
  MessageSquare,
  CalendarDays,
  Copy,
  Check,
  Shield,
  Crown,
  RefreshCw,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";
import { AccountTags } from "@/components/admin/account-tags";
import { UserNotes } from "@/components/admin/user-notes";
import { ActivityTimeline } from "@/components/admin/activity-timeline";

interface UserDetail {
  id: string;
  email: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  subscription_tier: string;
  is_active: boolean;
  role: string;
  business_name: string | null;
  business_type: string | null;
  ai_enabled: boolean;
  usage: {
    contacts: number;
    conversations: number;
    bookings: number;
  };
}

const PLANS = ["free", "starter", "professional", "enterprise"] as const;

const tierColors: Record<string, string> = {
  free: "bg-gray-100 text-gray-700 border-gray-200",
  starter: "bg-blue-100 text-blue-700 border-blue-200",
  professional: "bg-purple-100 text-purple-700 border-purple-200",
  enterprise: "bg-amber-100 text-amber-700 border-amber-200",
  // keep "pro" as alias in case DB uses that value
  pro: "bg-purple-100 text-purple-700 border-purple-200",
};

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>("");

  const loadUser = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        toast(body.error ?? "Failed to load user", "error");
        if (res.status === 403 || res.status === 401) router.push("/admin");
        return;
      }
      const { data } = await res.json();
      setUser(data);
      setSelectedPlan(data.subscription_tier ?? "free");
    } finally {
      setLoading(false);
    }
  }, [id, router, toast]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  async function performAction(
    action: "suspend" | "unsuspend" | "change_plan" | "reset_password" | "resend_verification",
    extra?: Record<string, unknown>
  ) {
    setActionLoading(action);
    setGeneratedLink(null);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast(body.error ?? "Action failed", "error");
        return;
      }

      // Update local state optimistically
      if (action === "suspend") {
        setUser((prev) => prev ? { ...prev, is_active: false } : prev);
        toast("Account suspended", "success");
      } else if (action === "unsuspend") {
        setUser((prev) => prev ? { ...prev, is_active: true } : prev);
        toast("Account unsuspended", "success");
      } else if (action === "change_plan") {
        const newPlan = (extra?.plan as string) ?? selectedPlan;
        setUser((prev) => prev ? { ...prev, subscription_tier: newPlan } : prev);
        toast(`Plan changed to ${newPlan}`, "success");
      } else if (action === "reset_password" || action === "resend_verification") {
        const link = body.data?.link ?? null;
        if (link) {
          setGeneratedLink(link);
          toast("Link generated successfully", "success");
        } else {
          toast("Action completed — no link returned (check Supabase email settings)", "info");
        }
      }
    } finally {
      setActionLoading(null);
    }
  }

  async function copyLink() {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
      toast("Link copied to clipboard", "success");
    } catch {
      toast("Failed to copy link", "error");
    }
  }

  async function handleImpersonate() {
    if (!user) return;
    setActionLoading("impersonate");
    try {
      const res = await fetch("/api/admin/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id }),
      });
      const body = await res.json();
      if (!res.ok) {
        toast(body.error ?? "Failed to start impersonation", "error");
        return;
      }
      toast(`Now viewing as ${body.user?.email ?? user.email ?? "user"}`, "success");
      router.push("/dashboard");
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="h-6 w-24 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-gray-500">User not found.</p>
        <Link href="/admin" className="mt-4 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>
      </div>
    );
  }

  const isSuperAdmin = user.role === "super_admin";

  return (
    <div className="p-6 lg:p-8">
      {/* Back + Header */}
      <div className="mb-6">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Admin
        </Link>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-lg">
              {user.email?.[0]?.toUpperCase() ?? <User className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">
                  {user.business_name ?? user.email ?? "Unknown User"}
                </h1>
                {isSuperAdmin && <Crown className="h-4 w-4 text-amber-500" />}
              </div>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold",
                user.is_active
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-red-200 bg-red-50 text-red-700"
              )}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 rounded-full",
                  user.is_active ? "bg-green-500" : "bg-red-500"
                )}
              />
              {user.is_active ? "Active" : "Suspended"}
            </span>

            <span
              className={cn(
                "inline-block rounded-full border px-3 py-1 text-xs font-semibold capitalize",
                tierColors[user.subscription_tier] ?? "bg-gray-100 text-gray-700 border-gray-200"
              )}
            >
              {user.subscription_tier}
            </span>

            {isSuperAdmin && (
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                <Shield className="h-3 w-3" />
                Super Admin
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Meta Info */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <Calendar className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Joined</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(user.created_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <Clock className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Last Active</p>
            <p className="text-sm font-medium text-gray-900">{formatDateTime(user.last_sign_in_at)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <User className="h-5 w-5 text-gray-400" />
          <div>
            <p className="text-xs text-gray-500">Business Type</p>
            <p className="text-sm font-medium text-gray-900">{user.business_type ?? "—"}</p>
          </div>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Usage</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
              <Contact className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{user.usage.contacts.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Contacts</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
              <MessageSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{user.usage.conversations.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Conversations</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
              <CalendarDays className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{user.usage.bookings.toLocaleString()}</p>
              <p className="text-xs text-gray-500">Bookings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-sm font-semibold uppercase tracking-wider text-gray-500">Admin Actions</h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Suspend / Unsuspend */}
          <button
            onClick={() => performAction(user.is_active ? "suspend" : "unsuspend")}
            disabled={actionLoading !== null}
            className={cn(
              "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed",
              user.is_active
                ? "border-amber-200 bg-amber-50 hover:bg-amber-100"
                : "border-green-200 bg-green-50 hover:bg-green-100"
            )}
          >
            <div className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg",
              user.is_active ? "bg-amber-100" : "bg-green-100"
            )}>
              {actionLoading === "suspend" || actionLoading === "unsuspend" ? (
                <RefreshCw className="h-4 w-4 animate-spin text-amber-600" />
              ) : (
                <Shield className={cn("h-4 w-4", user.is_active ? "text-amber-600" : "text-green-600")} />
              )}
            </div>
            <div>
              <p className={cn("font-semibold text-sm", user.is_active ? "text-amber-800" : "text-green-800")}>
                {user.is_active ? "Suspend Account" : "Unsuspend Account"}
              </p>
              <p className={cn("text-xs mt-0.5", user.is_active ? "text-amber-600" : "text-green-600")}>
                {user.is_active ? "Disable user access" : "Restore user access"}
              </p>
            </div>
          </button>

          {/* Change Plan */}
          <div className="flex flex-col gap-2 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
              {actionLoading === "change_plan" ? (
                <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
              ) : (
                <Crown className="h-4 w-4 text-blue-600" />
              )}
            </div>
            <div>
              <p className="font-semibold text-sm text-blue-800">Change Plan</p>
              <p className="text-xs text-blue-600 mt-0.5">Update subscription tier</p>
            </div>
            <div className="flex gap-2">
              <select
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
                disabled={actionLoading !== null}
                className="flex-1 rounded-lg border border-blue-200 bg-white px-2 py-1.5 text-xs text-gray-700 shadow-sm focus:border-blue-400 focus:outline-none disabled:opacity-60"
              >
                {PLANS.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </select>
              <button
                onClick={() => performAction("change_plan", { plan: selectedPlan })}
                disabled={actionLoading !== null || selectedPlan === user.subscription_tier}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Apply
              </button>
            </div>
          </div>

          {/* Reset Password */}
          <button
            onClick={() => performAction("reset_password")}
            disabled={actionLoading !== null}
            className="flex flex-col items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left transition-all hover:bg-gray-100 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200">
              {actionLoading === "reset_password" ? (
                <RefreshCw className="h-4 w-4 animate-spin text-gray-600" />
              ) : (
                <User className="h-4 w-4 text-gray-600" />
              )}
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800">Reset Password</p>
              <p className="text-xs text-gray-500 mt-0.5">Generate recovery link</p>
            </div>
          </button>

          {/* Resend Verification */}
          <button
            onClick={() => performAction("resend_verification")}
            disabled={actionLoading !== null}
            className="flex flex-col items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-left transition-all hover:bg-gray-100 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-200">
              {actionLoading === "resend_verification" ? (
                <RefreshCw className="h-4 w-4 animate-spin text-gray-600" />
              ) : (
                <MessageSquare className="h-4 w-4 text-gray-600" />
              )}
            </div>
            <div>
              <p className="font-semibold text-sm text-gray-800">Resend Verification</p>
              <p className="text-xs text-gray-500 mt-0.5">Send magic link</p>
            </div>
          </button>

          {/* Impersonate User */}
          <button
            onClick={handleImpersonate}
            disabled={actionLoading !== null || isSuperAdmin}
            title={isSuperAdmin ? "Cannot impersonate a super admin" : "View app as this user"}
            className="flex flex-col items-start gap-2 rounded-xl border border-purple-200 bg-purple-50 p-4 text-left transition-all hover:bg-purple-100 hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
              {actionLoading === "impersonate" ? (
                <RefreshCw className="h-4 w-4 animate-spin text-purple-600" />
              ) : (
                <Eye className="h-4 w-4 text-purple-600" />
              )}
            </div>
            <div>
              <p className="font-semibold text-sm text-purple-800">Impersonate User</p>
              <p className="text-xs text-purple-600 mt-0.5">View app as this user</p>
            </div>
          </button>
        </div>

        {/* Generated Link display */}
        {generatedLink && (
          <div className="mt-5 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-blue-700">Generated Link</p>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={generatedLink}
                className="flex-1 truncate rounded-lg border border-blue-200 bg-white px-3 py-2 text-xs text-gray-700 focus:outline-none"
              />
              <button
                onClick={copyLink}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
              >
                {linkCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    Copy
                  </>
                )}
              </button>
            </div>
            <p className="mt-2 text-xs text-blue-600">
              This link is single-use and expires after a short period. Share it directly with the user.
            </p>
          </div>
        )}
      </div>

      {/* Account Tags */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500">Account Tags</h2>
        <AccountTags userId={id} />
      </div>

      {/* Internal Notes */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Internal Notes</h2>
          <p className="mt-0.5 text-xs text-gray-400">Visible to all admins — never shown to the user</p>
        </div>
        <UserNotes userId={id} />
      </div>

      {/* Activity Timeline */}
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">Activity Timeline</h2>
          <p className="mt-0.5 text-xs text-gray-400">Last 20 events across all modules</p>
        </div>
        <ActivityTimeline userId={id} />
      </div>
    </div>
  );
}
