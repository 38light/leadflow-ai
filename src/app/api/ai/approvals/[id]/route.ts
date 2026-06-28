import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { z } from "zod";

const actionSchema = z.object({
  action: z.enum(["approve", "reject"]),
  edited_content: z.string().min(1).max(10000).optional(),
});

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const idCheck = z.string().uuid().safeParse(id);
  if (!idCheck.success) {
    return NextResponse.json({ error: "Invalid approval id" }, { status: 400 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = actionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }
  const { action, edited_content } = parsed.data;

  const supabase = await createServerClient();

  // Fetch approval, scoped to the owner.
  const { data: approval, error: fetchError } = await supabase
    .from("ai_approvals")
    .select("id, user_id, conversation_id, contact_id, draft_content, status")
    .eq("id", id)
    .eq("user_id", ctx.ownerId)
    .single();

  if (fetchError || !approval) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }

  if (approval.status !== "pending") {
    return NextResponse.json(
      { error: `Approval already ${approval.status}` },
      { status: 409 }
    );
  }

  const nowIso = new Date().toISOString();

  if (action === "reject") {
    const { error: updateError } = await supabase
      .from("ai_approvals")
      .update({
        status: "rejected",
        approved_by: ctx.user.id,
        approved_at: nowIso,
      })
      .eq("id", id)
      .eq("user_id", ctx.ownerId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: { id, status: "rejected" } });
  }

  // Approve: send the message, then mark approved.
  const finalContent = (edited_content ?? approval.draft_content).trim();
  if (!finalContent) {
    return NextResponse.json({ error: "Empty message content" }, { status: 400 });
  }

  if (!approval.conversation_id || !approval.contact_id) {
    return NextResponse.json(
      { error: "Approval is not linked to a conversation/contact" },
      { status: 400 }
    );
  }

  // Look up channel_type from the conversation so the outbound message is consistent.
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("id, channel_type")
    .eq("id", approval.conversation_id)
    .eq("user_id", ctx.ownerId)
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  if (!conversation.channel_type) {
    return NextResponse.json(
      { error: "Conversation missing channel_type" },
      { status: 400 }
    );
  }

  // Atomicity: flip approval to 'approved' FIRST with an optimistic conditional
  // update (.eq('status', 'pending')) so a concurrent approve can't double-send.
  const { data: updatedRows, error: updateError } = await supabase
    .from("ai_approvals")
    .update({
      status: "approved",
      approved_by: ctx.user.id,
      approved_at: nowIso,
      draft_content: finalContent,
    })
    .eq("id", id)
    .eq("user_id", ctx.ownerId)
    .eq("status", "pending")
    .select("id");

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  if (!updatedRows || updatedRows.length === 0) {
    return NextResponse.json(
      { error: "Approval already processed" },
      { status: 409 }
    );
  }

  const { error: insertError } = await supabase.from("messages").insert({
    user_id: ctx.ownerId,
    conversation_id: approval.conversation_id,
    contact_id: approval.contact_id,
    direction: "outbound",
    sender_type: "ai",
    content: finalContent,
    content_type: "text",
    channel_type: conversation.channel_type,
    ai_model: "claude-sonnet-4-20250514",
    metadata: { approved_from: id, approved_by: ctx.user.id },
  });

  if (insertError) {
    console.error("[approvals] message insert failed, reverting approval", {
      approvalId: id,
      error: insertError.message,
    });
    // Best-effort rollback: revert the approval back to 'pending' so the user
    // can retry. Ignore errors here — we already know we're in a failure path.
    await supabase
      .from("ai_approvals")
      .update({
        status: "pending",
        approved_by: null,
        approved_at: null,
      })
      .eq("id", id)
      .eq("user_id", ctx.ownerId);

    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ data: { id, status: "approved" } });
}
