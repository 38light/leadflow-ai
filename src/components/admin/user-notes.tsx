"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Plus, FileText } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminNote {
  id: string;
  target_user_id: string;
  author_id: string | null;
  author_email: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

interface UserNotesProps {
  userId: string;
}

function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function UserNotes({ userId }: UserNotesProps) {
  const [notes, setNotes] = useState<AdminNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/notes`);
      if (!res.ok) throw new Error("Failed to load notes");
      const { data } = await res.json();
      setNotes(data ?? []);
    } catch {
      toast("Failed to load notes", "error");
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  async function handleAddNote() {
    const content = newContent.trim();
    if (!content) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to add note");
      }
      const { data } = await res.json();
      setNotes((prev) => [data, ...prev]);
      setNewContent("");
      toast("Note added", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add note", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteNote(noteId: string) {
    if (!confirm("Delete this note?")) return;

    setDeletingId(noteId);
    try {
      const res = await fetch(`/api/admin/users/${userId}/notes?note_id=${noteId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to delete note");
      }
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
      toast("Note deleted", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to delete note", "error");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Add Note */}
      <div className="space-y-2">
        <textarea
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Add an internal note about this user..."
          rows={3}
          className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          onClick={handleAddNote}
          disabled={submitting || !newContent.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          <Plus className="h-4 w-4" />
          {submitting ? "Adding..." : "Add Note"}
        </button>
      </div>

      {/* Notes List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <FileText className="h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">No notes yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note.id} className="flex gap-3 group">
              {/* Avatar */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-700 text-xs font-semibold uppercase">
                {note.author_email ? note.author_email[0] : "A"}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      {note.author_email ?? "Unknown admin"}
                    </span>
                    <span className="text-xs text-gray-400">
                      {formatRelativeTime(note.created_at)}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    disabled={deletingId === note.id}
                    className="opacity-0 group-hover:opacity-100 rounded p-0.5 text-gray-400 hover:text-red-500 transition-all disabled:cursor-not-allowed"
                    aria-label="Delete note"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-600 whitespace-pre-wrap break-words">
                  {note.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
