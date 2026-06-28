"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Building2, ChevronRight, Users, Contact, CalendarDays } from "lucide-react";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";

interface Account {
  id: string;
  profile_id: string;
  email: string;
  business_name: string | null;
  business_type: string | null;
  subscription_tier: string;
  is_active: boolean;
  created_at: string;
  last_sign_in_at: string | null;
  member_count: number;
  contact_count: number;
  booking_count: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const PLAN_OPTIONS = [
  { value: "", label: "All Plans" },
  { value: "free", label: "Free" },
  { value: "starter", label: "Starter" },
  { value: "pro", label: "Pro" },
  { value: "enterprise", label: "Enterprise" },
];

const PLAN_BADGE_COLORS: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  starter: "bg-blue-100 text-blue-700",
  pro: "bg-purple-100 text-purple-700",
  professional: "bg-purple-100 text-purple-700",
  enterprise: "bg-amber-100 text-amber-700",
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

function StatusBadge({ active }: { active: boolean }) {
  return (
    <Badge variant={active ? "success" : "danger"} size="sm">
      {active ? "Active" : "Inactive"}
    </Badge>
  );
}

function TableRowSkeleton() {
  return (
    <tr className="border-b border-gray-100">
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("");
  const [page, setPage] = useState(1);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (plan) params.set("plan", plan);
    params.set("page", String(page));
    params.set("limit", "20");

    const res = await fetch(`/api/admin/accounts?${params.toString()}`);
    if (res.ok) {
      const { data, pagination: pg } = await res.json();
      setAccounts(data ?? []);
      setPagination(pg ?? null);
    }
    setLoading(false);
  }, [search, plan, page]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Reset to page 1 when filters change
  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handlePlanChange = (value: string) => {
    setPlan(value);
    setPage(1);
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-600 to-blue-600">
          <Building2 className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Account Management</h1>
          <p className="text-sm text-gray-500">
            {pagination ? `${pagination.total} business accounts` : "Business accounts"}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search by business name or email..."
          className="sm:max-w-xs"
        />
        <select
          value={plan}
          onChange={(e) => handlePlanChange(e.target.value)}
          className="block rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:w-40"
        >
          {PLAN_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Business Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Plan
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <span className="flex items-center justify-center gap-1">
                    <Users className="h-3.5 w-3.5" /> Members
                  </span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <span className="flex items-center justify-center gap-1">
                    <Contact className="h-3.5 w-3.5" /> Contacts
                  </span>
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <span className="flex items-center justify-center gap-1">
                    <CalendarDays className="h-3.5 w-3.5" /> Bookings
                  </span>
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Joined
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Status
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading
                ? Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} />)
                : accounts.length === 0
                ? (
                  <tr>
                    <td colSpan={9} className="px-4 py-12 text-center text-sm text-gray-400">
                      No accounts found
                    </td>
                  </tr>
                )
                : accounts.map((account) => (
                  <tr
                    key={account.id}
                    className="transition-colors hover:bg-gray-50/50"
                  >
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900">
                        {account.business_name ?? "Unnamed Business"}
                      </span>
                      {account.business_type && (
                        <p className="text-xs text-gray-400">{account.business_type}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {account.email || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <PlanBadge tier={account.subscription_tier} />
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700">
                      {account.member_count}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700">
                      {account.contact_count}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-700">
                      {account.booking_count}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(account.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge active={account.is_active} />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        href={`/admin/accounts/${account.id}` as any}
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        View
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="border-t border-gray-100 px-4 py-3">
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              onPageChange={setPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
