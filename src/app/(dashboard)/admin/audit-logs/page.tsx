"use client";

import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { Badge } from "@/components/ui/badge";
import { Pagination } from "@/components/ui/pagination";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_email: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  target_label: string | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─── Action badge helpers ─────────────────────────────────────────────────────

type ActionCategory = "user" | "impersonate" | "billing" | "flag" | "system" | "other";

function getActionCategory(action: string): ActionCategory {
  if (action.startsWith("user.")) return "user";
  if (action.startsWith("impersonate.")) return "impersonate";
  if (action.startsWith("billing.") || action.startsWith("refund.")) return "billing";
  if (action.startsWith("flag.")) return "flag";
  if (action.startsWith("system.")) return "system";
  return "other";
}

const categoryStyles: Record<ActionCategory, string> = {
  user: "bg-blue-100 text-blue-800",
  impersonate: "bg-purple-100 text-purple-800",
  billing: "bg-orange-100 text-orange-800",
  flag: "bg-green-100 text-green-800",
  system: "bg-gray-100 text-gray-700",
  other: "bg-gray-100 text-gray-700",
};

function ActionBadge({ action }: { action: string }) {
  const category = getActionCategory(action);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryStyles[category]}`}
    >
      {action}
    </span>
  );
}

// ─── Metadata summary helper ──────────────────────────────────────────────────

function MetadataSummary({ metadata }: { metadata: Record<string, unknown> }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return <span className="text-gray-400">—</span>;
  }

  const entries = Object.entries(metadata).slice(0, 3);
  return (
    <span className="text-xs text-gray-600">
      {entries.map(([k, v]) => `${k}: ${String(v)}`).join(", ")}
      {Object.keys(metadata).length > 3 && " …"}
    </span>
  );
}

// ─── Filter params type ───────────────────────────────────────────────────────

interface FilterParams {
  search: string;
  actionCategory: string;
  dateFrom: string;
  dateTo: string;
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const ACTION_CATEGORY_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "user", label: "User Actions" },
  { value: "impersonate", label: "Impersonation" },
  { value: "billing", label: "Billing" },
  { value: "flag", label: "Feature Flags" },
  { value: "system", label: "System" },
];

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<FilterParams>({
    search: "",
    actionCategory: "",
    dateFrom: "",
    dateTo: "",
  });
  const [currentPage, setCurrentPage] = useState(1);

  const buildQueryString = useCallback(
    (page: number, f: FilterParams) => {
      const params = new URLSearchParams();
      if (f.search) params.set("search", f.search);
      if (f.actionCategory) params.set("action", f.actionCategory);
      if (f.dateFrom) params.set("date_from", f.dateFrom);
      if (f.dateTo) params.set("date_to", f.dateTo);
      params.set("page", String(page));
      params.set("limit", "20");
      return params.toString();
    },
    []
  );

  const fetchLogs = useCallback(
    async (page: number, f: FilterParams) => {
      setLoading(true);
      setError(null);
      try {
        const qs = buildQueryString(page, f);
        const res = await fetch(`/api/admin/audit-logs?${qs}`);
        if (!res.ok) {
          const body = await res.json();
          setError(body.error ?? "Failed to load audit logs");
          return;
        }
        const body = await res.json();
        setLogs(body.data ?? []);
        setPagination(body.pagination);
      } catch {
        setError("Network error — could not load audit logs");
      } finally {
        setLoading(false);
      }
    },
    [buildQueryString]
  );

  useEffect(() => {
    fetchLogs(currentPage, filters);
  }, [currentPage, filters, fetchLogs]);

  function handleFilterChange(partial: Partial<FilterParams>) {
    setCurrentPage(1);
    setFilters((prev) => ({ ...prev, ...partial }));
  }

  async function handleExportCSV() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.actionCategory) params.set("action", filters.actionCategory);
      if (filters.dateFrom) params.set("date_from", filters.dateFrom);
      if (filters.dateTo) params.set("date_to", filters.dateTo);

      const res = await fetch(`/api/admin/audit-logs/export?${params.toString()}`);
      if (!res.ok) {
        setError("Export failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 to-blue-600">
            <ClipboardList className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-sm text-gray-500">
              Platform-wide activity log for all admin actions
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCSV}
          loading={exporting}
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <SearchInput
          value={filters.search}
          onChange={(v) => handleFilterChange({ search: v })}
          placeholder="Search action, actor, target…"
          className="w-64"
        />

        <select
          value={filters.actionCategory}
          onChange={(e) => handleFilterChange({ actionCategory: e.target.value })}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {ACTION_CATEGORY_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">From</label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange({ dateFrom: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">To</label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange({ dateTo: e.target.value })}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {(filters.search || filters.actionCategory || filters.dateFrom || filters.dateTo) && (
          <button
            onClick={() =>
              handleFilterChange({
                search: "",
                actionCategory: "",
                dateFrom: "",
                dateTo: "",
              })
            }
            className="text-sm text-gray-500 underline hover:text-gray-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-gray-200 bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Timestamp
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Actor
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Action
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Target
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-36" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-40" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-5 w-28 rounded-full" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="px-4 py-3">
                      <Skeleton className="h-4 w-48" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <ClipboardList className="h-10 w-10 text-gray-300" />
                      <p className="text-sm font-medium text-gray-500">No audit logs found</p>
                      {(filters.search || filters.actionCategory || filters.dateFrom || filters.dateTo) && (
                        <p className="text-xs text-gray-400">
                          Try adjusting your filters
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="transition-colors hover:bg-gray-50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {log.actor_email ? (
                        <span className="text-sm text-gray-700">{log.actor_email}</span>
                      ) : (
                        <Badge variant="secondary" size="sm">
                          system
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ActionBadge action={log.action} />
                    </td>
                    <td className="px-4 py-3">
                      {log.target_label || log.target_id ? (
                        <div className="flex flex-col">
                          {log.target_label && (
                            <span className="text-sm text-gray-700">{log.target_label}</span>
                          )}
                          {log.target_type && (
                            <span className="text-xs text-gray-400">{log.target_type}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <MetadataSummary metadata={log.metadata ?? {}} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer with count + pagination */}
        {!loading && logs.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3">
            <p className="text-xs text-gray-500">
              Showing {(pagination.page - 1) * pagination.limit + 1}–
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
              {pagination.total.toLocaleString()} events
            </p>
            <Pagination
              currentPage={currentPage}
              totalPages={pagination.totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
}
