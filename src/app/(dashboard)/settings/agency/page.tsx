"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// ── Types ──────────────────────────────────────────────────────────────────────

interface SubAccount {
  id: string;
  business_name: string;
  contact_name: string | null;
  contact_email: string | null;
  branding_color: string;
  status: "active" | "suspended" | "cancelled";
  plan: "starter" | "pro" | "enterprise";
  monthly_fee_cents: number;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const STATUS_STYLES: Record<SubAccount["status"], string> = {
  active: "bg-green-50 text-green-700",
  suspended: "bg-amber-50 text-amber-700",
  cancelled: "bg-red-50 text-red-700",
};

const PLAN_LABELS: Record<SubAccount["plan"], string> = {
  starter: "Starter",
  pro: "Pro",
  enterprise: "Enterprise",
};

// ── Page ───────────────────────────────────────────────────────────────────────

export default function AgencyPage() {
  const [accounts, setAccounts] = useState<SubAccount[]>([]);
  const [loading, setLoading] = useState(true);

  // Add client modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [formBusinessName, setFormBusinessName] = useState("");
  const [formContactName, setFormContactName] = useState("");
  const [formContactEmail, setFormContactEmail] = useState("");
  const [formPlan, setFormPlan] = useState<SubAccount["plan"]>("starter");
  const [formMonthlyFee, setFormMonthlyFee] = useState("");
  const [formBrandColor, setFormBrandColor] = useState("#4f46e5");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  // Edit modal
  const [editTarget, setEditTarget] = useState<SubAccount | null>(null);
  const [editStatus, setEditStatus] = useState<SubAccount["status"]>("active");
  const [editPlan, setEditPlan] = useState<SubAccount["plan"]>("starter");
  const [editMonthlyFee, setEditMonthlyFee] = useState("");
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<SubAccount | null>(null);
  const [deleting, setDeleting] = useState(false);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agency/sub-accounts");
      if (res.ok) {
        const json = await res.json();
        setAccounts(json.data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // ── Stats ─────────────────────────────────────────────────────────────────

  const totalClients = accounts.length;
  const activeClients = accounts.filter((a) => a.status === "active").length;
  const monthlyRevenue = accounts
    .filter((a) => a.status === "active")
    .reduce((sum, a) => sum + a.monthly_fee_cents, 0);

  // ── Create ────────────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!formBusinessName.trim()) {
      setFormError("Business name is required.");
      return;
    }

    const monthly_fee_cents = Math.round(parseFloat(formMonthlyFee || "0") * 100);
    if (isNaN(monthly_fee_cents) || monthly_fee_cents < 0) {
      setFormError("Monthly fee must be a valid non-negative number.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/agency/sub-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: formBusinessName.trim(),
          contact_name: formContactName.trim() || undefined,
          contact_email: formContactEmail.trim() || undefined,
          branding_color: formBrandColor,
          plan: formPlan,
          monthly_fee_cents,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? "Failed to create client.");
        return;
      }
      setShowAddModal(false);
      resetAddForm();
      await fetchAccounts();
    } catch {
      setFormError("An unexpected error occurred.");
    } finally {
      setCreating(false);
    }
  }

  function resetAddForm() {
    setFormBusinessName("");
    setFormContactName("");
    setFormContactEmail("");
    setFormPlan("starter");
    setFormMonthlyFee("");
    setFormBrandColor("#4f46e5");
    setFormError("");
  }

  // ── Edit ──────────────────────────────────────────────────────────────────

