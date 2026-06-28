import { NextRequest, NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const AddOverrideSchema = z.object({
  user_id: z.string().uuid("user_id must be a valid UUID"),
  enabled: z.boolean(),
});

const RemoveOverrideSchema = z.object({
  user_id: z.string().uuid("user_id must be a valid UUID"),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const ctx = await getAPIContext();
  if (!ctx || !ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const adminClient = createAdminClient();

  // Verify flag exists
  const { error: flagError } = await adminClient
    .from("feature_flags")
    .select("id")
    .eq("id", id)
    .single();

  if (flagError) {
    return NextResponse.json({ error: "Feature flag not found" }, { status: 404 });
  }

  const { data, error } = await adminClient
    .from("feature_flag_overrides")
    .select("id, user_id, enabled, created_at")
    .eq("flag_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[feature-flag-overrides GET]", error);
    return NextResponse.json({ error: "Failed to fetch overrides" }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const ctx = await getAPIContext();
  if (!ctx || !ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = AddOverrideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  // Upsert so re-posting with a different `enabled` value updates in place
  const { data, error } = await adminClient
    .from("feature_flag_overrides")
    .upsert(
      {
        flag_id: id,
        user_id: parsed.data.user_id,
        enabled: parsed.data.enabled,
      },
      { onConflict: "flag_id,user_id" }
    )
    .select()
    .single();

  if (error) {
    console.error("[feature-flag-overrides POST]", error);
    return NextResponse.json({ error: "Failed to set override" }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const ctx = await getAPIContext();
  if (!ctx || !ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RemoveOverrideSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient
    .from("feature_flag_overrides")
    .delete()
    .eq("flag_id", id)
    .eq("user_id", parsed.data.user_id);

  if (error) {
    console.error("[feature-flag-overrides DELETE]", error);
    return NextResponse.json({ error: "Failed to remove override" }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } });
}
