import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { z } from "zod";

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  edited_content: z.string().trim().min(1).max(10000).optional(),
});

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const ctx = await getAPIContext();
    if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (ctx.teamRole === "viewer") return NextResponse.json({ error: "Read-only team members cannot act on replies." }, { status: 403 });
    const { id } = await context.params;
    if (!z.string().uuid().safeParse(id).success) return NextResponse.json({ error: "Invalid approval ID" }, { status: 400 });
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid approval action" }, { status: 400 });
    const supabase = await createServerClient();
    const { data, error } = await supabase.rpc("act_on_web_chat_approval", {
      p_owner_id: ctx.ownerId, p_actor_id: ctx.user.id, p_approval_id: id,
      p_action: parsed.data.action, p_content: parsed.data.edited_content ?? null,
    });
    if (error) {
      console.error("[Approval action]", error);
      return NextResponse.json({ error: "Unable to process this reply. Please retry." }, { status: error.code === "42501" ? 403 : 500 });
    }
    const errors: Record<string, { status: number; message: string }> = {
      not_found: { status: 404, message: "Approval not found" },
      conversation_not_found: { status: 404, message: "Conversation not found" },
      already_processed: { status: 409, message: "This reply was already processed. Refresh the queue." },
      unsupported_channel: { status: 422, message: "Live delivery is currently available for web chat only. This draft has not been sent." },
      opted_out: { status: 409, message: "This contact has opted out. The reply was not sent." },
    };
    if (data?.error) {
      const failure = errors[data.error] ?? { status: 500, message: "Unable to process this reply." };
      return NextResponse.json({ error: failure.message }, { status: failure.status });
    }
    if (!data) throw new Error("Missing approval result");
    return NextResponse.json({ data });
  } catch (error) {
    console.error("[Approval action]", error);
    return NextResponse.json({ error: "Unable to process this reply. Please retry." }, { status: 500 });
  }
}
