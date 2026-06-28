import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimitChatInit } from "@/lib/rate-limit/chat";

/**
 * POST /api/chat/init
 *
 * PUBLIC endpoint — no auth required.
 * Initialises a new web chat session for a visitor on a business's site.
 * Validates that the businessId exists in profiles and returns the real business name.
 *
 * Request body:
 *   { businessId: string }
 *
 * Response:
 *   { sessionId: string; businessName: string }
 */
export async function POST(request: NextRequest) {
  try {
    const rl = await rateLimitChatInit(request);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before starting a new session." },
        {
          status: 429,
          headers: { "Retry-After": String(Math.max(0, rl.reset - Math.floor(Date.now() / 1000))) },
        }
      );
    }

    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { businessId } = body as { businessId?: string };

    if (!businessId || typeof businessId !== "string") {
      return NextResponse.json({ error: "businessId is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, business_name")
      .eq("id", businessId)
      .single();

    if (error || !profile) {
      return NextResponse.json({ error: "Business not found" }, { status: 404 });
    }

    const sessionId = nanoid(21);

    return NextResponse.json({
      sessionId,
      businessName: profile.business_name ?? "Business",
    });
  } catch (error) {
    console.error("[Chat Init] Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
