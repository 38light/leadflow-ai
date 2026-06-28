import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { acceptInvitationSchema } from "@/lib/validators/team";

// POST /api/team/invitations/accept — accept a team invitation
export async function POST(request: Request) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let validated;
  try {
    validated = acceptInvitationSchema.parse(body);
  } catch {
    return NextResponse.json({ error: "Token is required" }, { status: 400 });
  }

  const supabase = await createServerClient();

  // Find the invitation by token
  const { data: invitation, error: findError } = await supabase
    .from("team_invitations")
    .select("*")
    .eq("token", validated.token)
    .eq("status", "pending")
    .single();

  if (findError || !invitation) {
    return NextResponse.json({ error: "Invalid or expired invitation" }, { status: 404 });
  }

  // Check email matches
  if (invitation.email !== ctx.user.email) {
    return NextResponse.json({ error: "This invitation is for a different email" }, { status: 403 });
  }

  // Check not expired
  if (new Date(invitation.expires_at) < new Date()) {
    await supabase
      .from("team_invitations")
      .update({ status: "expired" })
      .eq("id", invitation.id);
    return NextResponse.json({ error: "Invitation has expired" }, { status: 410 });
  }

  // Check not already a team member of this owner
  const { data: existingMember } = await supabase
    .from("team_members")
    .select("id")
    .eq("owner_id", invitation.owner_id)
    .eq("member_user_id", ctx.user.id)
    .single();

  if (existingMember) {
    return NextResponse.json({ error: "Already a team member" }, { status: 409 });
  }

  // Create team membership
  const { error: insertError } = await supabase
    .from("team_members")
    .insert({
      owner_id: invitation.owner_id,
      member_user_id: ctx.user.id,
      role: invitation.role,
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // Mark invitation as accepted
  await supabase
    .from("team_invitations")
    .update({ status: "accepted", accepted_at: new Date().toISOString() })
    .eq("id", invitation.id);

  return NextResponse.json({ data: { accepted: true, owner_id: invitation.owner_id } });
}
