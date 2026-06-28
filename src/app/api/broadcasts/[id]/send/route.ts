import { NextRequest, NextResponse } from "next/server";
import { createServerClient, createAdminClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = await createServerClient();

  // Fetch the broadcast and verify ownership
  const { data: broadcast, error: fetchError } = await supabase
    .from("broadcasts")
    .select("*")
    .eq("id", id)
    .eq("user_id", ctx.ownerId)
    .single();

  if (fetchError || !broadcast) {
    return NextResponse.json({ error: "Broadcast not found" }, { status: 404 });
  }

  if (broadcast.status !== "draft") {
    return NextResponse.json(
      { error: `Cannot send a broadcast with status '${broadcast.status}'` },
      { status: 400 }
    );
  }

  // Mark as sending
  const { error: sendingError } = await supabase
    .from("broadcasts")
    .update({ status: "sending", sent_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", ctx.ownerId);

  if (sendingError) {
    console.error("[broadcasts/send]", sendingError);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // Build the contact query applying segment filters, excluding opted-out
  let contactQuery = supabase
    .from("contacts")
    .select("id, name")
    .eq("user_id", ctx.ownerId)
    .eq("opted_out", false);

  if (broadcast.segment_status && broadcast.segment_status.length > 0) {
    contactQuery = contactQuery.in("status", broadcast.segment_status);
  }
  if (broadcast.segment_temperature && broadcast.segment_temperature.length > 0) {
    contactQuery = contactQuery.in("temperature", broadcast.segment_temperature);
  }
  if (broadcast.segment_source_channel && broadcast.segment_source_channel.length > 0) {
    contactQuery = contactQuery.in("source_channel", broadcast.segment_source_channel);
  }

  const { data: contacts, error: contactsError } = await contactQuery;

  if (contactsError) {
    // Roll back to draft on failure
    await supabase
      .from("broadcasts")
      .update({ status: "failed" })
      .eq("id", id)
      .eq("user_id", ctx.ownerId);
    console.error("[broadcasts/send]", contactsError);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const recipientCount = contacts?.length ?? 0;

  // Create one notification per recipient as a scaffold for real channel delivery
  if (recipientCount > 0) {
    const channelLabel =
      broadcast.channel_type === "whatsapp"
        ? "WhatsApp"
        : broadcast.channel_type === "sms"
        ? "SMS"
        : "Web Chat";

    const notifications = (contacts ?? []).map((contact) => ({
      user_id: ctx.ownerId,
      type: "broadcast" as const,
      title: `[${channelLabel}] ${broadcast.name}`,
      body: `To ${contact.name ?? "Contact"}: ${broadcast.message}`,
      link: `/contacts/${contact.id}`,
      read: false,
    }));

    // Insert via the service-role client: notifications.user_id is the owner,
    // which may differ from auth.uid() for a team member sending the broadcast.
    const adminClient = createAdminClient();
    for (let i = 0; i < notifications.length; i += 100) {
      const batch = notifications.slice(i, i + 100);
      await adminClient.from("notifications").insert(batch);
    }
  }

  // Update broadcast with final counts and status='sent'
  const { error: doneError } = await supabase
    .from("broadcasts")
    .update({
      status: "sent",
      sent_count: recipientCount,
      recipient_count: recipientCount,
      failed_count: 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", ctx.ownerId);

  if (doneError) {
    console.error("[broadcasts/send]", doneError);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data: { sent: recipientCount } });
}
