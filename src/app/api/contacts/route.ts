import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { createContactSchema, contactFiltersSchema } from "@/lib/validators/contacts";

export async function GET(request: NextRequest) {
  const user = await getUser();
  const supabase = await createServerClient();

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const filters = contactFiltersSchema.parse(params);

  let query = supabase
    .from("contacts")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range((filters.page - 1) * filters.limit, filters.page * filters.limit - 1);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.temperature) query = query.eq("temperature", filters.temperature);
  if (filters.source_channel) query = query.eq("source_channel", filters.source_channel);
  if (filters.search) {
    query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,company.ilike.%${filters.search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
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
    input = createContactSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({ ...input, user_id: user.id })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
