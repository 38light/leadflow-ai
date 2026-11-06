import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  latest: z.enum(["true", "false"]).default("false"),
});
const sendSchema = z.object({
  content: z.string().trim().min(1).max(10000),
  client_message_id: z.string().uuid(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAPIContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id } = await params;
    const parsed = paginationSchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!z.string().uuid().safeParse(id).success || !parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    const { page, limit, latest } = parsed.data;
    const supabase = await createServerClient();
    const { data: conversation, error: convError } = await supabase.from("conversations")
      .select("id").eq("id", id).eq("user_id", ctx.ownerId).maybeSingle();
    if (convError) throw convError;
    if (!conversation) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    const { data, error, count } = await supabase.from("messages").select("*", { count: "exact" })
      .eq("conversation_id", id).eq("user_id", ctx.ownerId)
      .order("created_at", { ascending: latest !== "true" }).order("id", { ascending: latest !== "true" })
      .range((page - 1) * limit, page * limit - 1);
    if (error) throw error;
    return NextResponse.json({ data: latest === "true" ? data?.reverse() : data, pagination: { page, limit, total: count ?? 0, totalPages: Math.ceil((count ?? 0) / limit) } });
  } catch (error) {
    console.error("[Conversation messages]", error);
    return NextResponse.json({ error: "Unable to load messages." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAPIContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (ctx.teamRole === "viewer") return NextResponse.json({ error: "Read-only team members cannot send replies." }, { status: 403 });
    const { id } = await params;
    const parsed = sendSchema.safeParse(await request.json().catch(() => null));
    if (!z.string().uuid().safeParse(id).success || !parsed.success) return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    const supabase = await createServerClient();
    const { data, error } = await supabase.rpc("send_web_chat_reply", {
      p_owner_id: ctx.ownerId, p_actor_id: ctx.user.id, p_conversation_id: id,
      p_request_id: parsed.data.client_message_id, p_content: parsed.data.content,
    });
    if (error) {
      console.error("[Conversation send]", error);
      return NextResponse.json({ error: "Unable to send this reply. You can retry safely." }, { status: error.code === "42501" ? 403 : 500 });
    }
    if (data?.error === "conversation_not_found") return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    if (data?.error === "unsupported_channel") return NextResponse.json({ error: "Live delivery is currently available for web chat only. This reply has not been sent." }, { status: 422 });
    if (data?.error === "opted_out") return NextResponse.json({ error: "This contact has opted out. The reply was not sent." }, { status: 409 });
    if (!data?.message) throw new Error("Missing delivery receipt");
    return NextResponse.json({ data: data.message }, { status: 201 });
  } catch (error) {
    console.error("[Conversation send]", error);
    return NextResponse.json({ error: "Unable to send this reply. You can retry safely." }, { status: 500 });
  }
}
