"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Toggle } from "@/components/ui/toggle";
import { useToast } from "@/components/ui/toast";

const LANGUAGE_OPTIONS = [
  { value: "en", label: "English (en)" },
  { value: "es", label: "Spanish (es)" },
  { value: "fr", label: "French (fr)" },
  { value: "de", label: "German (de)" },
  { value: "pt", label: "Portuguese (pt)" },
  { value: "it", label: "Italian (it)" },
  { value: "nl", label: "Dutch (nl)" },
  { value: "zh", label: "Chinese (zh)" },
  { value: "ja", label: "Japanese (ja)" },
  { value: "ko", label: "Korean (ko)" },
  { value: "ar", label: "Arabic (ar)" },
  { value: "hi", label: "Hindi (hi)" },
];

export interface AIQualityFormData {
  ai_confidence_threshold: number;
  require_approval: boolean;
  ai_memory_depth: number;
  training_data_opt_out: boolean;
  default_language: string;
}

interface AIQualityFormProps {
  initialData: AIQualityFormData;
}

export function AIQualityForm({ initialData }: AIQualityFormProps) {
  const { toast } = useToast();
  const [threshold, setThreshold] = useState<number>(initialData.ai_confidence_threshold);
  const [requireApproval, setRequireApproval] = useState<boolean>(initialData.require_approval);
  const [memoryDepth, setMemoryDepth] = useState<number>(initialData.ai_memory_depth);
  const [trainingOptOut, setTrainingOptOut] = useState<boolean>(initialData.training_data_opt_out);
  const [language, setLanguage] = useState<string>(initialData.default_language);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/ai-quality", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ai_confidence_threshold: threshold,
          require_approval: requireApproval,
          ai_memory_depth: memoryDepth,
          training_data_opt_out: trainingOptOut,
          default_language: language,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "Failed to save settings", "error");
      } else {
        toast("AI quality settings saved", "success");
      }
    } catch {
      toast("Failed to save settings", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-6">
      {/* Confidence threshold */}
      <div className="space-y-2">
        <div className="flex items-baseline justify-between">
          <label htmlFor="threshold" className="block text-sm font-medium text-gray-700">
            Confidence threshold
          </label>
          <span className="text-sm font-mono text-gray-700">
            {Math.round(threshold * 100)}%
          </span>
        </div>
        <input
          id="threshold"
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={threshold}
          onChange={(e) => setThreshold(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
        <p className="text-xs text-gray-500">
          Drafts below this confidence go to the approval queue instead of sending automatically.
          Set to 0% to auto-send everything; set to 100% to approve every reply.
        </p>
      </div>

      {/* Require approval */}
      <div className="flex items-start justify-between gap-4 border-t pt-5">
        <div>
          <p className="text-sm font-medium text-gray-700">Require approval on every reply</p>
          <p className="text-xs text-gray-500 mt-1">
            Overrides the threshold — every AI draft is queued for human review.
          </p>
        </div>
        <Toggle checked={requireApproval} onChange={setRequireApproval} />
      </div>

      {/* Memory depth */}
      <div className="space-y-2 border-t pt-5">
        <Input
          id="memory_depth"
          type="number"
          label="Per-contact memory depth"
          min={0}
          max={10}
          value={memoryDepth}
          onChange={(e) => setMemoryDepth(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
        />
        <p className="text-xs text-gray-500">
          How many prior conversations from each contact the AI sees as context (0-10). Helps the
          AI avoid repeating itself.
        </p>
      </div>

      {/* Training opt-out */}
      <div className="flex items-start justify-between gap-4 border-t pt-5">
        <div>
          <p className="text-sm font-medium text-gray-700">Opt out of model training</p>
          <p className="text-xs text-gray-500 mt-1">
            When enabled, your conversations will not be used to improve future AI models.
          </p>
        </div>
        <Toggle checked={trainingOptOut} onChange={setTrainingOptOut} />
      </div>

      {/* Default language */}
      <div className="space-y-2 border-t pt-5">
        <Select
          id="default_language"
          label="Default language"
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          options={LANGUAGE_OPTIONS}
        />
        <p className="text-xs text-gray-500">
          Used as a fallback when the AI can&apos;t detect the contact&apos;s language with confidence.
        </p>
      </div>

      <div className="pt-2">
        <Button type="submit" loading={saving} disabled={saving}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
