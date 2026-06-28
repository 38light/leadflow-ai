"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { notFound } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { LEAD_STATUSES, TEMPERATURES } from "@/constants/app";
import type { Contact, Conversation } from "@/types";
import { JourneyTimeline } from "@/components/contacts/journey-timeline";

const STATUS_OPTIONS = LEAD_STATUSES.map((s) => ({
  value: s.value,
  label: s.label,
}));

const TEMP_OPTIONS = TEMPERATURES.map((t) => ({
  value: t.value,
  label: t.label,
}));

const WIN_LOSS_REASON_CHIPS = [
  "Price",
  "Fit",
  "Timeline",
  "Competitor",
  "No budget",
  "Other",
];

interface EditForm {
  name: string;
  email: string;
  phone: string;
  status: string;
  temperature: string;
  notes: string;
  win_loss_reason: string;
}

export default function ContactDetailPage() {
  const params = useParams();
  const contactId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();

  const [contact, setContact] = useState<Contact | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingContact, setLoadingContact] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<EditForm>({
    name: "",
    email: "",
    phone: "",
    status: "new",
    temperature: "cold",
    notes: "",
    win_loss_reason: "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Win/Loss reason modal state
  const [winLossModalOpen, setWinLossModalOpen] = useState(false);
  const [winLossReason, setWinLossReason] = useState("");

  const fetchContact = useCallback(async () => {
    if (!contactId) return;
    setLoadingContact(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`);
      if (res.status === 404) {
        setNotFoundError(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setContact(json.data);
      setEditForm({
        name: json.data.name ?? "",
        email: json.data.email ?? "",
        phone: json.data.phone ?? "",
        status: json.data.status ?? "new",
        temperature: json.data.temperature ?? "cold",
        notes: "",
        win_loss_reason: "",
      });
    } catch {
      setNotFoundError(true);
    } finally {
      setLoadingContact(false);
    }
  }, [contactId]);

  const fetchConversations = useCallback(async () => {
    if (!contactId) return;
    try {
      const res = await fetch(
        `/api/conversations?contact_id=${contactId}&limit=25`
      );
      if (!res.ok) return;
      const json = await res.json();
      setConversations(json.data ?? []);
    } catch {
      // non-critical
    }
  }, [contactId]);

  useEffect(() => {
    fetchContact();
    fetchConversations();
  }, [fetchContact, fetchConversations]);

  if (notFoundError) notFound();

  async function performSave(winLossReasonOverride?: string) {
    if (!contactId) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {};
      if (editForm.name) body.name = editForm.name;
      if (editForm.email) body.email = editForm.email;
      if (editForm.phone) body.phone = editForm.phone;
      if (editForm.status) body.status = editForm.status;
      if (editForm.temperature) body.temperature = editForm.temperature;

      const reason = winLossReasonOverride ?? editForm.win_loss_reason;
      if (reason) {
        body.metadata = { win_loss_reason: reason };
      }

      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "Failed to update contact", "error");
        return;
      }
      setContact(json.data);
      setEditOpen(false);
      setWinLossModalOpen(false);
      setWinLossReason("");
      toast("Contact updated successfully", "success");
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    const isWinLoss =
      editForm.status === "won" || editForm.status === "lost";
    if (isWinLoss && !editForm.win_loss_reason) {
      // Show the win/loss reason modal before saving
      setWinLossReason("");
      setWinLossModalOpen(true);
      return;
    }
    await performSave();
  }

  async function handleWinLossConfirm() {
    if (!winLossReason.trim()) {
      toast("Please enter a reason", "error");
      return;
    }
    setEditForm((f) => ({ ...f, win_loss_reason: winLossReason.trim() }));
    await performSave(winLossReason.trim());
  }

  async function handleDelete() {
    if (!contactId) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        toast(json.error ?? "Failed to delete contact", "error");
        return;
      }
      toast("Contact deleted", "success");
      router.push("/contacts");
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  if (loadingContact) {
    return (
      <div className="max-w-4xl animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="h-48 bg-gray-200 rounded-lg" />
          <div className="h-48 bg-gray-200 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!contact) return null;

  const statusConfig = LEAD_STATUSES.find((s) => s.value === contact.status);
  const tempConfig = TEMPERATURES.find((t) => t.value === contact.temperature);

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            {contact.name ?? "Unknown Contact"}
          </h1>
          <div className="flex gap-2 mt-2">
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                statusConfig?.color ?? "bg-gray-100 text-gray-800"
              }`}
            >
              {statusConfig?.label ?? contact.status}
            </span>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                tempConfig?.color ?? "bg-gray-100 text-gray-800"
              }`}
            >
              {tempConfig?.label ?? contact.temperature}
            </span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            Edit
          </Button>
          {confirmDelete ? (
            <div className="flex gap-2 items-center">
              <span className="text-sm text-red-600">Are you sure?</span>
              <Button
                variant="danger"
                size="sm"
                loading={deleting}
                onClick={handleDelete}
              >
                Yes, Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-4">Details</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-gray-500">Email</dt>
              <dd>{contact.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Phone</dt>
              <dd>{contact.phone ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Company</dt>
              <dd>{contact.company ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Source</dt>
              <dd>{contact.source_channel ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Score</dt>
              <dd>{contact.score}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-4">
            Conversations ({conversations.length})
          </h2>
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className="p-3 border rounded hover:bg-gray-50"
              >
                <p className="text-sm font-medium">{conv.channel_type}</p>
                <p className="text-xs text-gray-500">
                  {conv.status} &middot; {conv.unread_count ?? 0} unread
                </p>
              </div>
            ))}
            {conversations.length === 0 && (
              <p className="text-sm text-gray-400">No conversations yet.</p>
            )}
          </div>
        </div>
      </div>

      {contact.metadata && Object.keys(contact.metadata).length > 0 && (
        <div className="mt-6 bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-4">Extracted Data</h2>
          <dl className="space-y-2 text-sm">
            {Object.entries(contact.metadata).map(([key, value]) => (
              <div key={key}>
                <dt className="text-gray-500 capitalize">
                  {key.replace(/_/g, " ")}
                </dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      <div className="mt-6 bg-white border rounded-lg p-6">
        <h2 className="font-semibold mb-4">Journey Timeline</h2>
        <JourneyTimeline contactId={contactId} />
      </div>

      {/* Edit Modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit Contact"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, name: e.target.value }))
              }
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={editForm.email}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, email: e.target.value }))
              }
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              value={editForm.phone}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, phone: e.target.value }))
              }
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <Select
              label="Status"
              options={STATUS_OPTIONS}
              value={editForm.status}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, status: e.target.value }))
              }
            />
          </div>
          <div>
            <Select
              label="Temperature"
              options={TEMP_OPTIONS}
              value={editForm.temperature}
              onChange={(e) =>
                setEditForm((f) => ({ ...f, temperature: e.target.value }))
              }
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button size="sm" loading={saving} onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* Win/Loss Reason Modal */}
      <Modal
        open={winLossModalOpen}
        onClose={() => setWinLossModalOpen(false)}
        title="Why did this deal close?"
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Help us understand what happened with this deal.
          </p>

          {/* Quick-select chips */}
          <div className="flex flex-wrap gap-2">
            {WIN_LOSS_REASON_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setWinLossReason(chip)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  winLossReason === chip
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:text-blue-600"
                }`}
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Text input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <input
              type="text"
              value={winLossReason}
              onChange={(e) => setWinLossReason(e.target.value)}
              placeholder="Describe the reason..."
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWinLossModalOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              loading={saving}
              onClick={handleWinLossConfirm}
            >
              Confirm &amp; Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
