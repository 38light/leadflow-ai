import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { z } from "zod";

const querySchema = z.object({
  status: z.enum(["pending", "approved", "rejected", "all"]).optional().default("pending"),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export async function GET(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    status: url.searchParams.get("status") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.message }, { status: 400 });
  }

  const { status, limit } = parsed.data;

  const supabase = await createServerClient();

  let query = supabase
    .from("ai_approvals")
    .select(
      "id, user_id, conversation_id, contact_id, draft_content, confidence, reasoning, status, approved_by, approved_at, created_at, contact:contacts(id, name, email, phone), conversation:conversations(id, channel_type, summary)"
    )
    .eq("user_id", ctx.ownerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}
