import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimitChatInit } from "@/lib/rate-limit/chat";
import { createSessionToken, hashSessionToken } from "@/lib/chat/session";

const schema = z.object({ businessId: z.string().uuid() });

export async function POST(request: NextRequest) {
  try {
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: "Invalid business ID" }, { status: 400 });
    const rate = await rateLimitChatInit(request);
    if (!rate.allowed) return NextResponse.json({ error: "Please wait before starting another chat." }, { status: 429 });
    const supabase = createAdminClient();
    const { data: profile, error } = await supabase.from("profiles")
      .select("business_name").eq("user_id", parsed.data.businessId).maybeSingle();
    if (error) throw error;
    if (!profile) return NextResponse.json({ error: "Business not found" }, { status: 404 });
    const sessionId = createSessionToken();
    const { error: insertError } = await supabase.from("web_chat_sessions").insert({
      user_id: parsed.data.businessId,
      token_hash: hashSessionToken(sessionId),
    });
    if (insertError) throw insertError;
    return NextResponse.json({ sessionId, businessName: profile.business_name ?? "Business" }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[Chat Init]", error);
    return NextResponse.json({ error: "Unable to start chat. Please try again." }, { status: 500 });
  }
}
