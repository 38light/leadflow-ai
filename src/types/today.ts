export type FollowUpStatus = "pending" | "completed" | "cancelled";

export interface FollowUp {
  id: string;
  user_id: string;
  contact_id: string;
  title: string;
  due_at: string;
  assigned_to: string;
  status: FollowUpStatus;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  contact: { id: string; name: string | null; email: string | null; phone: string | null } | null;
}

export interface FollowUpAssignee {
  id: string;
  name: string;
}

export interface FollowUpsResponse {
  data: FollowUp[];
  assignees: FollowUpAssignee[];
  canEdit: boolean;
  currentUserId: string;
  total: number;
  limit: number;
  truncated: boolean;
}

export interface TodayReply {
  id: string;
  contactId: string;
  contactName: string;
  channel: string;
  lastMessageAt: string;
  preview: string;
}

export interface TodayApproval {
  id: string;
  contactName: string;
  contactId: string | null;
  conversationId: string | null;
  channel: string;
  draftContent: string;
  reasoning: string | null;
  createdAt: string;
}

export interface TodayBooking {
  id: string;
  contactId: string | null;
  clientName: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  status: "pending" | "confirmed";
}

export interface TodayData {
  timezone: string;
  businessDate: string;
  canEdit: boolean;
  currentUserId: string;
  assignees: FollowUpAssignee[];
  followUps: FollowUp[];
  approvals: TodayApproval[];
  needsReply: TodayReply[];
  bookings: TodayBooking[];
  completedToday: number;
  totals: { followUps: number; approvals: number; needsReply: number; bookings: number };
  /** Lists queues whose results are capped; the UI must show a notice. */
  truncated: Array<"followUps" | "approvals" | "needsReply" | "bookings">;
}
