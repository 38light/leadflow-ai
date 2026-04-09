import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { sendMessageSchema } from "@/lib/validators/conversations";
import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  const supabase = await createServerClient();
  const { id } = await params;

  const searchParams = Object.fromEntries(request.nextUrl.searchParams);
  const { page, limit } = paginationSchema.parse(searchParams);

  // Verify conversation belongs to user
  const { error: convError } = await supabase
    .from("conversations")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (convError) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const { data, error, count } = await supabase
    .from("messages")
    .select("*", { count: "exact" })
    .eq("conversation_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .range((page - 1) * limit, page * limit - 1);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / limit),
    },
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  const supabase = await createServerClient();
  const { id } = await params;

  // Verify conversation and get contact_id
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("id, contact_id, channel_type")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let input;
  try {
    input = sendMessageSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      user_id: user.id,
      conversation_id: id,
      contact_id: conversation.contact_id,
      direction: "outbound",
      sender_type: "human",
      content: input.content,
      content_type: input.content_type,
      channel_type: conversation.channel_type,
      media_url: input.media_url,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Mark conversation as read
  await supabase
    .from("conversations")
    .update({ unread_count: 0 })
    .eq("id", id)
    .eq("user_id", user.id);

  return NextResponse.json({ data }, { status: 201 });
}
