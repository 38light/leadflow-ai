import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

/**
 * POST /api/chat/message
 *
 * PUBLIC endpoint — no auth required.
 * Receives a message from the web chat widget and returns a response.
 *
 * In Phase 3 this will be wired to the AI orchestrator to generate real
 * responses. For now it returns a placeholder acknowledgement.
 *
 * TODO: Add rate limiting (e.g. Upstash Rate Limit) to prevent abuse.
 * Suggested limit: 30 messages per session per minute.
 */

const messageSchema = z.object({
  sessionId: z.string().min(1, "sessionId is required"),
  content: z.string().min(1, "content is required").max(5000, "content must be 5000 characters or fewer"),
  businessId: z.string().min(1, "businessId is required"),
});

export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    const parsed = messageSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid input";
      return NextResponse.json({ error: firstError }, { status: 400 });
    }

    const { sessionId, content, businessId } = parsed.data;

    // Log for debugging during development
    console.log(
      `[Chat Message] session=${sessionId} business=${businessId} content="${content.slice(0, 80)}"`
    );

    // Phase 3: forward to AI orchestrator, persist conversation, return AI reply
    return NextResponse.json({
      data: {
        message: "Message received",
        sessionId,
      },
    });
  } catch (error) {
    console.error("[Chat Message] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
