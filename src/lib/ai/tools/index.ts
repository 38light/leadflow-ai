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
      return executeCheckCalendar(toolInput);
    case "book_appointment":
      return executeBookAppointment(toolInput);
    case "generate_payment_link":
      return executeGeneratePaymentLink(toolInput);
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

async function executeCheckCalendar(input: Record<string, unknown>) {
  const date = input.date as string;
  // TODO: Phase 5 — integrate with real calendar API
  return {
    date,
    available: true,
    slots: [
      { time: "09:00", available: true },
      { time: "10:00", available: true },
      { time: "14:00", available: true },
      { time: "15:00", available: true },
    ],
  };
}

async function executeBookAppointment(input: Record<string, unknown>) {
  // TODO: Phase 5 — create real calendar event
  return {
    booked: true,
    date: input.date,
    time: input.start_time,
    title: input.title,
    confirmation: `Appointment booked for ${input.contact_name} on ${input.date} at ${input.start_time}.`,
  };
}

async function executeGeneratePaymentLink(input: Record<string, unknown>) {
  const amountAud = input.amount_aud as number;
  // TODO: Phase 5 — generate real Stripe payment link
  return {
    url: `${process.env.NEXT_PUBLIC_APP_URL}/pay/placeholder`,
    amount: amountAud,
    currency: "AUD",
    description: input.description,
  };
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
  context: ToolContext
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
