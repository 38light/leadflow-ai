import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { z } from "zod";

const updateAgentSchema = z.object({
  id: z.string().uuid(),
  system_prompt: z.string().max(10000).optional(),
  enabled: z.boolean().optional(),
  model: z.string().max(100).optional(),
  max_tokens: z.number().int().min(100).max(8192).optional(),
  temperature: z.number().min(0).max(2).optional(),
  tools_enabled: z.array(z.string()).optional(),
  knowledge_base_ids: z.array(z.string().uuid()).optional(),
});

export async function GET() {
  const user = await getUser();
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("ai_agent_configs")
    .select("*")
    .eq("user_id", user.id)
    .order("agent_type");

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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

  let parsed;
  try {
    parsed = updateAgentSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { id, ...input } = parsed;

  const { data, error } = await supabase
    .from("ai_agent_configs")
    .update(input)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data });
}
