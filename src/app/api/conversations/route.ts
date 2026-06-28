import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { createConversationSchema, conversationFiltersSchema } from "@/lib/validators/conversations";

export async function GET(request: NextRequest) {
  const user = await getUser();
  const supabase = await createServerClient();

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const filters = conversationFiltersSchema.parse(params);

  let query = supabase
    .from("conversations")
    .select("*, contact:contacts(*)", { count: "exact" })
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .range((filters.page - 1) * filters.limit, filters.page * filters.limit - 1);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.channel_type) query = query.eq("channel_type", filters.channel_type);
  if (filters.contact_id) query = query.eq("contact_id", filters.contact_id);
  if (filters.is_ai_active !== undefined) query = query.eq("is_ai_active", filters.is_ai_active);

  const { data, error, count } = await query;

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({
    data,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / filters.limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const user = await getUser();
  const supabase = await createServerClient();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let input;
  try {
    input = createConversationSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("conversations")
    .insert({ ...input, user_id: user.id })
    .select("*, contact:contacts(*)")
    .single();

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
