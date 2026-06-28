"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Users,
  MessageSquare,
  Contact,
  BarChart3,
  Shield,
  Crown,
  ChevronRight,
  ClipboardList,
  TrendingUp,
  DollarSign,
  Search,
  Mail,
  Layers,
  Database,
  Building2,
} from "lucide-react";

interface PlatformStats {
  totalUsers: number;
  totalContacts: number;
  totalConversations: number;
  totalMessages: number;
  subscriptionBreakdown: Record<string, number>;
}

interface UserProfile {
  id: string;
  user_id: string;
  business_name: string | null;
  business_type: string | null;
  subscription_tier: string;
  role: string;
  ai_enabled: boolean;
  created_at: string;
}

// cents/month per plan — used to compute MRR on the client
const PLAN_PRICES_CENTS: Record<string, number> = {
  free: 0,
  starter: 2900,
  pro: 9900,
  professional: 9900,
  enterprise: 29900,
};

function calcMrr(breakdown: Record<string, number>): number {
  return Object.entries(breakdown).reduce(
    (sum, [tier, count]) => sum + (PLAN_PRICES_CENTS[tier] ?? 0) * count,
    0
  );
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
      ]);
      if (statsRes.ok) {
        const { data } = await statsRes.json();
        setStats(data);
      }
      if (usersRes.ok) {
        const { data } = await usersRes.json();
        setUsers(data);
      }
    } catch {
      // network errors are silently ignored — dashboard will show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-8 flex items-center gap-3">
          <Shield className="h-8 w-8 text-purple-600" />
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border bg-gray-50" />
          ))}
        </div>
      </div>
    );
  }

  const mrrCents = stats?.subscriptionBreakdown ? calcMrr(stats.subscriptionBreakdown) : 0;

  const statCards = [
    {
      label: "Total Users",
      display: (stats?.totalUsers ?? 0).toLocaleString(),
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
    {
      label: "Total Clients",
      display: (stats?.totalContacts ?? 0).toLocaleString(),
      icon: Contact,
      color: "text-green-600",
      bg: "bg-green-50",
    },
    {
      label: "Conversations",
      display: (stats?.totalConversations ?? 0).toLocaleString(),
      icon: MessageSquare,
      color: "text-purple-600",
      bg: "bg-purple-50",
    },
    {
      label: "Messages",
      display: (stats?.totalMessages ?? 0).toLocaleString(),
      icon: BarChart3,
      color: "text-orange-600",
      bg: "bg-orange-50",
    },
    {
      label: "MRR",
      display: formatCurrency(mrrCents),
      icon: DollarSign,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
    },
    {
      label: "ARR",
      display: formatCurrency(mrrCents * 12),
      icon: TrendingUp,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
    },
  ];

  const tierColors: Record<string, string> = {
    free: "bg-gray-100 text-gray-700",
    starter: "bg-blue-100 text-blue-700",
    pro: "bg-purple-100 text-purple-700",
    professional: "bg-purple-100 text-purple-700",
    enterprise: "bg-amber-100 text-amber-700",
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
          <Shield className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-sm text-gray-500">Platform-wide overview and user management</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  {s.label}
                </p>
                <p className="mt-1 text-2xl font-bold text-gray-900">{s.display}</p>
              </div>
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Admin Navigation Cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/admin/analytics"
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Analytics</p>
              <p className="text-xs text-gray-500">MRR, ARR, churn, DAU/MAU</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </Link>

        <Link
          href="/admin/audit-logs"
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-purple-200 hover:bg-purple-50/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
              <ClipboardList className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Audit Logs</p>
              <p className="text-xs text-gray-500">View all admin activity</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </Link>

        <Link
          href="/admin/support"
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Search className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Support Lookup</p>
              <p className="text-xs text-gray-500">Find users by email or ID</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </Link>

        <Link
          href="/admin/communications"
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Communications</p>
              <p className="text-xs text-gray-500">Email users and send announcements</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </Link>

        <Link
          href="/admin/data"
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <Database className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Data Management</p>
              <p className="text-xs text-gray-500">GDPR export, deletion, bulk ops</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </Link>

        <Link
          href="/admin/health"
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100">
              <Layers className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">System Health</p>
              <p className="text-xs text-gray-500">Integrations, metrics &amp; error logs</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </Link>

        <Link
          href="/admin/accounts"
          className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/30"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100">
              <Building2 className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-900">Accounts</p>
              <p className="text-xs text-gray-500">Manage business accounts &amp; seats</p>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </Link>
      </div>

      {/* Subscription Breakdown */}
      {stats?.subscriptionBreakdown && (
        <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Subscription Breakdown</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            {Object.entries(stats.subscriptionBreakdown).map(([tier, count]) => (
              <div key={tier} className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                    tierColors[tier] ?? "bg-gray-100 text-gray-700"
                  }`}
                >
                  {tier}
                </span>
                <p className="mt-2 text-2xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">users</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">All Users</h2>
          <p className="text-sm text-gray-500">{users.length} registered users</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Business
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  AI
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Joined
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {user.role === "super_admin" && (
                        <Crown className="h-4 w-4 text-amber-500" />
                      )}
                      <span className="font-medium text-gray-900">
                        {user.business_name ?? "Unnamed Business"}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {user.business_type ?? "—"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                        tierColors[user.subscription_tier] ?? "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.subscription_tier}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        user.role === "super_admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {user.role === "super_admin" ? "Super Admin" : "User"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        user.ai_enabled ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
