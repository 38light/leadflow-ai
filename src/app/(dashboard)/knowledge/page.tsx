"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { BookOpen, Plus } from "lucide-react";
import type { KnowledgeBase } from "@/types";

export default function KnowledgePage() {
  const { toast } = useToast();
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchKBs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/knowledge-bases");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setKnowledgeBases(json.data ?? []);
    } catch {
      setKnowledgeBases([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKBs();
  }, [fetchKBs]);

  async function handleCreate() {
    if (!form.name.trim()) {
      setFormError("Name is required");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/knowledge-bases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim() || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error ?? "Failed to create knowledge base");
        return;
      }
      setKnowledgeBases((prev) => [json.data, ...prev]);
      setCreateOpen(false);
      setForm({ name: "", description: "" });
      toast("Knowledge base created", "success");
    } catch {
      setFormError("Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  function openCreate() {
    setForm({ name: "", description: "" });
    setFormError("");
    setCreateOpen(true);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Knowledge Base</h1>
          <p className="text-sm text-gray-500">
            {knowledgeBases.length} knowledge base
            {knowledgeBases.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          Create Knowledge Base
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-lg p-6 space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-16 rounded-full mt-4" />
            </div>
          ))}
        </div>
      ) : knowledgeBases.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {knowledgeBases.map((kb) => (
            <Link
              key={kb.id}
              href={`/knowledge/${kb.id}`}
              className="bg-white border rounded-lg p-6 hover:shadow-md hover:border-gray-300 transition-all block"
            >
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold truncate">{kb.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                    {kb.description ?? "No description"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    kb.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {kb.is_active ? "Active" : "Inactive"}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(kb.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<BookOpen className="h-10 w-10" />}
          title="No knowledge bases yet"
          description="Upload documents to help your AI assistant answer questions."
          action={
            <Button onClick={openCreate} size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              Create Knowledge Base
            </Button>
          }
        />
      )}

      {/* Create Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create Knowledge Base"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Product FAQ"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="What is this knowledge base about?"
              rows={3}
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
            />
          </div>
          {formError && (
            <p className="text-sm text-red-600">{formError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCreateOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button size="sm" loading={saving} onClick={handleCreate}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
