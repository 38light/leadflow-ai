"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// ── Types ──────────────────────────────────────────────────────────────────────

interface Broadcast {
  id: string;
  name: string;
  message: string;
  channel_type: "whatsapp" | "sms" | "web_chat";
  segment_status: string[] | null;
  segment_temperature: string[] | null;
  segment_source_channel: string[] | null;
  recipient_count: number;
  sent_count: number;
  failed_count: number;
  status: "draft" | "sending" | "sent" | "failed";
  sent_at: string | null;
  created_at: string;
}

type ChannelType = "whatsapp" | "sms" | "web_chat";

interface FormState {
  name: string;
  message: string;
  channelType: ChannelType;
  segmentStatus: string[];
  segmentTemperature: string[];
  segmentSourceChannel: string[];
}

// ── Constants ──────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = ["new", "contacted", "qualified", "proposal", "negotiation", "won", "lost"];
const TEMPERATURE_OPTIONS = ["cold", "warm", "hot"];
const SOURCE_OPTIONS = ["whatsapp", "instagram", "facebook", "sms", "voice", "web_chat", "manual", "hubspot"];

const CHANNEL_LABELS: Record<ChannelType, string> = {
  whatsapp: "WhatsApp",
  sms: "SMS",
  web_chat: "Web Chat",
};

const CHANNEL_ICONS: Record<ChannelType, string> = {
  whatsapp: "💬",
  sms: "📱",
  web_chat: "🌐",
};

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Broadcast["status"] }) {
  const map: Record<Broadcast["status"], { variant: "default" | "secondary" | "success" | "warning" | "danger" | "outline"; label: string }> = {
    draft: { variant: "secondary", label: "Draft" },
    sending: { variant: "warning", label: "Sending…" },
    sent: { variant: "success", label: "Sent" },
    failed: { variant: "danger", label: "Failed" },
  };
  const cfg = map[status];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

// ── Chip multi-select ──────────────────────────────────────────────────────────

function ChipGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  function toggle(opt: string) {
    if (selected.includes(opt)) {
      onChange(selected.filter((s) => s !== opt));
    } else {
      onChange([...selected, opt]);
    }
  }

  return (
    <div>
      <p className="text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium border transition-colors capitalize",
              selected.includes(opt)
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600"
            )}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
        <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-1">No broadcast campaigns yet</h3>
      <p className="text-sm text-gray-500 mb-6 max-w-sm">
        Send targeted messages to your contact segments across WhatsApp, SMS, or Web Chat.
      </p>
      <Button onClick={onNew}>New Campaign</Button>
    </div>
  );
}

// ── Broadcast card ─────────────────────────────────────────────────────────────

