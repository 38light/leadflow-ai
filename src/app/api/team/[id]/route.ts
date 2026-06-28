import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { updateTeamMemberSchema } from "@/lib/validators/team";

// PUT /api/team/[id] — update team member role
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isOwner && ctx.teamRole !== "admin") {
    return NextResponse.json({ error: "Only owners and admins can update roles" }, { status: 403 });
  }

  const { id } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let validated;
  try {
    validated = updateTeamMemberSchema.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("team_members")
    .update({ role: validated.role })
    .eq("id", id)
    .eq("owner_id", ctx.ownerId)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Team member not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

// DELETE /api/team/[id] — remove team member
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isOwner && ctx.teamRole !== "admin") {
    return NextResponse.json({ error: "Only owners and admins can remove members" }, { status: 403 });
  }

  const { id } = await params;
  const supabase = await createServerClient();

  // Check if it's a team member or an invitation
  const { data: member } = await supabase
    .from("team_members")
    .select("id")
    .eq("id", id)
    .eq("owner_id", ctx.ownerId)
    .single();

  if (member) {
    const { error } = await supabase
      .from("team_members")
      .delete()
      .eq("id", id)
      .eq("owner_id", ctx.ownerId);

    if (error) {
      console.error("[API]", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
    return NextResponse.json({ data: { deleted: true } });
  }

  // Try invitation
  const { error: invError } = await supabase
    .from("team_invitations")
    .delete()
    .eq("id", id)
    .eq("owner_id", ctx.ownerId);

  if (invError) return NextResponse.json({ error: invError.message }, { status: 500 });
  return NextResponse.json({ data: { deleted: true } });
}
