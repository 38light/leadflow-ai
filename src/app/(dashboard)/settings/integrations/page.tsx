"use client";

import { useEffect, useState } from "react";
import {
  Bot,
  MessageSquare,
  Mail,
  CreditCard,
  Facebook,
  Phone,
} from "lucide-react";
import { IntegrationCard } from "@/components/settings/integration-card";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { LucideIcon } from "lucide-react";

interface Integration {
  key: string;
  name: string;
  description: string;
  icon: string | LucideIcon;
  apiKeyLabel: string;
  apiKeyPlaceholder: string;
}

const INTEGRATIONS: Integration[] = [
  {
    key: "anthropic_api_key",
    name: "Anthropic (Claude AI)",
    description: "Powers all AI responses, deal diagnosis, and lead scoring in this platform",
    icon: Bot,
    apiKeyLabel: "Anthropic API Key",
    apiKeyPlaceholder: "sk-ant-api03-...",
  },
  {
    key: "vapi_api_key",
    name: "VAPI (Voice AI)",
    description: "AI-powered voice and conversation automation",
    icon: Bot,
    apiKeyLabel: "VAPI API Key",
    apiKeyPlaceholder: "vapi_...",
  },
  {
    key: "twilio_account_sid",
    name: "Twilio (SMS)",
    description: "Send and receive SMS messages with leads",
    icon: Phone,
    apiKeyLabel: "Twilio Account SID",
    apiKeyPlaceholder: "ACxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  },
  {
    key: "sendgrid",
    name: "SendGrid (Email)",
    description: "Transactional and marketing email delivery",
    icon: Mail,
    apiKeyLabel: "SendGrid API Key",
    apiKeyPlaceholder: "SG.xxxxxxxxxxxx",
  },
  {
    key: "stripe",
    name: "Stripe (Payments)",
    description: "Accept payments and manage subscriptions",
    icon: CreditCard,
    apiKeyLabel: "Stripe Secret Key",
    apiKeyPlaceholder: "sk_live_...",
  },
  {
    key: "meta_page_id",
    name: "Facebook (Messenger)",
    description: "Connect your Facebook page to manage leads via Messenger",
    icon: Facebook,
    apiKeyLabel: "Meta Page ID",
    apiKeyPlaceholder: "1234567890",
  },
  {
    key: "meta_access_token",
    name: "WhatsApp",
    description: "Send and receive WhatsApp messages via Meta",
    icon: MessageSquare,
    apiKeyLabel: "WhatsApp Access Token",
    apiKeyPlaceholder: "EAA...",
  },
];

// Map integration keys to API payload field names
const KEY_TO_FIELD: Record<string, string> = {
  anthropic_api_key: "anthropic_api_key",
  vapi_api_key: "vapi_api_key",
  twilio_account_sid: "twilio_account_sid",
  sendgrid: "sendgrid_api_key",
  stripe: "stripe_secret_key",
  meta_page_id: "meta_page_id",
  meta_access_token: "meta_access_token",
};

// Integration key → GET/PUT response status key
const KEY_TO_STATUS_KEY: Record<string, string> = {
  anthropic_api_key: "anthropic",
  vapi_api_key: "vapi",
  twilio_account_sid: "twilio",
  sendgrid: "sendgrid",
  stripe: "stripe",
  meta_page_id: "meta",
  meta_access_token: "whatsapp",
};

type ConnectedMap = Record<string, boolean>;

interface StatusResponse {
  data: Record<string, { connected: boolean }>;
}

export default function IntegrationsSettingsPage() {
  const { toast } = useToast();

  const [connected, setConnected] = useState<ConnectedMap>({});
  const [activeIntegration, setActiveIntegration] = useState<Integration | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings/integrations");
        if (!res.ok) return;
        const json = (await res.json()) as StatusResponse;
        if (cancelled) return;
        const map: ConnectedMap = {};
        for (const [statusKey, value] of Object.entries(json.data)) {
          map[statusKey] = !!value?.connected;
        }
        setConnected(map);
      } catch {
        // silently fail — cards just show as not connected
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function openModal(integration: Integration) {
    setActiveIntegration(integration);
    setApiKeyValue("");
  }

  function closeModal() {
    setActiveIntegration(null);
    setApiKeyValue("");
  }

  async function handleSave() {
    if (!activeIntegration) return;
    setSaving(true);

    const field = KEY_TO_FIELD[activeIntegration.key] ?? activeIntegration.key;
    const payload: Record<string, string | null> = {
      [field]: apiKeyValue.trim() || null,
    };

    try {
      const res = await fetch("/api/settings/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        toast(json.error ?? "Failed to save integration", "error");
      } else {
        const statusKey = KEY_TO_STATUS_KEY[activeIntegration.key];
        setConnected((prev) => ({
          ...prev,
          [statusKey]: !!apiKeyValue.trim(),
        }));
        toast(`${activeIntegration.name} ${apiKeyValue.trim() ? "connected" : "disconnected"}`, "success");
        closeModal();
      }
    } catch {
      toast("An unexpected error occurred", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Integrations</h1>
      <div className="space-y-3">
        {INTEGRATIONS.map((integration) => {
          const statusKey = KEY_TO_STATUS_KEY[integration.key];
          const isConnected = connected[statusKey] ?? false;

          return (
            <IntegrationCard
              key={integration.key}
              name={integration.name}
              description={integration.description}
              icon={integration.icon}
              isConnected={isConnected}
              onConfigure={() => openModal(integration)}
            />
          );
        })}
      </div>

      {/* Configure Modal */}
      <Modal
        open={activeIntegration !== null}
        onClose={closeModal}
        title={`Configure ${activeIntegration?.name ?? ""}`}
        size="md"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            {activeIntegration?.description}. Enter your API key or credentials below.
          </p>
          <Input
            id="api_key_input"
            label={activeIntegration?.apiKeyLabel ?? "API Key"}
            value={apiKeyValue}
            onChange={(e) => setApiKeyValue(e.target.value)}
            placeholder={activeIntegration?.apiKeyPlaceholder ?? ""}
            autoComplete="off"
          />
          <p className="text-xs text-gray-400">
            Leave blank and save to disconnect this integration.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={closeModal} disabled={saving}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} loading={saving} disabled={saving}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
