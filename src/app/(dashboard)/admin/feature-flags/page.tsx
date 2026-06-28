"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Trash2, Globe, Globe2, Users, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Toggle } from "@/components/ui/toggle";
import { useToast } from "@/components/ui/toast";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled_globally: boolean;
  rollout_percentage: number;
  override_count: number;
  created_at: string;
  updated_at: string;
}

interface FlagOverride {
  id: string;
  user_id: string;
  enabled: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Create Flag Modal
// ---------------------------------------------------------------------------

interface CreateFlagModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (flag: FeatureFlag) => void;
}

function CreateFlagModal({ open, onClose, onCreated }: CreateFlagModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    key: "",
    name: "",
    description: "",
    enabled_globally: false,
    rollout_percentage: 0,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate() {
    const e: Record<string, string> = {};
    if (!form.key.trim()) e.key = "Key is required";
    else if (!/^[a-z0-9_]+$/.test(form.key))
      e.key = "Only lowercase letters, numbers, and underscores";
    if (!form.name.trim()) e.name = "Name is required";
    if (form.rollout_percentage < 0 || form.rollout_percentage > 100)
      e.rollout_percentage = "Must be 0–100";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      const res = await fetch("/api/admin/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast((json as { error?: string }).error ?? "Failed to create flag", "error");
        return;
      }
      const json = await res.json();
      toast("Feature flag created", "success");
      onCreated(json.data as FeatureFlag);
      setForm({ key: "", name: "", description: "", enabled_globally: false, rollout_percentage: 0 });
      onClose();
    } catch {
      toast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Create Feature Flag" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="ff-key"
          label="Key"
          placeholder="e.g. ai_chat"
          value={form.key}
          onChange={(e) => setForm((f) => ({ ...f, key: e.target.value }))}
          error={errors.key}
        />
        <Input
          id="ff-name"
          label="Name"
          placeholder="e.g. AI Chat"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          error={errors.name}
        />
        <div className="space-y-1">
          <label htmlFor="ff-description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            id="ff-description"
            rows={2}
            className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="Optional description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-gray-700">Globally Enabled</p>
            <p className="text-xs text-gray-500">Enabled for all users</p>
          </div>
          <Toggle
            checked={form.enabled_globally}
            onChange={(v) => setForm((f) => ({ ...f, enabled_globally: v }))}
          />
        </div>
        <div className="space-y-1">
          <label htmlFor="ff-rollout" className="block text-sm font-medium text-gray-700">
            Rollout Percentage: <span className="font-semibold text-blue-600">{form.rollout_percentage}%</span>
          </label>
          <input
            id="ff-rollout"
            type="range"
            min={0}
            max={100}
            value={form.rollout_percentage}
            onChange={(e) =>
              setForm((f) => ({ ...f, rollout_percentage: Number(e.target.value) }))
            }
            className="w-full accent-blue-600"
          />
          {errors.rollout_percentage && (
            <p className="text-sm text-red-600">{errors.rollout_percentage}</p>
          )}
        </div>
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Create Flag
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Overrides Panel
// ---------------------------------------------------------------------------

interface OverridesPanelProps {
  flag: FeatureFlag;
  onOverrideCountChange: (flagId: string, delta: number) => void;
}

function OverridesPanel({ flag, onOverrideCountChange }: OverridesPanelProps) {
  const { toast } = useToast();
  const [overrides, setOverrides] = useState<FlagOverride[]>([]);
  const [loading, setLoading] = useState(true);
  const [addUserId, setAddUserId] = useState("");
  const [addEnabled, setAddEnabled] = useState(true);
  const [addLoading, setAddLoading] = useState(false);

  const loadOverrides = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/feature-flags/${flag.id}/overrides`);
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error((json as { error?: string }).error ?? "Failed to load overrides");
      }
      const json = await res.json();
      setOverrides(json.data as FlagOverride[]);
    } catch {
      // error is intentionally swallowed — overrides panel will show empty state
    } finally {
      setLoading(false);
    }
  }, [flag.id]);

  useEffect(() => {
    loadOverrides();
  }, [loadOverrides]);

  async function handleAddOverride(e: React.FormEvent) {
    e.preventDefault();
    if (!addUserId.trim()) {
      toast("User ID is required", "error");
      return;
    }
    setAddLoading(true);
    try {
      const res = await fetch(`/api/admin/feature-flags/${flag.id}/overrides`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: addUserId.trim(), enabled: addEnabled }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "Failed to add override", "error");
        return;
      }
      toast("Override set", "success");
      setAddUserId("");
      setAddEnabled(true);
      await loadOverrides();
      onOverrideCountChange(flag.id, 1);
    } catch {
      toast("Network error", "error");
    } finally {
      setAddLoading(false);
    }
  }

  async function handleRemoveOverride(userId: string) {
    try {
      const res = await fetch(`/api/admin/feature-flags/${flag.id}/overrides`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) {
        const json = await res.json();
        toast(json.error ?? "Failed to remove override", "error");
        return;
      }
      toast("Override removed", "success");
      setOverrides((prev) => prev.filter((o) => o.user_id !== userId));
      onOverrideCountChange(flag.id, -1);
    } catch {
      toast("Network error", "error");
    }
  }

  return (
    <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
      <h4 className="mb-3 text-sm font-semibold text-gray-700 flex items-center gap-2">
        <Users className="h-4 w-4" />
        User Overrides for <span className="font-mono text-blue-700">{flag.key}</span>
      </h4>

      {/* Add Override Form */}
      <form onSubmit={handleAddOverride} className="mb-4 flex items-end gap-3 flex-wrap">
        <div className="flex-1 min-w-48">
          <Input
            id={`add-override-uid-${flag.id}`}
            label="User ID (UUID)"
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            value={addUserId}
            onChange={(e) => setAddUserId(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 pb-1">
          <Toggle
            checked={addEnabled}
            onChange={setAddEnabled}
            label={addEnabled ? "Enabled" : "Disabled"}
          />
        </div>
        <Button type="submit" size="sm" loading={addLoading} className="pb-1">
          <Plus className="h-4 w-4 mr-1" />
          Add Override
        </Button>
      </form>

      {/* Overrides List */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
      ) : overrides.length === 0 ? (
        <p className="text-sm text-gray-400 italic">No user overrides configured.</p>
      ) : (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 bg-white overflow-hidden">
          {overrides.map((o) => (
            <div key={o.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="font-mono text-xs text-gray-600 truncate flex-1">{o.user_id}</span>
              <span
                className={`ml-3 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  o.enabled
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {o.enabled ? "On" : "Off"}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveOverride(o.user_id)}
                className="ml-3 rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                aria-label="Remove override"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function FeatureFlagsPage() {
  const { toast } = useToast();
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedFlagId, setExpandedFlagId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  // Track inline rollout edits per flag
  const [rolloutDraft, setRolloutDraft] = useState<Record<string, number>>({});

  const loadFlags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/feature-flags");
      if (res.ok) {
        const json = await res.json();
        setFlags(json.data as FeatureFlag[]);
      } else {
        toast("Failed to load feature flags", "error");
      }
    } catch {
      toast("Network error", "error");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadFlags();
  }, [loadFlags]);

  async function handleToggleGlobal(flag: FeatureFlag) {
    setUpdatingId(flag.id);
    try {
      const res = await fetch(`/api/admin/feature-flags/${flag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled_globally: !flag.enabled_globally }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "Update failed", "error");
        return;
      }
      setFlags((prev) =>
        prev.map((f) => (f.id === flag.id ? { ...f, enabled_globally: !flag.enabled_globally } : f))
      );
      toast(
        `Flag "${flag.key}" ${!flag.enabled_globally ? "enabled" : "disabled"} globally`,
        "success"
      );
    } catch {
      toast("Network error", "error");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleRolloutSave(flag: FeatureFlag) {
    const pct = rolloutDraft[flag.id];
    if (pct === undefined || pct === flag.rollout_percentage) return;
    setUpdatingId(flag.id);
    try {
      const res = await fetch(`/api/admin/feature-flags/${flag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollout_percentage: pct }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "Update failed", "error");
        return;
      }
      setFlags((prev) =>
        prev.map((f) => (f.id === flag.id ? { ...f, rollout_percentage: pct } : f))
      );
      setRolloutDraft((d) => {
        const next = { ...d };
        delete next[flag.id];
        return next;
      });
      toast(`Rollout updated to ${pct}%`, "success");
    } catch {
      toast("Network error", "error");
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleDelete(flag: FeatureFlag) {
    if (!window.confirm(`Delete flag "${flag.key}"? This cannot be undone.`)) return;
    setDeletingId(flag.id);
    try {
      const res = await fetch(`/api/admin/feature-flags/${flag.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        toast(json.error ?? "Delete failed", "error");
        return;
      }
      setFlags((prev) => prev.filter((f) => f.id !== flag.id));
      if (expandedFlagId === flag.id) setExpandedFlagId(null);
      toast(`Flag "${flag.key}" deleted`, "success");
    } catch {
      toast("Network error", "error");
    } finally {
      setDeletingId(null);
    }
  }

  function handleOverrideCountChange(flagId: string, delta: number) {
    setFlags((prev) =>
      prev.map((f) =>
        f.id === flagId ? { ...f, override_count: Math.max(0, f.override_count + delta) } : f
      )
    );
  }

  function getRolloutValue(flag: FeatureFlag): number {
    return rolloutDraft[flag.id] ?? flag.rollout_percentage;
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Feature Flags</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage feature rollouts and per-user overrides
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Flag
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        {loading ? (
          <div className="divide-y divide-gray-100">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 animate-pulse bg-gray-50" />
            ))}
          </div>
        ) : flags.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Globe2 className="mx-auto h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No feature flags yet.</p>
            <Button className="mt-4" onClick={() => setCreateOpen(true)}>
              Create your first flag
            </Button>
          </div>
        ) : (
          <>
            {/* Table Head */}
            <div className="border-b border-gray-100 bg-gray-50/70 px-4 py-3 hidden md:grid md:grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] gap-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
              <span>Key / Name</span>
              <span>Description</span>
              <span className="text-center">Global</span>
              <span className="text-center">Rollout %</span>
              <span className="text-center">Overrides</span>
              <span />
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-100">
              {flags.map((flag) => {
                const isExpanded = expandedFlagId === flag.id;
                const isUpdating = updatingId === flag.id;
                const isDeleting = deletingId === flag.id;
                const rolloutVal = getRolloutValue(flag);
                const rolloutChanged =
                  rolloutDraft[flag.id] !== undefined &&
                  rolloutDraft[flag.id] !== flag.rollout_percentage;

                return (
                  <div key={flag.id}>
                    {/* Main Row */}
                    <div className="flex flex-col gap-3 px-4 py-4 md:grid md:grid-cols-[2fr_2fr_1fr_1fr_1fr_auto] md:items-center md:gap-4">
                      {/* Key + Name */}
                      <div>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedFlagId(isExpanded ? null : flag.id)
                          }
                          className="text-left group"
                        >
                          <p className="font-mono text-sm font-semibold text-blue-700 group-hover:underline">
                            {flag.key}
                          </p>
                          <p className="text-sm text-gray-600">{flag.name}</p>
                        </button>
                      </div>

                      {/* Description */}
                      <div>
                        <p className="text-sm text-gray-500 line-clamp-2">
                          {flag.description ?? <span className="italic text-gray-300">—</span>}
                        </p>
                      </div>

                      {/* Global toggle */}
                      <div className="flex items-center justify-start md:justify-center gap-2">
                        <Toggle
                          checked={flag.enabled_globally}
                          onChange={() => handleToggleGlobal(flag)}
                          disabled={isUpdating || isDeleting}
                        />
                        {flag.enabled_globally ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700">
                            <Globe className="h-3 w-3" /> On
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-gray-400">Off</span>
                        )}
                      </div>

                      {/* Rollout % inline edit */}
                      <div className="flex flex-col items-start md:items-center gap-1">
                        <div className="flex items-center gap-1.5 w-full md:w-auto">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={rolloutVal}
                            onChange={(e) =>
                              setRolloutDraft((d) => ({
                                ...d,
                                [flag.id]: Math.max(0, Math.min(100, Number(e.target.value))),
                              }))
                            }
                            onBlur={() => handleRolloutSave(flag)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRolloutSave(flag);
                            }}
                            className="w-16 rounded border border-gray-300 px-2 py-1 text-center text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            disabled={isUpdating || isDeleting}
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                        {rolloutChanged && (
                          <button
                            type="button"
                            onClick={() => handleRolloutSave(flag)}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Save
                          </button>
                        )}
                      </div>

                      {/* Override count */}
                      <div className="flex items-center justify-start md:justify-center">
                        <button
                          type="button"
                          onClick={() => setExpandedFlagId(isExpanded ? null : flag.id)}
                          className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          <Users className="h-3 w-3" />
                          {flag.override_count}
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          )}
                        </button>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleDelete(flag)}
                          disabled={isDeleting || isUpdating}
                          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-40"
                          aria-label="Delete flag"
                        >
                          {isDeleting ? (
                            <svg
                              className="h-4 w-4 animate-spin"
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
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Overrides Panel */}
                    {isExpanded && (
                      <OverridesPanel
                        flag={flag}
                        onOverrideCountChange={handleOverrideCountChange}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      <CreateFlagModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(flag) => setFlags((prev) => [flag, ...prev])}
      />
    </div>
  );
}
