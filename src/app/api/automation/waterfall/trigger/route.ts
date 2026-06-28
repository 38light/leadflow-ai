import { NextRequest, NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";

interface TriggerBody {
  contactId: string;
  nextChannel: string;
  message: string;
}

function isValidBody(body: unknown): body is TriggerBody {
  if (typeof body !== "object" || body === null) return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.contactId === "string" &&
    b.contactId.length > 0 &&
    typeof b.nextChannel === "string" &&
    b.nextChannel.length > 0 &&
    typeof b.message === "string" &&
    b.message.length > 0
  );
}

export async function POST(req: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidBody(body)) {
    return NextResponse.json(
      { error: "Body must include contactId (string), nextChannel (string), and message (string)" },
      { status: 400 }
    );
  }

  const { contactId, nextChannel, message } = body;
  const supabase = await createServerClient();
  const ownerId = ctx.ownerId;

  // Verify the contact belongs to this owner to prevent IDOR
  const { data: contact, error: contactError } = await supabase
    .from("contacts")
    .select("id, name")
    .eq("id", contactId)
    .eq("user_id", ownerId)
    .single();

  if (contactError || !contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  // Insert a follow-up notification record via the service-role client (user_id
  // is the owner, which differs from auth.uid() for a team member).
  const { error: notifError } = await createAdminClient()
    .from("notifications")
    .insert({
      user_id: ownerId,
      type: "follow_up_waterfall",
      title: `Follow-up queued for ${contact.name ?? "contact"}`,
      body: `Send via ${nextChannel}: ${message.slice(0, 120)}${message.length > 120 ? "…" : ""}`,
      link: `/contacts/${contactId}`,
      read: false,
    });

  if (notifError) {
    console.error("[POST /api/automation/waterfall/trigger] insert notification:", notifError);
    return NextResponse.json({ error: "Failed to create follow-up record" }, { status: 500 });
  }

  // Update contact's last_interaction_at to now
  const { error: updateError } = await supabase
    .from("contacts")
    .update({ last_interaction_at: new Date().toISOString() })
    .eq("id", contactId)
    .eq("user_id", ownerId);

  if (updateError) {
    console.error("[POST /api/automation/waterfall/trigger] update contact:", updateError);
    // Non-fatal: notification already created
  }

  return NextResponse.json({ data: { triggered: true } });
}
