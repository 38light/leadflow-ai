import { NextRequest, NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const UpdateFlagSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).nullable().optional(),
  enabled_globally: z.boolean().optional(),
  rollout_percentage: z.number().int().min(0).max(100).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: RouteParams) {
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

  const parsed = UpdateFlagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  if (Object.keys(parsed.data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("feature_flags")
    .update({
      ...parsed.data,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("[feature-flags PUT]", error);
    if (error.code === "PGRST116") {
      return NextResponse.json({ error: "Feature flag not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update feature flag" }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const ctx = await getAPIContext();
  if (!ctx || !ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const adminClient = createAdminClient();

  const { error } = await adminClient.from("feature_flags").delete().eq("id", id);

  if (error) {
    console.error("[feature-flags DELETE]", error);
    return NextResponse.json({ error: "Failed to delete feature flag" }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } });
}
