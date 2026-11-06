import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAPIContext } from "@/lib/auth/get-user";
import { createServerClient } from "@/lib/supabase/server";
import { updateFollowUpSchema } from "@/lib/validators/follow-ups";
import { canEditFollowUps, FOLLOW_UP_SELECT, mutationDatabaseError, validateFollowUpRelations } from "@/lib/follow-ups/service";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canEditFollowUps(ctx)) return NextResponse.json({ error: "Read-only team members cannot change follow-ups" }, { status: 403 });
  const { id } = await context.params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid follow-up id" }, { status: 400 });
  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const parsed = updateFollowUpSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid follow-up" }, { status: 400 });
  try {
    const supabase = await createServerClient();
    const { expected_updated_at, ...changes } = parsed.data;
    const relationError = await validateFollowUpRelations(supabase, ctx.ownerId, undefined, changes.assigned_to);
    if (relationError) return NextResponse.json({ error: relationError }, { status: 400 });
    // The database stamps updated_at and completed_at. A conditional UPDATE avoids
    // overwriting a colleague's completion or reschedule from a stale browser tab.
    const { data, error } = await supabase.from("follow_ups").update(changes)
      .eq("user_id", ctx.ownerId).eq("id", id).eq("updated_at", expected_updated_at)
      .select(FOLLOW_UP_SELECT).maybeSingle();
    if (error) {
      console.error("[Follow-ups PATCH]", error);
      const mapped = mutationDatabaseError(error);
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }
    if (!data) return NextResponse.json({ error: "This follow-up changed or is no longer available. Refresh before trying again." }, { status: 409 });
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[Follow-ups PATCH]", error);
    return NextResponse.json({ error: "Could not update the follow-up. Please try again." }, { status: 500 });
  }
}
