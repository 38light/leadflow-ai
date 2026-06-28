import { NextRequest, NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createAdminClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const DeleteBodySchema = z.object({
  user_id: z.string().uuid("user_id must be a valid UUID"),
  confirm: z.literal(true, { errorMap: () => ({ message: "confirm must be true" }) }),
});

// DELETE /api/admin/data/delete
// Deletes ALL user data (GDPR right-to-erasure)
// Deletes child records first, then parent records, then auth user
export async function DELETE(req: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = DeleteBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { user_id } = parsed.data;
  const adminClient = createAdminClient();

  // Verify user exists before deletion
  const { data: authUserData, error: authError } = await adminClient.auth.admin.getUserById(user_id);
  if (authError || !authUserData?.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const targetEmail = authUserData.user.email ?? user_id;

  const deleted: Record<string, number> = {};

  // Step 1: Delete messages (child of conversations)
  const { count: messagesCount } = await adminClient
    .from("messages")
    .delete({ count: "exact" })
    .eq("user_id", user_id);
  deleted.messages = messagesCount ?? 0;

  // Step 2: Delete conversations (child of contacts/channels)
  const { count: conversationsCount } = await adminClient
    .from("conversations")
    .delete({ count: "exact" })
    .eq("user_id", user_id);
  deleted.conversations = conversationsCount ?? 0;

  // Step 3: Delete contacts
  const { count: contactsCount } = await adminClient
    .from("contacts")
    .delete({ count: "exact" })
    .eq("user_id", user_id);
  deleted.contacts = contactsCount ?? 0;

  // Step 4: Delete bookings
  const { count: bookingsCount } = await adminClient
    .from("bookings")
    .delete({ count: "exact" })
    .eq("user_id", user_id);
  deleted.bookings = bookingsCount ?? 0;

  // Step 5: Delete knowledge documents (child of knowledge bases)
  const { count: docsCount } = await adminClient
    .from("knowledge_documents")
    .delete({ count: "exact" })
    .eq("user_id", user_id);
  deleted.knowledge_documents = docsCount ?? 0;

  // Step 6: Delete knowledge bases
  const { count: kbCount } = await adminClient
    .from("knowledge_bases")
    .delete({ count: "exact" })
    .eq("user_id", user_id);
  deleted.knowledge_bases = kbCount ?? 0;

  // Step 7: Delete notifications
  const { count: notifCount } = await adminClient
    .from("notifications")
    .delete({ count: "exact" })
    .eq("user_id", user_id);
  deleted.notifications = notifCount ?? 0;

  // Step 8: Delete profile
  await adminClient.from("profiles").delete().eq("user_id", user_id);

  // Step 9: Delete the auth user (point of no return)
  const { error: deleteAuthError } = await adminClient.auth.admin.deleteUser(user_id);
  if (deleteAuthError) {
    // Log partial deletion but return error since auth user still exists
    await logAuditEvent({
      actorId: ctx.user.id,
      actorEmail: ctx.user.email ?? undefined,
      action: "data.gdpr_delete",
      targetType: "user",
      targetId: user_id,
      targetLabel: targetEmail,
      metadata: { partial: true, error: deleteAuthError.message, deleted },
    });
    return NextResponse.json(
      { error: "Failed to delete auth user: " + deleteAuthError.message, partial_deleted: deleted },
      { status: 500 }
    );
  }

  // Log full deletion
  await logAuditEvent({
    actorId: ctx.user.id,
    actorEmail: ctx.user.email ?? undefined,
    action: "data.gdpr_delete",
    targetType: "user",
    targetId: user_id,
    targetLabel: targetEmail,
    metadata: { deleted },
  });

  return NextResponse.json({ success: true, deleted });
}
