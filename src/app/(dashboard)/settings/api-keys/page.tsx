"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// ── Types ──────────────────────────────────────────────────────────────────────

interface ApiKey {
  id: string;
  name: string;
  key_prefix: string;
  last_used_at: string | null;
  is_active: boolean;
  created_at: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return "Never";
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loadingKeys, setLoadingKeys] = useState(true);

  // Create form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  // One-time key display modal
  const [newKeyValue, setNewKeyValue] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Revoke confirmation
  const [revokeTarget, setRevokeTarget] = useState<ApiKey | null>(null);
  const [revoking, setRevoking] = useState(false);

  // ── Fetch keys ───────────────────────────────────────────────────────────────

  const fetchKeys = useCallback(async () => {
    setLoadingKeys(true);
    try {
      const res = await fetch("/api/settings/api-keys");
      if (res.ok) {
        const json = await res.json();
        setKeys(json.data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoadingKeys(false);
    }
  }, []);

  useEffect(() => {
    fetchKeys();
  }, [fetchKeys]);

  // ── Create key ───────────────────────────────────────────────────────────────

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    if (!newKeyName.trim()) {
      setCreateError("Please enter a name for this key.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        setCreateError(json.error ?? "Failed to create key.");
        return;
      }
      setNewKeyValue(json.data.key);
      setNewKeyName("");
      setShowCreateForm(false);
      await fetchKeys();
    } catch {
      setCreateError("An unexpected error occurred.");
    } finally {
      setCreating(false);
    }
  }

  // ── Copy key ─────────────────────────────────────────────────────────────────

  async function handleCopy() {
    if (!newKeyValue) return;
    try {
      await navigator.clipboard.writeText(newKeyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }

  // ── Revoke key ───────────────────────────────────────────────────────────────

  async function handleRevoke() {
    if (!revokeTarget) return;
    setRevoking(true);
    try {
      const res = await fetch(`/api/settings/api-keys/${revokeTarget.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRevokeTarget(null);
        await fetchKeys();
      }
    } catch {
      // silently fail
    } finally {
      setRevoking(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">API Keys</h1>
          <p className="text-sm text-gray-500 mt-1">
            Use API keys to integrate LeadFlow AI with your own apps and tools.
          </p>
        </div>
        {!showCreateForm && (
          <Button onClick={() => setShowCreateForm(true)} className="self-start sm:self-auto">
            Create New Key
          </Button>
        )}
      </div>

      {/* Create form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create API Key</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <Input
                label="Key Name"
                id="key-name"
                placeholder="e.g. My CRM Integration"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                error={createError}
                autoFocus
              />
              <div className="flex items-center gap-3">
                <Button type="submit" loading={creating}>
                  Generate Key
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewKeyName("");
                    setCreateError("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Keys table */}
      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingKeys ? (
            <div className="p-6 text-sm text-gray-400">Loading keys...</div>
          ) : keys.length === 0 ? (
            <div className="p-6 text-sm text-gray-400">
              No API keys yet. Create one to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-6 py-3 font-medium text-gray-500">Name</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Prefix</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Created</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Last Used</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Status</th>
                    <th className="px-6 py-3 font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {keys.map((key) => (
                    <tr key={key.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900">{key.name}</td>
                      <td className="px-6 py-4">
                        <code className="rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                          {key.key_prefix}...
                        </code>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(key.created_at)}</td>
                      <td className="px-6 py-4 text-gray-500">{formatDate(key.last_used_at)}</td>
                      <td className="px-6 py-4">
                        <span
                          className={
                            key.is_active
                              ? "inline-flex items-center rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700"
                              : "inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500"
                          }
                        >
                          {key.is_active ? "Active" : "Revoked"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {key.is_active && (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setRevokeTarget(key)}
                          >
                            Revoke
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* One-time key display modal */}
      <Modal
        open={!!newKeyValue}
        onClose={() => {
          setNewKeyValue(null);
          setCopied(false);
        }}
        title="Your New API Key"
        size="lg"
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <strong>Save this key now.</strong> For security reasons, it will not be shown again after you close this dialog.
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 overflow-auto rounded-lg bg-gray-900 px-4 py-3 text-sm text-green-400 break-all">
              {newKeyValue}
            </code>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleCopy} variant={copied ? "secondary" : "primary"}>
              {copied ? "Copied!" : "Copy to Clipboard"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setNewKeyValue(null);
                setCopied(false);
              }}
            >
              I&apos;ve saved it, close
            </Button>
          </div>
        </div>
      </Modal>

      {/* Revoke confirmation modal */}
      <Modal
        open={!!revokeTarget}
        onClose={() => setRevokeTarget(null)}
        title="Revoke API Key"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to revoke{" "}
            <strong>{revokeTarget?.name}</strong>? Any integrations using this
            key will stop working immediately.
          </p>
          <div className="flex items-center gap-3">
            <Button variant="danger" loading={revoking} onClick={handleRevoke}>
              Revoke Key
            </Button>
            <Button variant="outline" onClick={() => setRevokeTarget(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
