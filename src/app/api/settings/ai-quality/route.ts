import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { z } from "zod";

const updateSchema = z.object({
  ai_confidence_threshold: z.number().min(0).max(1).optional(),
  require_approval: z.boolean().optional(),
  ai_memory_depth: z.number().int().min(0).max(10).optional(),
  training_data_opt_out: z.boolean().optional(),
  default_language: z.string().min(2).max(8).optional(),
});

const SELECT_FIELDS =
  "ai_confidence_threshold, require_approval, ai_memory_depth, training_data_opt_out, default_language";

export async function GET() {
  const user = await getUser();
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(SELECT_FIELDS)
    .eq("user_id", user.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PUT(request: NextRequest) {
  const user = await getUser();
  const supabase = await createServerClient();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(parsed.data)
    .eq("user_id", user.id)
    .select(SELECT_FIELDS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
