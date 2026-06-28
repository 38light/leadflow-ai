"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, UserPlus, Mail, Trash2, ChevronDown, Clock, Shield, Eye, Edit } from "lucide-react";

interface TeamMember {
  id: string;
  owner_id: string;
  member_user_id: string;
  role: string;
  member_name: string | null;
  created_at: string;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
}

const roleLabels: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  admin: { label: "Admin", icon: Shield, color: "bg-purple-100 text-purple-700" },
  member: { label: "Member", icon: Edit, color: "bg-blue-100 text-blue-700" },
  viewer: { label: "Viewer", icon: Eye, color: "bg-gray-100 text-gray-700" },
};

export default function TeamSettingsPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadTeam = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/team");
    if (res.ok) {
      const { data } = await res.json();
      setMembers(data.members);
      setInvitations(data.invitations);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadTeam(); }, [loadTeam]);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setSending(true);
    setError(null);
    setSuccess(null);

    const res = await fetch("/api/team", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });

    if (res.ok) {
      setSuccess(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      loadTeam();
    } else {
      const { error: msg } = await res.json();
      setError(msg ?? "Failed to send invitation");
    }
    setSending(false);
  }

  async function handleRemove(id: string, type: "member" | "invitation") {
    if (!confirm(`Remove this ${type}?`)) return;
    const res = await fetch(`/api/team/${id}`, { method: "DELETE" });
    if (res.ok) loadTeam();
  }

  async function handleRoleChange(id: string, newRole: string) {
    const res = await fetch(`/api/team/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) loadTeam();
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
            <Users className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Team Management</h1>
            <p className="text-sm text-gray-500">Invite team members and manage their access</p>
          </div>
        </div>
      </div>

      {/* Role Legend */}
      <div className="mb-6 flex flex-wrap gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-medium text-gray-700">Roles:</div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Shield className="h-3.5 w-3.5 text-purple-600" />
            <span className="font-medium">Admin</span> — Full access, can invite & manage team
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Edit className="h-3.5 w-3.5 text-blue-600" />
            <span className="font-medium">Member</span> — Can manage contacts & conversations
          </div>
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Eye className="h-3.5 w-3.5 text-gray-600" />
            <span className="font-medium">Viewer</span> — Read-only access
          </div>
        </div>
      </div>

      {/* Invite Form */}
      <div className="mb-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <UserPlus className="h-5 w-5 text-blue-600" />
          Invite Team Member
        </h2>
        <form onSubmit={handleInvite} className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex-1">
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="colleague@example.com"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="w-full sm:w-40">
            <label htmlFor="role" className="mb-1.5 block text-sm font-medium text-gray-700">
              Role
            </label>
            <div className="relative">
              <select
                id="role"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full appearance-none rounded-lg border border-gray-300 bg-white px-3 py-2 pr-8 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="admin">Admin</option>
                <option value="member">Member</option>
                <option value="viewer">Viewer</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>
          </div>
          <button
            type="submit"
            disabled={sending}
            className="rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-5 py-2 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {sending ? "Sending..." : "Send Invite"}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        {success && <p className="mt-3 text-sm text-green-600">{success}</p>}
      </div>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <div className="mb-8 rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-4">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Mail className="h-5 w-5 text-orange-500" />
              Pending Invitations
            </h2>
          </div>
          <div className="divide-y divide-gray-100">
            {invitations.map((inv) => {
              const role = roleLabels[inv.role] ?? roleLabels.member;
              return (
                <div key={inv.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                      <Mail className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{inv.email}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        Expires {new Date(inv.expires_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${role.color}`}>
                      {role.label}
                    </span>
                    <button
                      onClick={() => handleRemove(inv.id, "invitation")}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Team Members */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <Users className="h-5 w-5 text-blue-600" />
            Team Members
          </h2>
          <p className="text-sm text-gray-500">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-400">Loading...</div>
        ) : members.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm font-medium text-gray-500">No team members yet</p>
            <p className="mt-1 text-sm text-gray-400">Invite your first team member above</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {members.map((m) => {
              const role = roleLabels[m.role] ?? roleLabels.member;
              return (
                <div key={m.id} className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-sm font-bold">
                      {(m.member_name ?? "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {m.member_name ?? "Unnamed User"}
                      </p>
                      <p className="text-xs text-gray-500">
                        Joined {new Date(m.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        className={`appearance-none rounded-full border-0 py-0.5 pl-2.5 pr-7 text-xs font-medium ${role.color} cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <option value="admin">Admin</option>
                        <option value="member">Member</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2" />
                    </div>
                    <button
                      onClick={() => handleRemove(m.id, "member")}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
