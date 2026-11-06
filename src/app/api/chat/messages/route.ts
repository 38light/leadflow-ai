import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { getChatSession, sessionCredentialsSchema } from "@/lib/chat/session";
import { rateLimitByIp } from "@/lib/rate-limit/chat";

const schema = sessionCredentialsSchema.extend({
  cursor: z.object({ createdAt: z.string().datetime({ offset: true }), id: z.string().uuid() }).optional(),
});

/** Public; authenticated by the unguessable session capability in the body. */
export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid chat session" }, { status: 400 });
    const rate = await rateLimitByIp(request, "chat:poll:ip", 120, 60);
    if (!rate.allowed) return NextResponse.json({ error: "Please wait before refreshing chat." }, { status: 429 });
    const supabase = createAdminClient();
    const { businessId, sessionId, cursor } = parsed.data;
    const session = await getChatSession(supabase, businessId, sessionId);
    if (!session) return NextResponse.json({ error: "Chat session expired. Start a new chat." }, { status: 401 });
    let messages: Array<{ id: string; content: string; direction: string; createdAt: string; clientMessageId: string | null }> = [];
    let hasMore = false;
    if (session.conversation_id) {
      let query = supabase.from("messages")
        .select("id, content, direction, created_at, external_message_id")
        .eq("user_id", businessId).eq("conversation_id", session.conversation_id).eq("channel_type", "web_chat")
        .in("direction", ["inbound", "outbound"])
        .order("created_at", { ascending: true }).order("id", { ascending: true }).limit(101);
      if (cursor) query = query.or(`created_at.gt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.gt.${cursor.id})`);
      const { data, error } = await query;
      if (error) throw error;
      hasMore = (data?.length ?? 0) > 100;
      messages = (data ?? []).slice(0, 100).map(row => ({
        id: row.id, content: row.content ?? "", direction: row.direction, createdAt: row.created_at,
        clientMessageId: row.external_message_id?.startsWith("visitor:") ? row.external_message_id.slice(8) : null,
      }));
      const outboundIds = messages.filter(message => message.direction === "outbound").map(message => message.id);
      if (outboundIds.length) {
        const { error: deliveredError } = await supabase.from("messages")
          .update({ delivered_at: new Date().toISOString() }).eq("user_id", businessId)
          .eq("conversation_id", session.conversation_id).is("delivered_at", null).in("id", outboundIds);
        if (deliveredError) throw deliveredError;
      }
    }
    const last = messages.at(-1);
    return NextResponse.json({ data: {
      messages, hasMore, nextCursor: last ? { createdAt: last.createdAt, id: last.id } : cursor ?? null,
    } }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[Chat Messages]", error);
    return NextResponse.json({ error: "Unable to load replies. Please retry." }, { status: 500 });
  }
}
