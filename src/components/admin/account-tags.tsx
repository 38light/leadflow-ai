"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";

const TAG_COLORS: Record<string, string> = {
  enterprise: "bg-yellow-100 text-yellow-800",
  vip: "bg-purple-100 text-purple-800",
  "at-risk": "bg-red-100 text-red-800",
  churned: "bg-gray-100 text-gray-700",
  "beta-user": "bg-blue-100 text-blue-800",
  partner: "bg-green-100 text-green-800",
};

const ALL_TAGS = ["enterprise", "vip", "at-risk", "churned", "beta-user", "partner"] as const;
type TagValue = (typeof ALL_TAGS)[number];

interface AccountTag {
  id: string;
  user_id: string;
  tag: string;
  created_at: string;
}

interface AccountTagsProps {
  userId: string;
}

export function AccountTags({ userId }: AccountTagsProps) {
  const [tags, setTags] = useState<AccountTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [addingTag, setAddingTag] = useState<string | null>(null);
  const [removingTag, setRemovingTag] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}/tags`);
      if (!res.ok) throw new Error("Failed to load tags");
      const { data } = await res.json();
      setTags(data ?? []);
    } catch {
      toast("Failed to load tags", "error");
    } finally {
      setLoading(false);
    }
  }, [userId, toast]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  async function handleAddTag(tag: TagValue) {
    setDropdownOpen(false);
    setAddingTag(tag);
    try {
      const res = await fetch(`/api/admin/users/${userId}/tags`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag }),
      });
      if (res.status === 409) {
        toast("Tag already exists", "info");
        return;
      }
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to add tag");
      }
      const { data } = await res.json();
      setTags((prev) => [...prev, data]);
      toast(`Tag "${tag}" added`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to add tag", "error");
    } finally {
      setAddingTag(null);
    }
  }

  async function handleRemoveTag(tag: string) {
    setRemovingTag(tag);
    try {
      const res = await fetch(
        `/api/admin/users/${userId}/tags?tag=${encodeURIComponent(tag)}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error ?? "Failed to remove tag");
      }
      setTags((prev) => prev.filter((t) => t.tag !== tag));
      toast(`Tag "${tag}" removed`, "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to remove tag", "error");
    } finally {
      setRemovingTag(null);
    }
  }

  const existingTagValues = new Set(tags.map((t) => t.tag));
  const availableTags = ALL_TAGS.filter((t) => !existingTagValues.has(t));

  if (loading) {
    return (
      <div className="flex gap-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((t) => (
        <span
          key={t.id}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${TAG_COLORS[t.tag] ?? "bg-gray-100 text-gray-700"}`}
        >
          {t.tag}
          <button
            onClick={() => handleRemoveTag(t.tag)}
            disabled={removingTag === t.tag}
            className="ml-0.5 rounded-full hover:opacity-70 disabled:cursor-not-allowed transition-opacity"
            aria-label={`Remove tag ${t.tag}`}
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {/* Add tag button + dropdown */}
      {availableTags.length > 0 && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            disabled={addingTag !== null}
            className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 disabled:cursor-not-allowed transition-colors"
            aria-label="Add tag"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>

          {dropdownOpen && (
            <div className="absolute left-0 top-8 z-20 w-40 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
              {availableTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleAddTag(tag)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-gray-50 transition-colors"
                >
                  <span
                    className={`inline-block h-2 w-2 rounded-full ${TAG_COLORS[tag]?.split(" ")[0] ?? "bg-gray-200"}`}
                  />
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tags.length === 0 && availableTags.length === 0 && (
        <span className="text-xs text-gray-400">No tags</span>
      )}
    </div>
  );
}
