"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Users,
  Contact,
  CalendarDays,
  MessageSquare,
  Clock,
  AlertCircle,
  Plus,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { UserNotes } from "@/components/admin/user-notes";
import { AccountTags } from "@/components/admin/account-tags";
import { useToast } from "@/components/ui/toast";

interface TeamMember {
  id: string;
  email: string;
  role: string;
  created_at: string;
}

interface AccountDetail {
  id: string;
  profile_id: string;
  email: string;
  last_sign_in_at: string | null;
  business_name: string | null;
  business_type: string | null;
  subscription_tier: string;
  is_active: boolean;
  ai_enabled: boolean;
  timezone: string;
  phone: string | null;
  website: string | null;
  created_at: string;
  updated_at: string;
  team_members: TeamMember[];
  stats: {
    member_count: number;
    contact_count: number;
    booking_count: number;
    conversation_count: number;
  };
}

const PLAN_BADGE_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  starter: "bg-blue-100 text-blue-700",
  pro: "bg-purple-100 text-purple-700",
  professional: "bg-purple-100 text-purple-700",
  enterprise: "bg-amber-100 text-amber-700",
};

const ROLE_BADGE: Record<string, { bg: string; text: string }> = {
  admin: { bg: "bg-purple-100", text: "text-purple-700" },
  member: { bg: "bg-blue-100", text: "text-blue-700" },
  viewer: { bg: "bg-gray-100", text: "text-gray-700" },
};

function PlanBadge({ tier }: { tier: string }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
        PLAN_BADGE_COLORS[tier] ?? "bg-gray-100 text-gray-700"
      }`}
    >
      {tier}
    </span>
  );
}

function RoleBadge({ role }: { role: string }) {
  const style = ROLE_BADGE[role] ?? { bg: "bg-gray-100", text: "text-gray-700" };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${style.bg} ${style.text}`}
    >
      {role}
    </span>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-base font-semibold text-gray-900">{title}</h2>
      {children}
    </div>
  );
}

