"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// ── Types ──────────────────────────────────────────────────────────────────────

interface WebhookEndpoint {
  id: string;
  url: string;
  description: string | null;
  events: string[];
  secret: string;
  is_active: boolean;
  last_triggered_at: string | null;
  failure_count: number;
  created_at: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const ALL_EVENTS = [
  "contact.created",
  "contact.updated",
  "contact.status_changed",
  "booking.created",
  "booking.completed",
  "booking.cancelled",
  "conversation.started",
  "message.received",
  "ai.handoff",
];

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Add endpoint form
  const [showForm, setShowForm] = useState(false);
  const [formUrl, setFormUrl] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  // Secret reveal modal (one-time)
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [secretCopied, setSecretCopied] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<WebhookEndpoint | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toggle loading
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Fetch ─────────────────────────────────────────────────────────────────

  const fetchEndpoints = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/webhooks");
      if (res.ok) {
        const json = await res.json();
        setEndpoints(json.data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  // ── Create ────────────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!formUrl.startsWith("https://")) {
      setFormError("URL must start with https://");
      return;
    }
    if (formEvents.length === 0) {
      setFormError("Select at least one event.");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/settings/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: formUrl,
          description: formDescription || undefined,
          events: formEvents,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? "Failed to create webhook.");
        return;
      }
      // Show secret once
      setNewSecret(json.data.secret);
      setFormUrl("");
      setFormDescription("");
      setFormEvents([]);
      setShowForm(false);
      await fetchEndpoints();
    } catch {
      setFormError("An unexpected error occurred.");
    } finally {
      setCreating(false);
    }
  }

  // ── Toggle ────────────────────────────────────────────────────────────────

  async function handleToggle(endpoint: WebhookEndpoint) {
    setTogglingId(endpoint.id);
    try {
      await fetch(`/api/settings/webhooks/${endpoint.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !endpoint.is_active }),
      });
      await fetchEndpoints();
    } catch {
      // silently fail
    } finally {
      setTogglingId(null);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await fetch(`/api/settings/webhooks/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await fetchEndpoints();
    } catch {
      // silently fail
    } finally {
      setDeleting(false);
    }
  }

  // ── Secret copy ───────────────────────────────────────────────────────────

  async function handleCopySecret() {
    if (!newSecret) return;
    try {
      await navigator.clipboard.writeText(newSecret);
      setSecretCopied(true);
      setTimeout(() => setSecretCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  function toggleEvent(event: string) {
    setFormEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Webhooks</h1>
          <p className="text-sm text-gray-500 mt-1">
            Receive real-time events in your own systems
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)} className="self-start sm:self-auto">
            Add Endpoint
          </Button>
        )}
      </div>

      {/* Available events reference */}
      <Card>
        <CardHeader>
          <CardTitle>Available Events</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {ALL_EVENTS.map((event) => (
              <code
                key={event}
                className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
              >
                {event}
              </code>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add endpoint form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Webhook Endpoint</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Endpoint URL"
                id="webhook-url"
                type="url"
                placeholder="https://your-server.com/webhook"
                value={formUrl}
                onChange={(e) => setFormUrl(e.target.value)}
                autoFocus
              />
              <Input
                label="Description (optional)"
                id="webhook-desc"
                placeholder="e.g. CRM integration"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Events to receive</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {ALL_EVENTS.map((event) => (
                    <label key={event} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formEvents.includes(event)}
                        onChange={() => toggleEvent(event)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <code className="text-xs text-gray-700">{event}</code>
                    </label>
                  ))}
                </div>
              </div>
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <div className="flex items-center gap-3">
                <Button type="submit" loading={creating}>
                  Create Endpoint
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    setFormUrl("");
                    setFormDescription("");
                    setFormEvents([]);
                    setFormError("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Endpoints table */}
      <Card>
        <CardHeader>
          <CardTitle>Registered Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-sm text-gray-400">Loading endpoints...</div>
          ) : endpoints.length === 0 ? (
            <div className="p-6 text-sm text-gray-400">
              No webhook endpoints yet. Add one to start receiving events.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-6 py-3 font-medium text-gray-500">URL</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Events</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Last Triggered</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Failures</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {endpoints.map((ep) => (
                    <tr key={ep.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900 truncate max-w-[200px]" title={ep.url}>
                          {ep.url}
                        </div>
                        {ep.description && (
                          <div className="text-xs text-gray-400 mt-0.5">{ep.description}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[180px]">
                          {ep.events.map((event) => (
                            <span
                              key={event}
                              className="inline-flex rounded bg-blue-50 px-1.5 py-0.5 text-xs text-blue-700"
                            >
                              {event}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            ep.is_active
                              ? "inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
                              : "inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700"
                          }
                        >
                          {ep.is_active ? "Active" : "Paused"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(ep.last_triggered_at)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            ep.failure_count > 0
                              ? "font-medium text-red-600"
                              : "text-gray-400"
                          }
                        >
                          {ep.failure_count}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            loading={togglingId === ep.id}
                            onClick={() => handleToggle(ep)}
                          >
                            {ep.is_active ? "Pause" : "Enable"}
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteTarget(ep)}
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

      {/* Secret reveal modal — shown once on creation */}
      <Modal
        open={!!newSecret}
        onClose={() => {
          setNewSecret(null);
          setSecretCopied(false);
        }}
        title="Webhook Signing Secret"
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <strong>Save this secret now.</strong> It will not be shown again after you close this dialog. Use it to verify the{" "}
            <code className="font-mono">X-LeadFlow-Signature</code> header on incoming requests.
          </div>
          <div>
            <code className="block overflow-auto rounded-lg bg-gray-900 px-4 py-3 text-sm text-green-400 break-all">
              {newSecret}
            </code>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleCopySecret} variant={secretCopied ? "secondary" : "primary"}>
              {secretCopied ? "Copied!" : "Copy Secret"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setNewSecret(null);
                setSecretCopied(false);
              }}
            >
              I&apos;ve saved it, close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Webhook Endpoint"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete the endpoint at{" "}
            <strong className="break-all">{deleteTarget?.url}</strong>? This cannot be undone.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="danger" loading={deleting} onClick={handleDelete}>
              Delete Endpoint
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
