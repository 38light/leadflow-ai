"use client";

import { useState, useEffect, useCallback } from "react";
import { notFound } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { FileUp, Trash2, BookOpen } from "lucide-react";
import type { KnowledgeBase, KnowledgeDocument } from "@/types";

const DOC_STATUS_STYLES: Record<string, string> = {
  ready: "bg-green-100 text-green-800",
  processing: "bg-yellow-100 text-yellow-800",
  error: "bg-red-100 text-red-800",
  pending: "bg-gray-100 text-gray-800",
};

export default function KnowledgeBaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { toast } = useToast();

  const [kbId, setKbId] = useState<string | null>(null);
  const [knowledgeBase, setKnowledgeBase] = useState<KnowledgeBase | null>(
    null
  );
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFoundError, setNotFoundError] = useState(false);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [confirmDeleteDocId, setConfirmDeleteDocId] = useState<string | null>(
    null
  );

  // Resolve params
  useEffect(() => {
    params.then(({ id }) => setKbId(id));
  }, [params]);

  const fetchKB = useCallback(async () => {
    if (!kbId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/knowledge-bases/${kbId}`);
      if (res.status === 404) {
        setNotFoundError(true);
        return;
      }
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setKnowledgeBase(json.data);
    } catch {
      setNotFoundError(true);
    } finally {
      setLoading(false);
    }
  }, [kbId]);

  const fetchDocuments = useCallback(async () => {
    if (!kbId) return;
    try {
      const res = await fetch(`/api/knowledge-bases/${kbId}/documents`);
      if (!res.ok) return;
      const json = await res.json();
      setDocuments(json.data ?? []);
    } catch {
      // non-critical
    }
  }, [kbId]);

  useEffect(() => {
    fetchKB();
    fetchDocuments();
  }, [fetchKB, fetchDocuments]);

  if (notFoundError) notFound();

  async function handleUpload() {
    if (!kbId) return;
    if (!uploadTitle.trim()) {
      setUploadError("Title is required");
      return;
    }
    if (!uploadFile) {
      setUploadError("Please select a file");
      return;
    }
    setUploading(true);
    setUploadError("");
    try {
      const formData = new FormData();
      formData.append("title", uploadTitle.trim());
      formData.append("file", uploadFile);

      const res = await fetch(`/api/knowledge-bases/${kbId}/documents`, {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) {
        setUploadError(json.error ?? "Upload failed");
        return;
      }
      setDocuments((prev) => [json.data, ...prev]);
      setUploadOpen(false);
      setUploadTitle("");
      setUploadFile(null);
      toast("Document uploaded successfully", "success");
    } catch {
      setUploadError("Something went wrong");
    } finally {
      setUploading(false);
    }
  }

  async function handleDeleteDoc(docId: string) {
    if (!kbId) return;
    setDeletingDocId(docId);
    try {
      const res = await fetch(
        `/api/knowledge-bases/${kbId}/documents/${docId}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const json = await res.json();
        toast(json.error ?? "Failed to delete document", "error");
        return;
      }
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      toast("Document deleted", "success");
    } catch {
      toast("Something went wrong", "error");
    } finally {
      setDeletingDocId(null);
      setConfirmDeleteDocId(null);
    }
  }

  function openUpload() {
    setUploadTitle("");
    setUploadFile(null);
    setUploadError("");
    setUploadOpen(true);
  }

  if (loading) {
    return (
      <div className="max-w-4xl animate-pulse space-y-4">
        <div className="h-8 w-56 bg-gray-200 rounded" />
        <div className="h-4 w-40 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-200 rounded-lg mt-6" />
      </div>
    );
  }

  if (!knowledgeBase) return null;

  return (
    <div className="max-w-4xl">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600 shrink-0">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{knowledgeBase.name}</h1>
            {knowledgeBase.description && (
              <p className="text-gray-500 mt-1 text-sm">
                {knowledgeBase.description}
              </p>
            )}
          </div>
        </div>
        <Button size="sm" onClick={openUpload} className="shrink-0">
          <FileUp className="h-4 w-4 mr-1.5" />
          Upload Document
        </Button>
      </div>

      <div className="bg-white border rounded-lg">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Documents ({documents.length})</h2>
        </div>

        <div className="divide-y">
          {documents.map((doc) => (
            <div
              key={doc.id}
              className="px-6 py-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">{doc.title}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {doc.file_name ?? "—"} &middot; {doc.file_type ?? "—"}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    DOC_STATUS_STYLES[doc.status] ??
                    "bg-gray-100 text-gray-800"
                  }`}
                >
                  {doc.status}
                </span>
                {confirmDeleteDocId === doc.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-red-600">Delete?</span>
                    <Button
                      variant="danger"
                      size="sm"
                      loading={deletingDocId === doc.id}
                      onClick={() => handleDeleteDoc(doc.id)}
                    >
                      Yes
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setConfirmDeleteDocId(null)}
                    >
                      No
                    </Button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteDocId(doc.id)}
                    className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    aria-label="Delete document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
          {documents.length === 0 && (
            <div className="px-6 py-10 text-center text-gray-400 text-sm">
              No documents uploaded yet. Upload PDFs, text files, or documents
              to train your AI.
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      <Modal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        title="Upload Document"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={uploadTitle}
              onChange={(e) => setUploadTitle(e.target.value)}
              placeholder="e.g. Product Pricing Guide"
              className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept=".pdf,.txt,.md,.docx,.doc,.csv"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-gray-400">
              Supported: PDF, TXT, MD, DOCX, CSV
            </p>
          </div>
          {uploadError && (
            <p className="text-sm text-red-600">{uploadError}</p>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setUploadOpen(false)}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button size="sm" loading={uploading} onClick={handleUpload}>
              Upload
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
