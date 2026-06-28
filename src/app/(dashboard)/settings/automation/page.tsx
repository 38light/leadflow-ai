"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { Contact } from "@/types";

// ── Types ──────────────────────────────────────────────────────────────────────

interface StalledContact extends Contact {
  last_channel: string;
}

interface WaterfallSettings {
  staleDays: number;
  sequence: string[];
}

interface WaterfallData {
  stalled: StalledContact[];
  settings: WaterfallSettings;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const CHANNEL_SEQUENCE = ["whatsapp", "sms", "email", "manual_call"];

function nextChannel(lastChannel: string): string {
  const map: Record<string, string> = {
    whatsapp: "sms",
    sms: "email",
    email: "manual_call",
    web_chat: "manual_call",
  };
  return map[lastChannel] ?? "manual_call";
}

function channelLabel(channel: string): string {
  const labels: Record<string, string> = {
    whatsapp: "WhatsApp",
    sms: "SMS",
    email: "Email",
    manual_call: "Call",
    web_chat: "Web Chat",
    instagram: "Instagram",
    facebook: "Facebook",
    voice: "Voice",
    unknown: "Unknown",
  };
  return labels[channel] ?? channel.replace("_", " ");
}

function daysAgo(dateStr: string | null): number {
  if (!dateStr) return 999;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function buildPrefilledMessage(contact: StalledContact): string {
  const firstName = contact.name?.split(" ")[0] ?? "there";
  return `Hi ${firstName}, just checking in! We'd love to help. Let us know if you have any questions.`;
}

// ── Waterfall Sequence Diagram ─────────────────────────────────────────────────

function WaterfallSequence() {
  const steps = [
    { channel: "whatsapp", label: "WhatsApp", color: "bg-green-100 text-green-700 border-green-200" },
    { channel: "sms", label: "SMS", color: "bg-blue-100 text-blue-700 border-blue-200" },
    { channel: "email", label: "Email", color: "bg-purple-100 text-purple-700 border-purple-200" },
    { channel: "manual_call", label: "Manual Call", color: "bg-orange-100 text-orange-700 border-orange-200" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {steps.map((step, idx) => (
        <div key={step.channel} className="flex items-center gap-2">
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium border ${step.color}`}
          >
            <span className="mr-1.5 font-bold text-xs opacity-70">{idx + 1}</span>
            {step.label}
          </span>
          {idx < steps.length - 1 && (
            <span className="text-gray-400 text-sm">→</span>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Inline Follow-Up Form ──────────────────────────────────────────────────────

interface FollowUpFormProps {
  contact: StalledContact;
  onSuccess: (contactId: string) => void;
  onCancel: () => void;
}

function FollowUpForm({ contact, onSuccess, onCancel }: FollowUpFormProps) {
  const { toast } = useToast();
  const suggested = nextChannel(contact.last_channel);
  const [channel, setChannel] = useState(suggested);
  const [message, setMessage] = useState(buildPrefilledMessage(contact));
  const [sending, setSending] = useState(false);

  async function handleSend() {
    if (!message.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/automation/waterfall/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact.id, nextChannel: channel, message }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast((json as { error?: string }).error ?? "Failed to trigger follow-up", "error");
        return;
      }
      toast(`Follow-up queued via ${channelLabel(channel)}`, "success");
      onSuccess(contact.id);
    } catch {
      toast("An unexpected error occurred", "error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
      {/* Channel selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
          Send via
        </label>
        <div className="flex flex-wrap gap-2">
          {CHANNEL_SEQUENCE.map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setChannel(ch)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                channel === ch
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-600 border-gray-200 hover:border-blue-300"
              }`}
            >
              {channelLabel(ch)}
            </button>
          ))}
        </div>
      </div>

      {/* Message editor */}
      <div>
        <label className="text-sm font-medium text-gray-700 block mb-1">Message</label>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full text-sm border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Type your follow-up message..."
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={sending}>
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleSend}
          loading={sending}
          disabled={sending || !message.trim()}
        >
          Send Follow-Up
        </Button>
      </div>
    </div>
  );
}

// ── Stalled Contact Row ────────────────────────────────────────────────────────

interface ContactRowProps {
  contact: StalledContact;
  onTriggered: (contactId: string) => void;
}

function ContactRow({ contact, onTriggered }: ContactRowProps) {
  const [expanded, setExpanded] = useState(false);
  const days = daysAgo(contact.last_interaction_at);
  const suggested = nextChannel(contact.last_channel);

  return (
    <div className="border border-gray-100 rounded-lg p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        {/* Contact info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-gray-900 truncate">
            {contact.name ?? "Unnamed Contact"}
          </p>
          <p className="text-sm text-gray-500 mt-0.5">
            {contact.email ?? contact.phone ?? "No contact info"}
          </p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm flex-shrink-0">
          <div className="text-center">
            <p className="font-semibold text-red-600">{days === 999 ? "Never" : `${days}d ago`}</p>
            <p className="text-xs text-gray-400">Last contact</p>
          </div>
          <div className="text-center">
            <p className="font-medium text-gray-700">{channelLabel(contact.last_channel)}</p>
            <p className="text-xs text-gray-400">Last channel</p>
          </div>
          <div className="text-center">
            <p className="font-medium text-blue-600">{channelLabel(suggested)}</p>
            <p className="text-xs text-gray-400">Suggested</p>
          </div>
        </div>

        {/* CTA */}
        <Button
          type="button"
          variant={expanded ? "outline" : "primary"}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "Dismiss" : "Send Follow-Up"}
        </Button>
      </div>

      {expanded && (
        <FollowUpForm
          contact={contact}
          onSuccess={(id) => {
            setExpanded(false);
            onTriggered(id);
          }}
          onCancel={() => setExpanded(false)}
        />
      )}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function AutomationSettingsPage() {
  const [data, setData] = useState<WaterfallData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track triggered contacts so we can remove them from list
  const [triggered, setTriggered] = useState<Set<string>>(new Set());

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/automation/waterfall");
        if (!res.ok) {
          const json = await res.json().catch(() => ({}));
          setError((json as { error?: string }).error ?? "Failed to load data");
          return;
        }
        const json = await res.json();
        setData(json.data as WaterfallData);
      } catch {
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function handleTriggered(contactId: string) {
    setTriggered((prev) => new Set([...prev, contactId]));
  }

  const visibleContacts = (data?.stalled ?? []).filter((c) => !triggered.has(c.id));

  return (
    <div className="max-w-3xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Follow-Up Automation</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage automated follow-up sequences and act on stalled leads
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Waterfall Sequence Config */}
      <Card>
        <CardHeader>
          <CardTitle>Follow-Up Waterfall</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Automatically alert you when leads go quiet and suggest the next channel to try.
            When a contact has not responded for{" "}
            <span className="font-semibold text-gray-900">
              {data?.settings.staleDays ?? 3} days
            </span>
            , they appear below.
          </p>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
              Configured sequence
            </p>
            <WaterfallSequence />
          </div>
        </CardContent>
      </Card>

      {/* Stalled Contacts */}
      <Card>
        <CardHeader>
          <CardTitle>
            Stalled Contacts
            {!loading && data && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({visibleContacts.length} requiring attention)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full rounded-lg" />
              ))}
            </div>
          ) : visibleContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <p className="font-medium text-gray-900">All caught up!</p>
              <p className="text-sm text-gray-500 mt-1">
                No stalled contacts at the moment. Check back later.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {visibleContacts.map((contact) => (
                <ContactRow
                  key={contact.id}
                  contact={contact}
                  onTriggered={handleTriggered}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
