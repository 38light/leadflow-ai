"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchInput } from "@/components/ui/search-input";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Brain, X } from "lucide-react";
import { LEAD_STATUSES, TEMPERATURES } from "@/constants/app";
import type { Contact } from "@/types";

interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  ...LEAD_STATUSES.map((s) => ({ value: s.value, label: s.label })),
];

const TEMP_OPTIONS = [
  { value: "", label: "All Temps" },
  ...TEMPERATURES.map((t) => ({ value: t.value, label: t.label })),
];

/** Statuses that make a deal eligible for AI diagnosis */
const DIAGNOSABLE_STATUSES = new Set([
  "contacted",
  "qualified",
  "proposal",
  "negotiation",
]);

interface DiagnosisResult {
  diagnosis: string;
  daysInStage: number;
  lastContactDays: number;
}

function ScorePill({ score }: { score: number }) {
  const clampedScore = Math.min(100, Math.max(0, score));
  const barColor =
    clampedScore >= 67
      ? "bg-green-500"
      : clampedScore >= 34
      ? "bg-amber-500"
      : "bg-red-500";

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 rounded-full bg-gray-200">
        <div
          style={{ width: `${clampedScore}%` }}
          className={`h-full rounded-full ${barColor}`}
        />
      </div>
      <span className="text-xs text-gray-500">{clampedScore}</span>
    </div>
  );
}

