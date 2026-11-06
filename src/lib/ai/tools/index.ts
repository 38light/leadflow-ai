import type { SupabaseClient } from "@supabase/supabase-js";

export interface ToolContext {
  userId: string;
  contactId: string;
  conversationId: string;
  supabase: SupabaseClient;
}

export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  context: ToolContext
): Promise<unknown> {
  switch (toolName) {
    case "check_calendar":
    case "book_appointment":
    case "generate_payment_link":
      await executeEscalateToHuman({ reason: "A team member must confirm availability, bookings and payment requests." }, context);
      return {
        success: false,
        requiresHuman: true,
        error: "This action is not connected. No availability was checked, no booking was created and no payment link was generated. A team member must complete the request. Do not claim success.",
      };
    case "update_contact":
      return executeUpdateContact(toolInput, context);
    case "search_knowledge":
      return executeSearchKnowledge(toolInput, context);
    case "escalate_to_human":
      return executeEscalateToHuman(toolInput, context);
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

async function executeUpdateContact(
  input: Record<string, unknown>,
  context: ToolContext
) {
  const field = input.field;
  const value = input.value;

  if (typeof field !== "string" || typeof value !== "string") {
    return { error: "Missing or invalid 'field' or 'value'" };
  }

  const { data: contact, error: fetchError } = await context.supabase
    .from("contacts")
    .select("metadata")
    .eq("id", context.contactId)
    .eq("user_id", context.userId)
    .single();

  if (fetchError || !contact) {
    return { error: "Contact not found" };
  }

  const existing = (contact.metadata && typeof contact.metadata === "object") ? contact.metadata as Record<string, unknown> : {};
  const metadata = { ...existing, [field]: value };

  const { error: updateError } = await context.supabase
    .from("contacts")
    .update({ metadata })
    .eq("id", context.contactId)
    .eq("user_id", context.userId);

  if (updateError) {
    return { error: "Failed to update contact" };
  }

  return { updated: true, field, value };
}

async function executeSearchKnowledge(
  input: Record<string, unknown>,
  _context: ToolContext
) {
  const query = input.query as string;

  // TODO: Phase 3 complete — integrate with real vector search
  // For now, return placeholder
  return {
    query,
    results: [],
    message: "Knowledge base search will be available once documents are uploaded and processed.",
  };
}

async function executeEscalateToHuman(
  input: Record<string, unknown>,
  context: ToolContext
) {
  const reason = typeof input.reason === "string" ? input.reason : "Escalation requested";

  // Turn off AI for this conversation
  const { error } = await context.supabase
    .from("conversations")
    .update({
      is_ai_active: false,
      ai_handoff_reason: reason,
      handoff_at: new Date().toISOString(),
    })
    .eq("id", context.conversationId)
    .eq("user_id", context.userId);

  if (error) {
    return { error: "Failed to escalate conversation" };
  }

  return {
    escalated: true,
    reason,
    message: "Conversation has been handed off to a human operator.",
  };
}
