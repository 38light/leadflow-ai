import { NextRequest, NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createServerClient } from "@/lib/supabase/server";
import { createFollowUpSchema, followUpQuerySchema } from "@/lib/validators/follow-ups";
import { canEditFollowUps, FOLLOW_UP_SELECT, getAssignees, listFollowUps, mutationDatabaseError, validateFollowUpRelations } from "@/lib/follow-ups/service";

export async function GET(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = followUpQuerySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
  if (!parsed.success) return NextResponse.json({ error: "Invalid follow-up filters" }, { status: 400 });
  try {
    const supabase = await createServerClient();
    const [result, assignees] = await Promise.all([
      listFollowUps(supabase, ctx.ownerId, parsed.data),
      getAssignees(supabase, ctx.ownerId, ctx.user.id),
    ]);
    return NextResponse.json({ ...result, assignees, canEdit: canEditFollowUps(ctx), currentUserId: ctx.user.id });
  } catch (error) {
    console.error("[Follow-ups GET]", error);
    return NextResponse.json({ error: "Could not load follow-ups. Please try again." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEditFollowUps(ctx)) return NextResponse.json({ error: "Read-only team members cannot change follow-ups" }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = createFollowUpSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid follow-up" }, { status: 400 });
  try {
    const supabase = await createServerClient();
    const input = { ...parsed.data, assigned_to: parsed.data.assigned_to ?? ctx.ownerId };
    const relationError = await validateFollowUpRelations(supabase, ctx.ownerId, input.contact_id, input.assigned_to);
    if (relationError) return NextResponse.json({ error: relationError }, { status: 400 });
    const { data, error } = await supabase.from("follow_ups")
      .insert({ ...input, user_id: ctx.ownerId }).select(FOLLOW_UP_SELECT).single();
    if (error) {
      console.error("[Follow-ups POST]", error);
      const mapped = mutationDatabaseError(error);
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    console.error("[Follow-ups POST]", error);
    return NextResponse.json({ error: "Could not create the follow-up. Please try again." }, { status: 500 });
  }
}
