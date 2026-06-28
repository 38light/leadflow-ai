import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { inviteTeamMemberSchema } from "@/lib/validators/team";

// GET /api/team — list team members and pending invitations
export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isOwner && ctx.teamRole !== "admin") {
    return NextResponse.json({ error: "Only owners and admins can view team" }, { status: 403 });
  }

  const supabase = await createServerClient();
  const ownerId = ctx.ownerId;

  // Get team members with their auth email
  const { data: members, error: membersError } = await supabase
    .from("team_members")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: true });

  if (membersError) {
    return NextResponse.json({ error: membersError.message }, { status: 500 });
  }

  // Get pending invitations
  const { data: invitations, error: invError } = await supabase
    .from("team_invitations")
    .select("*")
    .eq("owner_id", ownerId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (invError) {
    return NextResponse.json({ error: invError.message }, { status: 500 });
  }

  // Fetch member emails from profiles
  const memberUserIds = (members ?? []).map((m: { member_user_id: string }) => m.member_user_id);
  let memberProfiles: { user_id: string; business_name: string | null }[] = [];
  if (memberUserIds.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select("user_id, business_name")
      .in("user_id", memberUserIds);
    memberProfiles = data ?? [];
  }

  const enrichedMembers = (members ?? []).map((m: { member_user_id: string }) => {
    const profile = memberProfiles.find((p) => p.user_id === m.member_user_id);
    return { ...m, member_name: profile?.business_name ?? null };
  });

  return NextResponse.json({ data: { members: enrichedMembers, invitations: invitations ?? [] } });
}

// POST /api/team — invite a new team member
export async function POST(request: Request) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isOwner && ctx.teamRole !== "admin") {
    return NextResponse.json({ error: "Only owners and admins can invite" }, { status: 403 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let validated;
  try {
    validated = inviteTeamMemberSchema.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid input. Provide email and optional role." }, { status: 400 });
  }

  // Don't allow inviting yourself
  if (validated.email === ctx.user.email) {
    return NextResponse.json({ error: "Cannot invite yourself" }, { status: 400 });
  }

  const supabase = await createServerClient();
  const ownerId = ctx.ownerId;

  // Check if already a team member
  const { data: existing } = await supabase
    .from("team_invitations")
    .select("id")
    .eq("owner_id", ownerId)
    .eq("email", validated.email)
    .eq("status", "pending")
    .limit(1)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Invitation already pending for this email" }, { status: 409 });
  }

  // Create invitation
  const { data: invitation, error } = await supabase
    .from("team_invitations")
    .insert({
      owner_id: ownerId,
      email: validated.email,
      role: validated.role,
    })
    .select()
    .single();

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data: invitation }, { status: 201 });
}
