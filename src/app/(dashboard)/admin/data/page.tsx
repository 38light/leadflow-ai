"use client";

import { useState, useRef, useCallback } from "react";
import {
  Download,
  Trash2,
  Users,
  Database,
  Archive,
  ArrowRightLeft,
  FileDown,
  Terminal,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";

interface UserResult {
  id: string;
  user_id: string;
  business_name: string | null;
  subscription_tier: string;
  created_at: string;
  // email comes from a separate lookup
  email?: string;
}

interface SelectedUser {
  id: string; // user_id (auth UUID)
  email: string;
  business_name: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// UserSearch — debounced search returning user results
// ---------------------------------------------------------------------------
function UserSearch({
  label,
  placeholder,
  onSelect,
  selected,
}: {
  label: string;
  placeholder?: string;
  onSelect: (user: SelectedUser) => void;
  selected: SelectedUser | null;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users?search=${encodeURIComponent(q)}&limit=10`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? "Search failed");
      }
      const { data } = await res.json();
      setResults(data ?? []);
      setOpen(true);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  }

  function handleSelect(user: UserResult) {
    const su: SelectedUser = {
      id: user.user_id,
      email: user.email ?? `(no email) ${user.user_id}`,
      business_name: user.business_name,
      created_at: user.created_at,
    };
    onSelect(su);
    setQuery(su.email);
    setOpen(false);
  }

  return (
    <div className="relative">
      <Input
        label={label}
        placeholder={placeholder ?? "Search by email or business name…"}
        value={selected ? (selected.email ?? query) : query}
        onChange={handleChange}
        onFocus={() => results.length > 0 && setOpen(true)}
      />
      {loading && (
        <p className="mt-1 text-xs text-gray-400">Searching…</p>
      )}
      {open && results.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {results.map((u) => (
            <li key={u.user_id}>
              <button
                type="button"
                className="flex w-full flex-col px-4 py-2.5 text-left hover:bg-gray-50"
                onClick={() => handleSelect(u)}
              >
                <span className="text-sm font-medium text-gray-900">
                  {u.email ?? u.business_name ?? u.user_id}
                </span>
                <span className="text-xs text-gray-500">
                  {u.business_name ?? "No business name"} · {u.subscription_tier}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section 1: GDPR Data Export
// ---------------------------------------------------------------------------
function GdprSection() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<SelectedUser | null>(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  async function handleExport() {
    if (!selected) return;
    setExportLoading(true);
    try {
      const res = await fetch(`/api/admin/data/export?user_id=${selected.id}`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: "Export failed" }));
        toast(json.error ?? "Export failed", "error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? `user-export-${selected.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Export downloaded successfully", "success");
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDelete() {
    if (!selected || confirmEmail !== selected.email) return;
    setDeleteLoading(true);
    try {
      const res = await fetch("/api/admin/data/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: selected.id, confirm: true }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "Deletion failed", "error");
        return;
      }
      const counts = Object.entries(json.deleted as Record<string, number>)
        .map(([k, v]) => `${v} ${k}`)
        .join(", ");
      toast(`Deleted: ${counts}`, "success");
      setDeleteModalOpen(false);
      setSelected(null);
      setConfirmEmail("");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
          <Database className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">GDPR Data Export</h2>
          <p className="text-sm text-gray-500">Export or permanently delete all data for a user</p>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <UserSearch
          label="Select User"
          onSelect={(u) => setSelected(u)}
          selected={selected}
        />

        {selected && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
            <p className="font-medium text-gray-900">{selected.email}</p>
            <p className="text-gray-500">
              {selected.business_name ?? "No business name"} · Joined{" "}
              {new Date(selected.created_at).toLocaleDateString()}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleExport}
            loading={exportLoading}
            disabled={!selected || exportLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export All Data (JSON)
          </Button>

          <Button
            variant="danger"
            onClick={() => setDeleteModalOpen(true)}
            disabled={!selected}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete All Data (GDPR)
          </Button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setConfirmEmail("");
        }}
        title="Permanently Delete All User Data"
        size="md"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-lg bg-red-50 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
            <div className="text-sm text-red-800">
              <p className="font-semibold">This action is irreversible.</p>
              <p className="mt-1">
                All contacts, conversations, messages, bookings, knowledge bases, and the user
                account will be permanently deleted. This cannot be undone.
              </p>
            </div>
          </div>

          {selected && (
            <Input
              label={`Type "${selected.email}" to confirm`}
              placeholder={selected.email}
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
            />
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setConfirmEmail("");
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleteLoading}
              disabled={!selected || confirmEmail !== selected?.email || deleteLoading}
            >
              Permanently Delete All Data
            </Button>
          </div>
        </div>
      </Modal>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section 2: Bulk Operations
// ---------------------------------------------------------------------------
function BulkOperationsSection() {
  const { toast } = useToast();
  const [selected, setSelected] = useState<SelectedUser | null>(null);
  const [targetUser, setTargetUser] = useState<SelectedUser | null>(null);
  const [showReassign, setShowReassign] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  async function handleExportContacts() {
    if (!selected) return;
    setLoading("export_contacts");
    try {
      const res = await fetch("/api/admin/data/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "export_contacts", user_id: selected.id }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: "Export failed" }));
        toast(json.error ?? "Export failed", "error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const cd = res.headers.get("Content-Disposition") ?? "";
      const match = cd.match(/filename="([^"]+)"/);
      a.download = match?.[1] ?? `contacts-${selected.id}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast("Contacts CSV downloaded", "success");
    } finally {
      setLoading(null);
    }
  }

  async function handleArchiveContacts() {
    if (!selected) return;
    setLoading("archive_contacts");
    try {
      const res = await fetch("/api/admin/data/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "archive_contacts", user_id: selected.id }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "Archive failed", "error");
        return;
      }
      toast(`${json.archived ?? 0} contacts archived`, "success");
    } finally {
      setLoading(null);
    }
  }

  async function handleReassignContacts() {
    if (!selected || !targetUser) return;
    setLoading("reassign_contacts");
    try {
      const res = await fetch("/api/admin/data/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "reassign_contacts",
          user_id: selected.id,
          target_user_id: targetUser.id,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "Reassign failed", "error");
        return;
      }
      toast(`${json.reassigned ?? 0} contacts reassigned to ${targetUser.email}`, "success");
      setShowReassign(false);
      setTargetUser(null);
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
          <Users className="h-5 w-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Bulk Operations</h2>
          <p className="text-sm text-gray-500">Perform bulk actions on a user&apos;s contacts</p>
        </div>
      </div>

      <div className="max-w-md space-y-4">
        <UserSearch
          label="Select User"
          onSelect={(u) => {
            setSelected(u);
            setShowReassign(false);
            setTargetUser(null);
          }}
          selected={selected}
        />

        {selected && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-sm">
            <p className="font-medium text-gray-900">{selected.email}</p>
            <p className="text-gray-500">{selected.business_name ?? "No business name"}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={handleExportContacts}
            loading={loading === "export_contacts"}
            disabled={!selected || !!loading}
          >
            <FileDown className="mr-2 h-4 w-4" />
            Export Contacts as CSV
          </Button>

          <Button
            variant="secondary"
            onClick={handleArchiveContacts}
            loading={loading === "archive_contacts"}
            disabled={!selected || !!loading}
          >
            <Archive className="mr-2 h-4 w-4" />
            Archive All Contacts
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowReassign(!showReassign)}
            disabled={!selected || !!loading}
          >
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Reassign Contacts
          </Button>
        </div>

        {showReassign && selected && (
          <div className="space-y-3 rounded-lg border border-blue-100 bg-blue-50/40 p-4">
            <p className="text-sm font-medium text-gray-700">
              Move all contacts from <strong>{selected.email}</strong> to:
            </p>
            <UserSearch
              label="Target User"
              placeholder="Search for target user…"
              onSelect={(u) => setTargetUser(u)}
              selected={targetUser}
            />
            {targetUser && (
              <div className="rounded-lg border border-gray-100 bg-white p-2.5 text-xs text-gray-600">
                Target: <strong>{targetUser.email}</strong>{" "}
                {targetUser.business_name ? `(${targetUser.business_name})` : ""}
              </div>
            )}
            <Button
              variant="primary"
              onClick={handleReassignContacts}
              loading={loading === "reassign_contacts"}
              disabled={!targetUser || !!loading}
            >
              Reassign Contacts
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Section 3: Demo Account Seeding
// ---------------------------------------------------------------------------
function SeedingSection() {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
          <Terminal className="h-5 w-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Demo Account Seeding</h2>
          <p className="text-sm text-gray-500">Populate a user account with demo data for testing</p>
        </div>
      </div>

      <div className="max-w-lg rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6">
        <div className="flex items-start gap-3">
          <Terminal className="mt-0.5 h-5 w-5 shrink-0 text-gray-400" />
          <div>
            <p className="text-sm font-medium text-gray-700">
              No seed API endpoint found
            </p>
            <p className="mt-1 text-sm text-gray-500">
              To seed demo data for a user account, run the following command from the project root:
            </p>
            <pre className="mt-3 rounded-md bg-gray-900 px-4 py-3 text-xs font-mono text-green-400 overflow-x-auto">
              npx tsx scripts/seed.ts
            </pre>
            <p className="mt-3 text-xs text-gray-400">
              This will populate the database with sample contacts, conversations, messages,
              bookings, and knowledge base entries.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
export default function AdminDataPage() {
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
          <Database className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>
          <p className="text-sm text-gray-500">GDPR compliance, bulk operations, and demo seeding</p>
        </div>
      </div>

      <div className="space-y-6">
        <GdprSection />
        <BulkOperationsSection />
        <SeedingSection />
      </div>
    </div>
  );
}
