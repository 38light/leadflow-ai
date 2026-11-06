import type { SupabaseClient } from "@supabase/supabase-js";
import type { AuthContext } from "@/lib/auth/get-user";
import type { FollowUp, FollowUpAssignee } from "@/types/today";

export const FOLLOW_UP_LIMIT = 200;
export const FOLLOW_UP_SELECT = "id,user_id,contact_id,title,due_at,assigned_to,status,completed_at,created_at,updated_at,contact:contacts!follow_ups_contact_tenant_fk(id,name,email,phone)";

export function canEditFollowUps(ctx: Pick<AuthContext, "isOwner" | "teamRole">): boolean {
  return ctx.isOwner || ctx.teamRole === "admin" || ctx.teamRole === "member";
}

export async function getAssignees(supabase: SupabaseClient, ownerId: string, currentUserId: string): Promise<FollowUpAssignee[]> {
  const { data, error } = await supabase.rpc("follow_up_assignees", { p_owner_id: ownerId });
  if (error) throw error;
  return (data ?? []).map((assignee: FollowUpAssignee) => ({
    id: assignee.id,
    name: `${assignee.name}${assignee.id === currentUserId ? " (you)" : ""}`,
  }));
}

export async function listFollowUps(supabase: SupabaseClient, ownerId: string, filters: { contact_id?: string; status: "pending" | "completed" | "all" }) {
  let query = supabase.from("follow_ups").select(FOLLOW_UP_SELECT, { count: "exact" })
    .eq("user_id", ownerId).order("due_at", { ascending: true }).order("id").limit(FOLLOW_UP_LIMIT);
  if (filters.contact_id) query = query.eq("contact_id", filters.contact_id);
  if (filters.status !== "all") query = query.eq("status", filters.status);
  const { data, error, count } = await query;
  if (error) throw error;
  return { data: (data ?? []) as unknown as FollowUp[], total: count ?? 0, limit: FOLLOW_UP_LIMIT, truncated: (count ?? 0) > FOLLOW_UP_LIMIT };
}

export async function validateFollowUpRelations(supabase: SupabaseClient, ownerId: string, contactId?: string, assignedTo?: string): Promise<string | null> {
  if (contactId) {
    const { data, error } = await supabase.from("contacts").select("id")
      .eq("user_id", ownerId).eq("id", contactId).maybeSingle();
    if (error) throw error;
    if (!data) return "Choose a contact in this workspace";
  }
  if (assignedTo && assignedTo !== ownerId) {
    const { data, error } = await supabase.rpc("follow_up_assignees", { p_owner_id: ownerId });
    if (error) throw error;
    if (!(data ?? []).some((assignee: FollowUpAssignee) => assignee.id === assignedTo)) {
      return "Choose an owner or team member with editing access";
    }
  }
  return null;
}

export function mutationDatabaseError(error: { code?: string }): { message: string; status: number } {
  if (error.code === "23503" || error.code === "23514") {
    return { message: "The contact or assignee is no longer available. Refresh and try again.", status: 409 };
  }
  if (error.code === "42501") return { message: "You do not have permission to change this follow-up", status: 403 };
  return { message: "Could not save the follow-up. Please try again.", status: 500 };
}
