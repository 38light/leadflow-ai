import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { calculateLeadScore } from "@/lib/scoring/lead-score";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerClient();
  const { id } = await params;

  // Fetch the contact (must be owned by this user)
  const { data: contact, error: fetchError } = await supabase
    .from("contacts")
    .select("id, source_channel, temperature, status, email, phone, company")
    .eq("id", id)
    .eq("user_id", ctx.ownerId)
    .single();

  if (fetchError || !contact) {
    return NextResponse.json({ error: "Contact not found" }, { status: 404 });
  }

  const score = calculateLeadScore(contact);

  const { data: updated, error: updateError } = await supabase
    .from("contacts")
    .update({ score })
    .eq("id", id)
    .eq("user_id", ctx.ownerId)
    .select("id, score")
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: "Failed to update score" },
      { status: 500 }
    );
  }

  return NextResponse.json({ data: { score: updated.score } });
}
