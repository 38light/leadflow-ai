"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Shield, User, Clock, Tag } from "lucide-react";
import { useToast } from "@/components/ui/toast";

interface UserResult {
  id: string;
  user_id: string;
  business_name: string | null;
  business_type: string | null;
  subscription_tier: string;
  role: string;
  is_active: boolean;
  ai_enabled: boolean;
  created_at: string;
  updated_at: string;
}

const TAG_COLORS: Record<string, string> = {
  enterprise: "bg-yellow-100 text-yellow-800",
  vip: "bg-purple-100 text-purple-800",
  "at-risk": "bg-red-100 text-red-800",
  churned: "bg-gray-100 text-gray-700",
  "beta-user": "bg-blue-100 text-blue-800",
  partner: "bg-green-100 text-green-800",
};

const tierColors: Record<string, string> = {
  free: "bg-gray-100 text-gray-700",
  starter: "bg-blue-100 text-blue-700",
  pro: "bg-purple-100 text-purple-700",
  professional: "bg-purple-100 text-purple-700",
  enterprise: "bg-amber-100 text-amber-700",
};

function formatLastActive(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function SupportLookupPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(
    async (q: string) => {
      if (!q.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setLoading(true);
      setHasSearched(true);
      try {
        const res = await fetch(
          `/api/admin/users?search=${encodeURIComponent(q.trim())}&limit=20`
        );
        if (!res.ok) throw new Error("Search failed");
        const { data } = await res.json();
        setResults(data ?? []);
      } catch {
        toast("Search failed", "error");
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      search(query);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, search]);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
          <Search className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Lookup</h1>
          <p className="text-sm text-gray-500">Find any user by email, name, or user ID</p>
        </div>
      </div>

      {/* Search Box */}
      <div className="mb-8 relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email, business name, or user ID…"
          className="block w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-4 text-sm text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          autoFocus
        />
        {loading && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
          </div>
        )}
      </div>

      {/* Results */}
      {!hasSearched && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
            <Shield className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500">Enter a search query to find users</p>
          <p className="text-xs text-gray-400 mt-1">Searches business name and email</p>
        </div>
      )}

      {hasSearched && !loading && results.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
            <User className="h-8 w-8 text-gray-400" />
          </div>
          <p className="text-gray-500">No users found for &ldquo;{query}&rdquo;</p>
          <p className="text-xs text-gray-400 mt-1">Try searching by email or user ID</p>
        </div>
      )}

      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {results.map((user) => (
              <button
                key={user.id}
                onClick={() => router.push(`/admin/users/${user.user_id}`)}
                className="flex flex-col items-start gap-3 rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                {/* Top row */}
                <div className="flex w-full items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white text-sm font-semibold">
                      {user.business_name
                        ? user.business_name[0].toUpperCase()
                        : "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-gray-900 text-sm">
                        {user.business_name ?? "No Business Name"}
                      </p>
                      {user.role === "super_admin" && (
                        <p className="text-xs text-purple-600 font-medium">Super Admin</p>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${tierColors[user.subscription_tier] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {user.subscription_tier}
                  </span>
                </div>

                {/* Status & last active */}
                <div className="flex w-full items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${user.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${user.is_active ? "bg-green-500" : "bg-red-500"}`}
                    />
                    {user.is_active ? "Active" : "Suspended"}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-gray-400">
                    <Clock className="h-3 w-3" />
                    {formatLastActive(user.updated_at)}
                  </div>
                </div>

                {/* Business type */}
                {user.business_type && (
                  <div className="flex items-center gap-1.5">
                    <Tag className="h-3 w-3 text-gray-400" />
                    <span className="text-xs text-gray-500">{user.business_type}</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tag color legend */}
      {hasSearched && results.length > 0 && (
        <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-4">
          <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tag Legend</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(TAG_COLORS).map(([tag, colors]) => (
              <span
                key={tag}
                className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors}`}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
