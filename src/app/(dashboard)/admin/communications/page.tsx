"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Mail, Megaphone, Bell, ChevronLeft, Loader2, Search } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import { ToastProvider, useToast } from "@/components/ui/toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface UserSearchResult {
  id: string;
  user_id: string;
  business_name: string | null;
  email?: string;
}

// ─── Inner component (needs ToastProvider in tree) ────────────────────────────

function CommunicationsPage() {
  const { toast } = useToast();

  // ── Section 1: Email a user ──────────────────────────────────────────────
  const [userSearch, setUserSearch] = useState("");
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!userSearch.trim() || selectedUser) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/admin/users?search=${encodeURIComponent(userSearch.trim())}&limit=10`
        );
        if (res.ok) {
          const { data } = await res.json();
          setSearchResults(data ?? []);
          setShowDropdown(true);
        }
      } catch {
        // ignore
      } finally {
        setSearchLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [userSearch, selectedUser]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelectUser(user: UserSearchResult) {
    setSelectedUser(user);
    setUserSearch(user.business_name ?? user.user_id);
    setShowDropdown(false);
    setSearchResults([]);
  }

  function handleClearUser() {
    setSelectedUser(null);
    setUserSearch("");
    setSearchResults([]);
    setShowDropdown(false);
  }

  async function handleSendEmail() {
    if (!selectedUser) {
      toast("Please select a user", "error");
      return;
    }
    if (!emailSubject.trim()) {
      toast("Subject is required", "error");
      return;
    }
    if (!emailBody.trim()) {
      toast("Message body is required", "error");
      return;
    }

    setEmailSending(true);
    try {
      const res = await fetch("/api/admin/communications/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser.user_id,
          subject: emailSubject.trim(),
          body: emailBody.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Failed to send email", "error");
        return;
      }

      if (data.warning) {
        toast(`Email queued (${data.warning})`, "warning");
      } else {
        toast("Email sent successfully", "success");
      }

      setEmailSubject("");
      setEmailBody("");
      handleClearUser();
    } catch {
      toast("An unexpected error occurred", "error");
    } finally {
      setEmailSending(false);
    }
  }

  // ── Section 2: Broadcast email ───────────────────────────────────────────
  const [broadcastSegment, setBroadcastSegment] = useState("all");
  const [broadcastSubject, setBroadcastSubject] = useState("");
  const [broadcastBody, setBroadcastBody] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);

  const segmentOptions = [
    { value: "all", label: "All Users" },
    { value: "free", label: "Free Plan Users" },
    { value: "paid", label: "Paid Users (Starter / Pro / Enterprise)" },
    { value: "inactive", label: "Inactive Users (AI disabled)" },
  ];

  const segmentLabel =
    segmentOptions.find((s) => s.value === broadcastSegment)?.label ?? broadcastSegment;

  function handleBroadcastClick() {
    if (!broadcastSubject.trim()) {
      toast("Subject is required", "error");
      return;
    }
    if (!broadcastBody.trim()) {
      toast("Message body is required", "error");
      return;
    }
    setShowBroadcastModal(true);
  }

  async function handleBroadcastConfirm() {
    setShowBroadcastModal(false);
    setBroadcastSending(true);

    try {
      const res = await fetch("/api/admin/communications/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          segment: broadcastSegment,
          subject: broadcastSubject.trim(),
          body: broadcastBody.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Broadcast failed", "error");
        return;
      }

      let message = `Broadcast sent to ${data.sent_count} user${data.sent_count !== 1 ? "s" : ""}`;
      if (data.warning) message += `. Note: ${data.warning}`;
      if (data.failed_count) message += `. ${data.failed_count} failed.`;

      toast(message, data.sent_count > 0 ? "success" : "warning");
      setBroadcastSubject("");
      setBroadcastBody("");
    } catch {
      toast("An unexpected error occurred", "error");
    } finally {
      setBroadcastSending(false);
    }
  }

  // ── Section 3: System announcement ──────────────────────────────────────
  const [announcementTitle, setAnnouncementTitle] = useState("");
  const [announcementBody, setAnnouncementBody] = useState("");
  const [announcementType, setAnnouncementType] = useState("info");
  const [announcementSending, setAnnouncementSending] = useState(false);

  const announcementTypeOptions = [
    { value: "info", label: "Info" },
    { value: "warning", label: "Warning" },
    { value: "maintenance", label: "Maintenance" },
  ];

  const handleSendAnnouncement = useCallback(async () => {
    if (!announcementTitle.trim()) {
      toast("Title is required", "error");
      return;
    }
    if (!announcementBody.trim()) {
      toast("Body is required", "error");
      return;
    }

    setAnnouncementSending(true);
    try {
      const res = await fetch("/api/admin/communications/announcement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: announcementTitle.trim(),
          body: announcementBody.trim(),
          type: announcementType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error ?? "Failed to send announcement", "error");
        return;
      }

      toast(
        `Announcement sent to ${data.sent_to} user${data.sent_to !== 1 ? "s" : ""}`,
        "success"
      );
      setAnnouncementTitle("");
      setAnnouncementBody("");
      setAnnouncementType("info");
    } catch {
      toast("An unexpected error occurred", "error");
    } finally {
      setAnnouncementSending(false);
    }
  }, [announcementTitle, announcementBody, announcementType, toast]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Admin
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Communications</h1>
            <p className="text-sm text-gray-500">Email users and send platform announcements</p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {/* ── Section 1: Email a User ────────────────────────────────────── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <Mail className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Email a User</h2>
              <p className="text-sm text-gray-500">Send a direct email to a specific user</p>
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            {/* User search */}
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Search User
              </label>
              <div ref={searchRef} className="relative">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => {
                      setUserSearch(e.target.value);
                      if (selectedUser) setSelectedUser(null);
                    }}
                    placeholder="Search by business name..."
                    className="block w-full rounded-lg border border-gray-300 py-2 pl-9 pr-10 text-sm placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  {searchLoading && (
                    <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-gray-400" />
                  )}
                  {selectedUser && (
                    <button
                      type="button"
                      onClick={handleClearUser}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      aria-label="Clear selected user"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Dropdown */}
                {showDropdown && searchResults.length > 0 && (
                  <ul className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
                    {searchResults.map((user) => (
                      <li key={user.id}>
                        <button
                          type="button"
                          onClick={() => handleSelectUser(user)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm hover:bg-gray-50"
                        >
                          <span className="font-medium text-gray-900">
                            {user.business_name ?? "Unnamed Business"}
                          </span>
                          <span className="text-xs text-gray-400 truncate">{user.user_id}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {showDropdown && !searchLoading && searchResults.length === 0 && userSearch.trim() && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500 shadow-lg">
                    No users found
                  </div>
                )}
              </div>
              {selectedUser && (
                <p className="text-xs text-green-600">
                  Selected: {selectedUser.business_name ?? "Unnamed Business"} ({selectedUser.user_id})
                </p>
              )}
            </div>

            <Input
              id="email-subject"
              label="Subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Your subject line..."
              maxLength={200}
            />

            <Textarea
              id="email-body"
              label="Message"
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              placeholder="Write your message here..."
              rows={5}
            />

            <Button
              onClick={handleSendEmail}
              loading={emailSending}
              disabled={emailSending || !selectedUser}
              className="w-full sm:w-auto"
            >
              <Mail className="mr-2 h-4 w-4" />
              Send Email
            </Button>
          </div>
        </section>

        {/* ── Section 2: Broadcast ──────────────────────────────────────── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50">
              <Megaphone className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Broadcast Email</h2>
              <p className="text-sm text-gray-500">
                Send an email to a segment of users (capped at 100 per call)
              </p>
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            <Select
              id="broadcast-segment"
              label="Target Segment"
              value={broadcastSegment}
              onChange={(e) => setBroadcastSegment(e.target.value)}
              options={segmentOptions}
            />

            <Input
              id="broadcast-subject"
              label="Subject"
              value={broadcastSubject}
              onChange={(e) => setBroadcastSubject(e.target.value)}
              placeholder="Your subject line..."
              maxLength={200}
            />

            <Textarea
              id="broadcast-body"
              label="Message"
              value={broadcastBody}
              onChange={(e) => setBroadcastBody(e.target.value)}
              placeholder="Write your broadcast message here..."
              rows={5}
            />

            <Button
              variant="primary"
              onClick={handleBroadcastClick}
              loading={broadcastSending}
              disabled={broadcastSending}
              className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
            >
              <Megaphone className="mr-2 h-4 w-4" />
              Send Broadcast
            </Button>
          </div>
        </section>

        {/* ── Section 3: System Announcement ───────────────────────────── */}
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
              <Bell className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">System Announcement</h2>
              <p className="text-sm text-gray-500">
                Send an in-app notification to all users&apos; notification panels
              </p>
            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            <Select
              id="announcement-type"
              label="Announcement Type"
              value={announcementType}
              onChange={(e) => setAnnouncementType(e.target.value)}
              options={announcementTypeOptions}
            />

            <Input
              id="announcement-title"
              label="Title"
              value={announcementTitle}
              onChange={(e) => setAnnouncementTitle(e.target.value)}
              placeholder="Announcement title..."
              maxLength={200}
            />

            <Textarea
              id="announcement-body"
              label="Body"
              value={announcementBody}
              onChange={(e) => setAnnouncementBody(e.target.value)}
              placeholder="Describe the announcement..."
              rows={4}
            />

            <Button
              onClick={handleSendAnnouncement}
              loading={announcementSending}
              disabled={announcementSending}
              className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700"
            >
              <Bell className="mr-2 h-4 w-4" />
              Send Announcement
            </Button>
          </div>
        </section>
      </div>

      {/* Broadcast confirmation modal */}
      <Modal
        open={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        title="Confirm Broadcast"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            You are about to send an email to{" "}
            <span className="font-semibold text-gray-900">{segmentLabel}</span>.
          </p>
          <p className="text-sm text-gray-500">
            Subject: <span className="font-medium text-gray-700">{broadcastSubject}</span>
          </p>
          <p className="text-xs text-gray-400">
            Broadcasts are capped at 100 users per call. A warning will be shown if more users
            exist in this segment.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowBroadcastModal(false)}>
              Cancel
            </Button>
            <Button
              className="bg-orange-600 hover:bg-orange-700"
              onClick={handleBroadcastConfirm}
            >
              Confirm &amp; Send
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Page export (wraps with ToastProvider) ────────────────────────────────────

export default function AdminCommunicationsPage() {
  return (
    <ToastProvider>
      <CommunicationsPage />
    </ToastProvider>
  );
}
