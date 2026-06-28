import type { SupabaseClient } from "@supabase/supabase-js";

interface FindOrCreateContactParams {
  userId: string;
  supabase: SupabaseClient;
  name?: string;
  email?: string;
  phone?: string;
  sourceChannel: string;
  externalId?: string;
}

interface FindOrCreateContactResult {
  contactId: string;
  isNew: boolean;
}

/**
 * Find an existing contact by phone or email, or create a new one.
 * This is the central deduplication point for cross-channel contacts.
 * A visitor who messages via WhatsApp and then web chat becomes one contact.
 */
export async function findOrCreateContact(
  params: FindOrCreateContactParams
): Promise<FindOrCreateContactResult> {
  const { userId, supabase, name, email, phone, sourceChannel, externalId } = params;

  // 1. Dedup by phone (most reliable across channels)
  if (phone) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("user_id", userId)
      .eq("phone", phone)
      .maybeSingle();

    if (existing) {
      // Update name/email if we now have more info
      if (name || email) {
        await supabase
          .from("contacts")
          .update({
            ...(name ? { name } : {}),
            ...(email ? { email } : {}),
          })
          .eq("id", existing.id);
      }
      return { contactId: existing.id, isNew: false };
    }
  }

  // 2. Dedup by email
  if (email) {
    const { data: existing } = await supabase
      .from("contacts")
      .select("id")
      .eq("user_id", userId)
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      if (name || phone) {
        await supabase
          .from("contacts")
          .update({
            ...(name ? { name } : {}),
            ...(phone ? { phone } : {}),
          })
          .eq("id", existing.id);
      }
      return { contactId: existing.id, isNew: false };
    }
  }

  // 3. Create new contact
  const displayName =
    name ??
    (externalId ? `Web Visitor ${externalId.slice(0, 6).toUpperCase()}` : "Unknown Visitor");

  const { data, error } = await supabase
    .from("contacts")
    .insert({
      user_id: userId,
      name: displayName,
      email: email ?? null,
      phone: phone ?? null,
      status: "new",
      temperature: "cold",
      source_channel: sourceChannel,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`Failed to create contact: ${error?.message ?? "Unknown error"}`);
  }

  return { contactId: data.id, isNew: true };
}