  function openEdit(account: SubAccount) {
    setEditTarget(account);
    setEditStatus(account.status);
    setEditPlan(account.plan);
    setEditMonthlyFee((account.monthly_fee_cents / 100).toFixed(2));
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;

    const monthly_fee_cents = Math.round(parseFloat(editMonthlyFee || "0") * 100);
    if (isNaN(monthly_fee_cents) || monthly_fee_cents < 0) return;

    setSaving(true);
    try {
      await fetch(`/api/agency/sub-accounts/${editTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: editStatus, plan: editPlan, monthly_fee_cents }),
      });
      setEditTarget(null);
      await fetchAccounts();
    } catch {
      // silently fail
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/agency/sub-accounts/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await fetchAccounts();
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Agency &amp; White-Label</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage client sub-accounts under your LeadFlow AI agency plan
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="self-start sm:self-auto">
          Add Client
        </Button>
      </div>

      {/* Info box */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <strong>Agency mode:</strong> With agency mode, you can create white-labeled LeadFlow AI instances for your clients. Each sub-account gets its own AI inbox, branding, and contacts.
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Total Clients</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{totalClients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Active</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{activeClients}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-gray-500">Monthly Revenue</p>
            <p className="text-3xl font-bold text-gray-900 mt-1">{formatMoney(monthlyRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Sub-accounts table */}
      <Card>
        <CardHeader>
          <CardTitle>Client Accounts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-gray-400">Loading clients...</div>
          ) : accounts.length === 0 ? (
            <div className="p-6 text-sm text-gray-400">
              No client accounts yet. Add your first client to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-6 py-3 font-medium text-gray-500">Business</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Contact</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Plan</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Monthly Fee</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Created</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {accounts.map((account) => (
                    <tr key={account.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: account.branding_color }}
                            title={account.branding_color}
                          />
                          <span className="font-medium text-gray-900">{account.business_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        <div>{account.contact_name ?? <span className="text-gray-300">—</span>}</div>
                        {account.contact_email && (
                          <div className="text-xs text-gray-400">{account.contact_email}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-600">{PLAN_LABELS[account.plan]}</td>
                      <td className="px-6 py-4 text-gray-600">{formatMoney(account.monthly_fee_cents)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[account.status]}`}
                        >
                          {account.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(account.created_at)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEdit(account)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteTarget(account)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Client modal */}
      <Modal
        open={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          resetAddForm();
        }}
        title="Add Client Account"
        size="lg"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Business Name *"
            id="business-name"
            placeholder="Acme Corp"
            value={formBusinessName}
            onChange={(e) => setFormBusinessName(e.target.value)}
            autoFocus
          />
          <Input
            label="Contact Name"
            id="contact-name"
            placeholder="Jane Smith"
            value={formContactName}
            onChange={(e) => setFormContactName(e.target.value)}
          />
          <Input
            label="Contact Email"
            id="contact-email"
            type="email"
            placeholder="jane@acme.com"
            value={formContactEmail}
            onChange={(e) => setFormContactEmail(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="plan-select" className="block text-sm font-medium text-gray-700">
                Plan
              </label>
              <select
                id="plan-select"
                value={formPlan}
                onChange={(e) => setFormPlan(e.target.value as SubAccount["plan"])}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="starter">Starter</option>
                <option value="pro">Pro</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>
            <Input
              label="Monthly Fee ($)"
              id="monthly-fee"
              type="number"
              min="0"
              step="0.01"
              placeholder="0.00"
              value={formMonthlyFee}
              onChange={(e) => setFormMonthlyFee(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="brand-color" className="block text-sm font-medium text-gray-700">
              Brand Color
            </label>
            <div className="flex items-center gap-3">
              <input
                id="brand-color"
                type="color"
                value={formBrandColor}
                onChange={(e) => setFormBrandColor(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded border border-gray-300 p-1"
              />
              <span className="text-sm text-gray-500">{formBrandColor}</span>
            </div>
          </div>
          {formError && <p className="text-sm text-red-600">{formError}</p>}
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={creating}>
              Add Client
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowAddModal(false);
                resetAddForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editTarget}
        onClose={() => setEditTarget(null)}
        title={`Edit — ${editTarget?.business_name ?? ""}`}
        size="md"
      >
        <form onSubmit={handleEdit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              id="edit-status"
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value as SubAccount["status"])}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="edit-plan" className="block text-sm font-medium text-gray-700">
              Plan
            </label>
            <select
              id="edit-plan"
              value={editPlan}
              onChange={(e) => setEditPlan(e.target.value as SubAccount["plan"])}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>
          <Input
            label="Monthly Fee ($)"
            id="edit-fee"
            type="number"
            min="0"
            step="0.01"
            value={editMonthlyFee}
            onChange={(e) => setEditMonthlyFee(e.target.value)}
          />
          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" loading={saving}>
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Client Account"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete{" "}
            <strong>{deleteTarget?.business_name}</strong>? This action cannot be undone.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete Account
            </Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
