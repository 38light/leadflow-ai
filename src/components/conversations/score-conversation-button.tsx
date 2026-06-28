"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import type { ConversationQualityRubric } from "@/types";

interface ScoreConversationButtonProps {
  conversationId: string;
  initialRubric?: ConversationQualityRubric | null;
}

function scoreColor(score: number): string {
  if (score >= 4) return "bg-green-100 text-green-800";
  if (score >= 3) return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-800";
}

export function ScoreConversationButton({
  conversationId,
  initialRubric,
}: ScoreConversationButtonProps) {
  const { toast } = useToast();
  const [rubric, setRubric] = useState<ConversationQualityRubric | null>(
    initialRubric ?? null
  );
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  async function score() {
    setLoading(true);
    try {
      const res = await fetch("/api/ai/score-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversation_id: conversationId }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast(json.error ?? "Failed to score conversation", "error");
        return;
      }
      setRubric(json.data as ConversationQualityRubric);
      setOpen(true);
      toast("Conversation scored", "success");
    } catch {
      toast("Failed to score conversation", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        {rubric && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className={`text-xs px-2 py-1 rounded ${scoreColor(rubric.quality_score)}`}
          >
            Quality {rubric.quality_score}/5
          </button>
        )}
        <Button size="sm" variant="outline" onClick={score} loading={loading} disabled={loading}>
          {rubric ? "Re-score" : "Score conversation"}
        </Button>
      </div>

      {open && rubric && (
        <div className="bg-white border rounded-lg p-3 text-sm w-72 shadow-sm">
          <div className="grid grid-cols-2 gap-y-1 mb-2">
            <span className="text-gray-500">Resolved</span>
            <span>{rubric.resolved ? "Yes" : "No"}</span>
            <span className="text-gray-500">Booked</span>
            <span>{rubric.booked ? "Yes" : "No"}</span>
            <span className="text-gray-500">Escalated</span>
            <span>{rubric.escalated ? "Yes" : "No"}</span>
            <span className="text-gray-500">Final sentiment</span>
            <span className="capitalize">{rubric.sentiment_final}</span>
            <span className="text-gray-500">Quality</span>
            <span>{rubric.quality_score}/5</span>
          </div>
          {rubric.notes && (
            <p className="text-gray-700 border-t pt-2 mt-1">{rubric.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