function BroadcastCard({
  broadcast,
  onSend,
  sending,
}: {
  broadcast: Broadcast;
  onSend: (id: string) => void;
  sending: string | null;
}) {
  const isSending = sending === broadcast.id;
  const sentDate = broadcast.sent_at ? new Date(broadcast.sent_at).toLocaleDateString() : null;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-semibold text-gray-900 truncate">{broadcast.name}</h3>
              <StatusBadge status={broadcast.status} />
            </div>
            <p className="text-sm text-gray-500 mb-3 line-clamp-2">{broadcast.message}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
              <span>
                {CHANNEL_ICONS[broadcast.channel_type]} {CHANNEL_LABELS[broadcast.channel_type]}
              </span>
              <span>{broadcast.recipient_count} recipients</span>
              {broadcast.status === "sent" && (
                <span className="text-green-600">
                  {broadcast.sent_count} sent
                  {broadcast.failed_count > 0 && (
                    <span className="text-red-500 ml-1">, {broadcast.failed_count} failed</span>
                  )}
                </span>
              )}
              {sentDate && <span>Sent {sentDate}</span>}
            </div>
          </div>
          {broadcast.status === "draft" && (
            <Button
              size="sm"
              variant="primary"
              loading={isSending}
              onClick={() => onSend(broadcast.id)}
            >
              Send Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── Default form state ─────────────────────────────────────────────────────────

const DEFAULT_FORM: FormState = {
  name: "",
  message: "",
  channelType: "whatsapp",
  segmentStatus: [],
  segmentTemperature: [],
  segmentSourceChannel: [],
};

// ── Main page ──────────────────────────────────────────────────────────────────

export default function BroadcastsPage() {
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [previewCount, setPreviewCount] = useState<number | null>(null);
  const [previewOptedOut, setPreviewOptedOut] = useState<number>(0);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [confirmSendId, setConfirmSendId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load broadcasts ──────────────────────────────────────────────────────────

  async function loadBroadcasts() {
    setLoading(true);
    try {
      const res = await fetch("/api/broadcasts");
      if (res.ok) {
        const json = await res.json();
        setBroadcasts(json.data ?? []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBroadcasts();
  }, []);

  // ── Live preview (debounced 500ms) ───────────────────────────────────────────

  const fetchPreview = useCallback(async (f: FormState) => {
    setPreviewLoading(true);
    try {
      const res = await fetch("/api/broadcasts/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channelType: f.channelType,
          segmentStatus: f.segmentStatus.length > 0 ? f.segmentStatus : undefined,
          segmentTemperature: f.segmentTemperature.length > 0 ? f.segmentTemperature : undefined,
          segmentSourceChannel: f.segmentSourceChannel.length > 0 ? f.segmentSourceChannel : undefined,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setPreviewCount(json.data?.count ?? 0);
        setPreviewOptedOut(json.data?.optedOutCount ?? 0);
      }
    } catch {
      // silently fail
    } finally {
      setPreviewLoading(false);
    }
  }, []);

  const { channelType, segmentStatus, segmentTemperature, segmentSourceChannel } = form;

  useEffect(() => {
    if (!showCreate) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPreview({
        name: "",
        message: "",
        channelType,
        segmentStatus,
        segmentTemperature,
        segmentSourceChannel,
      });
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [
    channelType,
    segmentStatus,
    segmentTemperature,
    segmentSourceChannel,
    showCreate,
    fetchPreview,
  ]);

  // ── Open create form ─────────────────────────────────────────────────────────

  function openCreate() {
    setForm(DEFAULT_FORM);
    setSaveError(null);
    setPreviewCount(null);
    setPreviewOptedOut(0);
    setShowCreate(true);
  }

  function closeCreate() {
    setShowCreate(false);
  }

  // ── Update form field helpers ────────────────────────────────────────────────

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  // ── Save draft ───────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.name.trim()) {
      setSaveError("Campaign name is required.");
      return;
    }
    if (!form.message.trim()) {
      setSaveError("Message is required.");
      return;
    }

    setSaving(true);
    setSaveError(null);

    try {
      const res = await fetch("/api/broadcasts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          message: form.message,
          channelType: form.channelType,
          segmentStatus: form.segmentStatus.length > 0 ? form.segmentStatus : undefined,
          segmentTemperature: form.segmentTemperature.length > 0 ? form.segmentTemperature : undefined,
          segmentSourceChannel: form.segmentSourceChannel.length > 0 ? form.segmentSourceChannel : undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSaveError(json.error ?? "Failed to save campaign.");
        return;
      }

      setBroadcasts((prev) => [json.data, ...prev]);
      closeCreate();
    } catch {
      setSaveError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  // ── Send broadcast ────────────────────────────────────────────────────────────

  async function handleSend(id: string) {
    setSending(id);
    try {
      const res = await fetch(`/api/broadcasts/${id}/send`, { method: "POST" });
      const json = await res.json();
      if (res.ok) {
        // Optimistically update the broadcast in the list
        setBroadcasts((prev) =>
          prev.map((b) =>
            b.id === id
              ? { ...b, status: "sent", sent_count: json.data?.sent ?? b.recipient_count, sent_at: new Date().toISOString() }
              : b
          )
        );
      }
    } catch {
      // silently fail — user can retry
    } finally {
      setSending(null);
    }
  }

  // ── WhatsApp template notice ──────────────────────────────────────────────────

  const showWhatsAppNotice = form.channelType === "whatsapp";

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Broadcasts</h1>
          <p className="text-sm text-gray-500 mt-1">Send targeted messages to contact segments</p>
        </div>
        <Button onClick={openCreate}>New Campaign</Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-5">
                <Skeleton className="h-5 w-48 mb-2" />
                <Skeleton className="h-4 w-full mb-3" />
                <Skeleton className="h-3 w-64" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : broadcasts.length === 0 ? (
        <EmptyState onNew={openCreate} />
      ) : (
        <div className="space-y-3">
          {broadcasts.map((b) => (
            <BroadcastCard
              key={b.id}
              broadcast={b}
              onSend={(id) => setConfirmSendId(id)}
              sending={sending}
            />
          ))}
        </div>
      )}

      {/* Confirm send modal */}
      <Modal
        open={confirmSendId !== null}
        onClose={() => setConfirmSendId(null)}
        title="Confirm Send"
        size="sm"
      >
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to send this campaign now? This action cannot be undone.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setConfirmSendId(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            loading={sending === confirmSendId}
            onClick={() => {
              if (confirmSendId) {
                handleSend(confirmSendId);
                setConfirmSendId(null);
              }
            }}
          >
            Send Now
          </Button>
        </div>
      </Modal>

      {/* Create form modal */}
      <Modal open={showCreate} onClose={closeCreate} title="New Campaign" size="xl">
        <div className="space-y-5">
          {/* Campaign name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Campaign Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="e.g. Summer Promo — Hot Leads"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Channel selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
            <div className="flex gap-2">
              {(["whatsapp", "sms", "web_chat"] as ChannelType[]).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setField("channelType", ch)}
                  className={cn(
                    "flex-1 py-2 px-3 rounded-lg border text-sm font-medium transition-colors",
                    form.channelType === ch
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                  )}
                >
                  {CHANNEL_ICONS[ch]} {CHANNEL_LABELS[ch]}
                </button>
              ))}
            </div>
          </div>

          {/* Message */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                Message <span className="text-red-500">*</span>
              </label>
              <span className={cn("text-xs", form.message.length > 900 ? "text-red-500" : "text-gray-400")}>
                {form.message.length}/1000
              </span>
            </div>
            <textarea
              value={form.message}
              onChange={(e) => setField("message", e.target.value)}
              placeholder="Hi {{name}}, we have a special offer just for you…"
              rows={4}
              maxLength={1000}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
            />
          </div>

          {/* WhatsApp template notice */}
          {showWhatsAppNotice && (
            <div className="flex gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <span className="text-amber-500 shrink-0 mt-0.5">⚠️</span>
              <p className="text-xs text-amber-800">
                <strong>WhatsApp requires pre-approved templates</strong> for contacts outside the
                24-hour service window. Contacts within the window will receive this message; others
                will receive your configured template.
              </p>
            </div>
          )}

          {/* Segment filters */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-700">
              Audience Filters{" "}
              <span className="text-gray-400 font-normal">(leave blank to target all contacts)</span>
            </p>

            <ChipGroup
              label="Status"
              options={STATUS_OPTIONS}
              selected={form.segmentStatus}
              onChange={(v) => setField("segmentStatus", v)}
            />

            <ChipGroup
              label="Temperature"
              options={TEMPERATURE_OPTIONS}
              selected={form.segmentTemperature}
              onChange={(v) => setField("segmentTemperature", v)}
            />

            <ChipGroup
              label="Source Channel"
              options={SOURCE_OPTIONS}
              selected={form.segmentSourceChannel}
              onChange={(v) => setField("segmentSourceChannel", v)}
            />
          </div>

          {/* Live preview */}
          <div className="rounded-lg bg-blue-50 border border-blue-100 px-4 py-3">
            {previewLoading ? (
              <p className="text-sm text-blue-700">Calculating reach…</p>
            ) : previewCount === null ? (
              <p className="text-sm text-blue-700">Calculating reach…</p>
            ) : (
              <div className="text-sm text-blue-800 space-y-0.5">
                <p>
                  <strong>This message will reach {previewCount} contact{previewCount !== 1 ? "s" : ""}</strong>
                </p>
                {previewOptedOut > 0 && (
                  <p className="text-blue-600 text-xs">
                    Excluding {previewOptedOut} opted-out contact{previewOptedOut !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Error */}
          {saveError && (
            <p className="text-sm text-red-600">{saveError}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="outline" onClick={closeCreate} disabled={saving}>
              Cancel
            </Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              Save as Draft
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