export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const userId = params.id;

  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Seat note modal state
  const [showSeatModal, setShowSeatModal] = useState(false);
  const [seatNote, setSeatNote] = useState("");
  const [seatCount, setSeatCount] = useState<string>("");
  const [seatAction, setSeatAction] = useState<"add_seats" | "remove_seats">("add_seats");
  const [submittingSeat, setSubmittingSeat] = useState(false);
  const { toast } = useToast();

  const fetchAccount = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/admin/accounts/${userId}`);
    if (res.ok) {
      const { data } = await res.json();
      setAccount(data);
    } else {
      const body = await res.json().catch(() => ({}));
      setError((body as { error?: string }).error ?? "Failed to load account");
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchAccount();
  }, [fetchAccount]);

  async function handleSeatAction() {
    const seats = parseInt(seatCount, 10);
    if (isNaN(seats) || seats <= 0) {
      toast("Please enter a valid seat count", "error");
      return;
    }
    setSubmittingSeat(true);
    const res = await fetch(`/api/admin/accounts/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: seatAction, seats, note: seatNote || undefined }),
    });
    if (res.ok) {
      toast("Seat note recorded", "success");
      setShowSeatModal(false);
      setSeatNote("");
      setSeatCount("");
    } else {
      const body = await res.json().catch(() => ({}));
      toast((body as { error?: string }).error ?? "Failed to save note", "error");
    }
    setSubmittingSeat(false);
  }

  if (loading) {
    return (
      <div className="p-6 lg:p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-gray-50 p-6">
              <Skeleton className="h-4 w-32 mb-4" />
              <Skeleton className="h-6 w-full mb-2" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !account) {
    return (
      <div className="p-6 lg:p-8">
        <Link
          href="/admin/accounts"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Accounts
        </Link>
        <div className="mt-8 flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-gray-600">{error ?? "Account not found"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Back + Header */}
      <div>
        <Link
          href="/admin/accounts"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Accounts
        </Link>
        <div className="flex items-start gap-4 mt-2">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
            <Building2 className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {account.business_name ?? "Unnamed Business"}
            </h1>
            <p className="text-sm text-gray-500">{account.email}</p>
          </div>
        </div>
      </div>

      {/* Section 1 — Account Overview */}
      <SectionCard title="Account Overview">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Plan + Status */}
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Plan</p>
            <PlanBadge tier={account.subscription_tier} />
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Status</p>
            <Badge variant={account.is_active ? "success" : "danger"} size="sm">
              {account.is_active ? "Active" : "Inactive"}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Joined</p>
            <p className="text-sm font-medium text-gray-900">
              {new Date(account.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Last Sign In</p>
            <p className="text-sm text-gray-700">
              {account.last_sign_in_at
                ? new Date(account.last_sign_in_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Never"}
            </p>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Members",
              value: account.stats.member_count,
              icon: Users,
              color: "text-indigo-600",
              bg: "bg-indigo-50",
            },
            {
              label: "Contacts",
              value: account.stats.contact_count,
              icon: Contact,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "Bookings",
              value: account.stats.booking_count,
              icon: CalendarDays,
              color: "text-orange-600",
              bg: "bg-orange-50",
            },
            {
              label: "Conversations",
              value: account.stats.conversation_count,
              icon: MessageSquare,
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50/60 px-4 py-3"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${stat.bg}`}
              >
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Business detail */}
        {(account.business_type || account.phone || account.website || account.timezone) && (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 border-t border-gray-100 pt-4">
            {account.business_type && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Type</p>
                <p className="text-sm text-gray-700">{account.business_type}</p>
              </div>
            )}
            {account.phone && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Phone</p>
                <p className="text-sm text-gray-700">{account.phone}</p>
              </div>
            )}
            {account.website && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Website</p>
                <a
                  href={account.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline"
                >
                  {account.website}
                </a>
              </div>
            )}
            {account.timezone && (
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 font-medium">Timezone</p>
                <p className="text-sm text-gray-700">{account.timezone}</p>
              </div>
            )}
          </div>
        )}
      </SectionCard>

      {/* Section 2 — Team Members */}
      <SectionCard title={`Team Members (${account.team_members.length})`}>
        {account.team_members.length === 0 ? (
          <p className="text-sm text-gray-400">No team members yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Email
                  </th>
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Role
                  </th>
                  <th className="pb-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {account.team_members.map((member) => (
                  <tr key={member.id} className="hover:bg-gray-50/40">
                    <td className="py-2.5 pr-4 text-sm text-gray-800">{member.email}</td>
                    <td className="py-2.5 pr-4">
                      <RoleBadge role={member.role} />
                    </td>
                    <td className="py-2.5 text-sm text-gray-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {new Date(member.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Section 3 — Seat Management */}
      <SectionCard title="Seat Management">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Current team size:{" "}
              <span className="font-semibold text-gray-900">
                {account.stats.member_count} member{account.stats.member_count !== 1 ? "s" : ""}
              </span>
            </p>
            <p className="mt-1 text-xs text-gray-400">
              Seat changes are logged as internal notes. True enforcement is managed at the product level.
            </p>
          </div>
          <button
            onClick={() => setShowSeatModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Seat Note
          </button>
        </div>

        {/* Seat modal */}
        {showSeatModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
              <h3 className="mb-4 text-base font-semibold text-gray-900">Seat Management Note</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Action</label>
                  <select
                    value={seatAction}
                    onChange={(e) =>
                      setSeatAction(e.target.value as "add_seats" | "remove_seats")
                    }
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="add_seats">Add seats</option>
                    <option value="remove_seats">Remove seats</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Number of seats
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={seatCount}
                    onChange={(e) => setSeatCount(e.target.value)}
                    placeholder="e.g. 5"
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Additional note (optional)
                  </label>
                  <textarea
                    value={seatNote}
                    onChange={(e) => setSeatNote(e.target.value)}
                    placeholder="Any additional context..."
                    rows={2}
                    className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowSeatModal(false);
                    setSeatNote("");
                    setSeatCount("");
                  }}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSeatAction}
                  disabled={submittingSeat}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  {submittingSeat ? "Saving..." : "Save Note"}
                </button>
              </div>
            </div>
          </div>
        )}
      </SectionCard>

      {/* Section 4 — Internal Notes */}
      <SectionCard title="Internal Notes">
        <UserNotes userId={userId} />
      </SectionCard>

      {/* Section 5 — Account Tags */}
      <SectionCard title="Account Tags">
        <AccountTags userId={userId} />
      </SectionCard>
    </div>
  );
}
