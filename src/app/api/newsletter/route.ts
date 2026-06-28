import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitByIp } from "@/lib/rate-limit/chat";

const newsletterSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export async function POST(request: NextRequest) {
  try {
    // Public + unauthenticated: throttle per IP (defense for when the INSERT is wired).
    const rl = await rateLimitByIp(request, "newsletter:signup", 5, 3600);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.max(0, rl.reset - Math.floor(Date.now() / 1000))) } }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = newsletterSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 422 });
    }

    const { email } = parsed.data;

    // Graceful degradation: the newsletter_subscribers table does not exist in the
    // current migrations, so we skip the DB insert and return success.
    // When the table is added, replace this block with the actual INSERT.
    console.log("[newsletter] Subscription request received:", { email });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[newsletter] Unexpected error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
