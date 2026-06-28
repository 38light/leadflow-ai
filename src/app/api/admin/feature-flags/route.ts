import { NextRequest, NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const CreateFlagSchema = z.object({
  key: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9_]+$/, "Key must be lowercase letters, numbers, and underscores only"),
  name: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  enabled_globally: z.boolean().default(false),
  rollout_percentage: z.number().int().min(0).max(100).default(0),
});

export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx || !ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminClient = createAdminClient();

  // Fetch all flags
  const { data: flags, error } = await adminClient
    .from("feature_flags")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[feature-flags GET]", error);
    return NextResponse.json({ error: "Failed to fetch feature flags" }, { status: 500 });
  }

  // Fetch override counts per flag
  const { data: overrideCounts } = await adminClient
    .from("feature_flag_overrides")
    .select("flag_id");

  const countMap: Record<string, number> = {};
  for (const o of overrideCounts ?? []) {
    countMap[o.flag_id] = (countMap[o.flag_id] ?? 0) + 1;
  }

  const result = (flags ?? []).map((flag) => ({
    ...flag,
    override_count: countMap[flag.id] ?? 0,
  }));

  return NextResponse.json({ data: result });
}

export async function POST(req: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx || !ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateFlagSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("feature_flags")
    .insert({
      key: parsed.data.key,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      enabled_globally: parsed.data.enabled_globally,
      rollout_percentage: parsed.data.rollout_percentage,
    })
    .select()
    .single();

  if (error) {
    console.error("[feature-flags POST]", error);
    if (error.code === "23505") {
      return NextResponse.json({ error: "A flag with this key already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create feature flag" }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
