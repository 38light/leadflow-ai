"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toggle } from "@/components/ui/toggle";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface SlackConfig {
  connected: boolean;
  webhook_url: string;
  slack_notify_hot_leads: boolean;
  slack_notify_bookings: boolean;
}

export default function SlackSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const [webhookUrl, setWebhookUrl] = useState("");
  const [notifyHot, setNotifyHot] = useState(true);
  const [notifyBookings, setNotifyBookings] = useState(true);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/settings/slack");
      if (res.ok) {
        const json = await res.json();
        const data = json.data as SlackConfig;
        setWebhookUrl(data.webhook_url ?? "");
        setNotifyHot(data.slack_notify_hot_leads);
        setNotifyBookings(data.slack_notify_bookings);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  async function handleSave(opts: { test?: boolean } = {}) {
    setError("");
    setStatus(null);
    if (opts.test) setTesting(true);
    else setSaving(true);

    try {
      const res = await fetch("/api/settings/slack", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slack_webhook_url: webhookUrl.trim(),
          slack_notify_hot_leads: notifyHot,
          slack_notify_bookings: notifyBookings,
          test: opts.test ?? false,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to save settings.");
        return;
      }
      if (opts.test) {
        setStatus(
          json.data?.test?.sent
            ? "Test message sent successfully."
            : "Could not send test message — check your webhook URL."
        );
      } else {
        setStatus("Saved.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Slack Notifications</h1>
        <p className="text-sm text-gray-500 mt-1">
          Pipe key events into a Slack channel via an incoming webhook.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Webhook URL</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-sm text-gray-400">Loading...</div>
          ) : (
            <>
              <Input
                label="Slack Incoming Webhook URL"
                id="slack-webhook"
                type="url"
                placeholder="https://hooks.slack.com/services/T000/B000/xxxxxxxx"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                Create one in Slack under{" "}
                <span className="font-medium">Apps</span> &rarr;{" "}
                <span className="font-medium">Incoming Webhooks</span>, pick a
                channel, then paste the URL here.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start justify-between gap-6">
            <div>
              <p className="text-sm font-medium text-gray-900">Hot leads</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Notify when a new contact is captured with temperature = hot.
              </p>
            </div>
            <Toggle checked={notifyHot} onChange={setNotifyHot} />
          </div>
          <div className="flex items-start justify-between gap-6 border-t border-gray-100 pt-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Bookings</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Notify when a booking is created or marked completed.
              </p>
            </div>
            <Toggle checked={notifyBookings} onChange={setNotifyBookings} />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {status && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
          {status}
        </div>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={() => handleSave()} loading={saving}>
          Save Settings
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSave({ test: true })}
          loading={testing}
          disabled={!webhookUrl.trim()}
        >
          Send Test Message
        </Button>
      </div>
    </div>
  );
}
