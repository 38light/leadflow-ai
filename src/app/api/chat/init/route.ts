import { NextRequest, NextResponse } from "next/server";
import { nanoid } from "nanoid";

/**
 * POST /api/chat/init
 *
 * PUBLIC endpoint — no auth required.
 * Initialises a new web chat session for a visitor on a business's site.
 *
 * Request body:
 *   { businessId: string }   — the user_id (UUID) of the business
 *
 * Response:
 *   { sessionId: string; businessName: string }
 *
 * TODO: Add rate limiting (e.g. Upstash Rate Limit) to prevent abuse on this
 * public endpoint. Suggested limit: 10 inits per IP per minute.
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json();

    if (typeof body !== "object" || body === null) {
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    const { businessId } = body as { businessId?: string };

    if (!businessId || typeof businessId !== "string") {
      return NextResponse.json(
        { error: "businessId is required" },
        { status: 400 }
      );
    }

    // Generate a unique session identifier for this chat conversation
    const sessionId = nanoid(21);

    // Phase 3: look up the business name from the database using businessId
    // For now return a placeholder
    const businessName = "Business";

    return NextResponse.json({
      sessionId,
      businessName,
    });
  } catch (error) {
    console.error("[Chat Init] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