export function ContactsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [status, setStatus] = useState(searchParams.get("status") ?? "");
  const [temperature, setTemperature] = useState(
    searchParams.get("temperature") ?? ""
  );
  const [page, setPage] = useState(
    Number(searchParams.get("page") ?? "1")
  );

  // AI Diagnosis state
  const [diagnosisContactId, setDiagnosisContactId] = useState<string | null>(
    null
  );
  const [diagnosisResult, setDiagnosisResult] =
    useState<DiagnosisResult | null>(null);
  const [diagnosisLoading, setDiagnosisLoading] = useState(false);
  const [diagnosisError, setDiagnosisError] = useState<string | null>(null);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      if (temperature) params.set("temperature", temperature);
      params.set("page", String(page));
      params.set("limit", "25");

      const res = await fetch(`/api/contacts?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const json = await res.json();
      setContacts(json.data ?? []);
      setPagination(json.pagination);
    } catch {
      setContacts([]);
    } finally {
      setLoading(false);
    }
  }, [search, status, temperature, page]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // Sync state to URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (temperature) params.set("temperature", temperature);
    if (page > 1) params.set("page", String(page));
    const qs = params.toString();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace(`/contacts${qs ? `?${qs}` : ""}` as any, { scroll: false });
  }, [search, status, temperature, page, router]);

  function handleSearch(val: string) {
    setSearch(val);
    setPage(1);
  }

  function handleStatus(val: string) {
    setStatus(val);
    setPage(1);
  }

  function handleTemperature(val: string) {
    setTemperature(val);
    setPage(1);
  }

  async function handleDiagnose(contactId: string) {
    setDiagnosisContactId(contactId);
    setDiagnosisResult(null);
    setDiagnosisError(null);
    setDiagnosisLoading(true);

    try {
      const res = await fetch("/api/ai/deal-diagnosis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setDiagnosisError(json.error ?? "Failed to diagnose deal");
        return;
      }
      setDiagnosisResult(json.data);
    } catch {
      setDiagnosisError("Something went wrong");
    } finally {
      setDiagnosisLoading(false);
    }
  }

  function closeDiagnosis() {
    setDiagnosisContactId(null);
    setDiagnosisResult(null);
    setDiagnosisError(null);
    setDiagnosisLoading(false);
  }

  const diagnosedContact = diagnosisContactId
    ? contacts.find((c) => c.id === diagnosisContactId)
    : null;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-sm text-gray-500">
            {pagination.total} total contact{pagination.total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 mb-4">
        <SearchInput
          value={search}
          onChange={handleSearch}
          placeholder="Search by name, email or company..."
          className="w-full sm:w-72"
        />
        <Select
          options={STATUS_OPTIONS}
          value={status}
          onChange={(e) => handleStatus(e.target.value)}
          className="w-full sm:w-44"
        />
        <Select
          options={TEMP_OPTIONS}
          value={temperature}
          onChange={(e) => handleTemperature(e.target.value)}
          className="w-full sm:w-36"
        />
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Source
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Temp
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Created
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  AI
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-32" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-40" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-5 w-12 rounded-full" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-4 py-3">
                        <Skeleton className="h-6 w-6 rounded" />
                      </td>
                    </tr>
                  ))
                : contacts.map((contact) => {
                    const statusConfig = LEAD_STATUSES.find(
                      (s) => s.value === contact.status
                    );
                    const tempConfig = TEMPERATURES.find(
                      (t) => t.value === contact.temperature
                    );
                    const canDiagnose = DIAGNOSABLE_STATUSES.has(
                      contact.status
                    );
                    return (
                      <tr
                        key={contact.id}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-4 py-3 text-sm font-medium">
                          <Link
                            href={`/contacts/${contact.id}`}
                            className="hover:text-blue-600 hover:underline"
                          >
                            {contact.name ?? "—"}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {contact.email ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {contact.source_channel ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              statusConfig?.color ?? "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {statusConfig?.label ?? contact.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${
                              tempConfig?.color ?? "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {tempConfig?.label ?? contact.temperature}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <ScorePill score={contact.score ?? 0} />
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {new Date(contact.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3">
                          {canDiagnose && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDiagnose(contact.id);
                              }}
                              title="AI Deal Diagnosis"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 border border-gray-300 rounded hover:bg-gray-100 hover:text-blue-600 hover:border-blue-400 transition-colors"
                            >
                              <Brain className="h-3.5 w-3.5" />
                              <span>Diagnose</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        {!loading && contacts.length === 0 && (
          <EmptyState
            icon={<Users className="h-10 w-10" />}
            title="No contacts found"
            description={
              search || status || temperature
                ? "Try adjusting your filters."
                : "Contacts will appear here as leads come in."
            }
          />
        )}
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-4">
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* AI Diagnosis Slide-over Panel */}
      {diagnosisContactId && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={closeDiagnosis}
          />

          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-xl flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b px-6 py-4 shrink-0">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  AI Deal Diagnosis
                </h2>
              </div>
              <button
                type="button"
                onClick={closeDiagnosis}
                className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                aria-label="Close panel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contact name */}
            {diagnosedContact && (
              <div className="px-6 py-3 bg-gray-50 border-b shrink-0">
                <p className="text-sm text-gray-500">Analyzing</p>
                <p className="font-medium text-gray-900">
                  {diagnosedContact.name ?? "Unknown Contact"}
                </p>
                <p className="text-xs text-gray-500 capitalize mt-0.5">
                  Status: {diagnosedContact.status}
                </p>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {diagnosisLoading && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <svg
                      className="animate-spin h-4 w-4 text-blue-500"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    <span>Analyzing deal signals...</span>
                  </div>
                  <div className="space-y-2 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-5/6" />
                    <div className="h-4 bg-gray-200 rounded w-2/3 mt-4" />
                    <div className="h-4 bg-gray-200 rounded w-full" />
                    <div className="h-4 bg-gray-200 rounded w-4/5" />
                  </div>
                </div>
              )}

              {diagnosisError && !diagnosisLoading && (
                <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                  {diagnosisError}
                </div>
              )}

              {diagnosisResult && !diagnosisLoading && (
                <div className="space-y-4">
                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-center">
                      <p className="text-2xl font-bold text-blue-700">
                        {diagnosisResult.daysInStage >= 0
                          ? diagnosisResult.daysInStage
                          : "—"}
                      </p>
                      <p className="text-xs text-blue-600 mt-0.5">Days in stage</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-center">
                      <p className="text-2xl font-bold text-amber-700">
                        {diagnosisResult.lastContactDays >= 0
                          ? diagnosisResult.lastContactDays
                          : "—"}
                      </p>
                      <p className="text-xs text-amber-600 mt-0.5">Days since contact</p>
                    </div>
                  </div>

                  {/* Diagnosis text */}
                  <div className="rounded-lg border border-gray-200 bg-white p-4">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {diagnosisResult.diagnosis}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
