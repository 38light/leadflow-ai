import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { callClaude, extractTextContent } from "@/lib/ai/claude-client";
import { rateLimitDemoMessage } from "@/lib/rate-limit/demo";
import { createAdminClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

let cachedKey: { value: string | null; at: number } = { value: null, at: 0 };
const KEY_TTL_MS = 60_000;

async function resolveDemoApiKey(): Promise<string | null> {
  const now = Date.now();
  if (cachedKey.value && now - cachedKey.at < KEY_TTL_MS) return cachedKey.value;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("profiles")
      .select("anthropic_api_key")
      .eq("role", "super_admin")
      .not("anthropic_api_key", "is", null)
      .limit(1)
      .maybeSingle();
    const key = data?.anthropic_api_key ?? process.env.ANTHROPIC_API_KEY ?? null;
    cachedKey = { value: key, at: now };
    return key;
  } catch {
    return process.env.ANTHROPIC_API_KEY ?? null;
  }
}

const SCENARIO_PROMPTS: Record<string, { system: string; persona: string }> = {
  celebrant: {
    persona: "Sarah's AI Assistant (Marriage Celebrant, Sydney)",
    system: `You are the AI concierge for Sarah, a marriage celebrant based in Sydney, NSW. You reply to leads on behalf of Sarah.

About Sarah:
- 8 years experience, 400+ weddings
- Service areas: Sydney, Central Coast, Blue Mountains
- Packages: "Love Story" ($1,400, 90-min ceremony + rehearsal), "Elopement" ($890, short ceremony up to 20 guests), "Commitment" ($1,100, non-legal ceremony)
- Legal paperwork: NSW Notice of Intended Marriage (NOIM), must be lodged at least 1 calendar month before the wedding
- Deposit: $200 to lock in a date, refundable up to 6 weeks out
- Calendar: assume dates from Oct 2026 onward are open unless the user mentions a weekend already listed as booked: Nov 14 2026, Dec 5 2026

Style: warm, concise, always move toward either (a) sharing a package fit, (b) checking the date, or (c) offering the deposit link. Offer a deposit link wording like "I can send a $200 deposit link now to lock in the date — want me to?". Keep replies under 80 words. Use plain text, no markdown. Sign off naturally. If asked something outside wedding work, politely redirect.`,
  },
  driving: {
    persona: "Drive-Safe Academy AI (Sydney)",
    system: `You are the AI concierge for Drive-Safe Academy, a driving school in Sydney's Inner West.

Packages:
- Beginner 5-pack: $340 (5 × 60min)
- Beginner 10-pack: $590 (save $60)
- Test Readiness pack: $280 (3 × 60min incl. mock test)
- First lesson free when booking 5+ up-front
- Instructors: Liam (manual + auto), Priya (auto only, female-only preferred), Ben (manual, accepts male + female)
- Areas: Inner West, Sydney CBD, North Shore
- Availability: weekday afternoons and Saturday mornings are typical. Sunday unavailable.

Style: upbeat, concise. Always move toward checking availability, recommending a package, and booking. Offer slots like "Sat 10am with Liam" when the lead is ready. Keep replies under 80 words. Plain text only. If asked something outside driving lessons, politely redirect.`,
  },
  photography: {
    persona: "Northside Photography AI (James)",
    system: `You are the AI concierge for James, a photographer based in Sydney's North Shore.

Services:
- Corporate half-day: $1,400 (up to 4h on-site)
- Corporate full-day: $2,600 (up to 8h)
- Headshots package: $280/person (groups get 20% off)
- Wedding half-day: $2,100, full-day: $3,400
- Turnaround: edited gallery in 7 days
- Deposit: 25% to lock in the date

Style: professional, concise. Move toward confirming the event type, date, and offering the deposit link. Keep replies under 80 words. Plain text only. If asked something outside photography, politely redirect.`,
  },
};

const schema = z.object({
  sessionId: z.string().min(8).max(64),
  scenario: z.enum(["celebrant", "driving", "photography"]),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().min(1).max(1200),
      })
    )
    .max(16),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { sessionId, scenario, history } = parsed.data;

  const rl = await rateLimitDemoMessage(req, sessionId);
  if (!rl.allowed) {
    return NextResponse.json(
      {
        error: "Demo message cap reached. Sign up for the real thing!",
        remaining: 0,
        reset: rl.reset,
      },
      { status: 429 }
    );
  }

  if (history.length === 0) {
    return NextResponse.json({ error: "Empty history" }, { status: 400 });
  }

  const scenarioConfig = SCENARIO_PROMPTS[scenario];

  const apiKey = await resolveDemoApiKey();
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Demo AI not configured. A super-admin needs to add an Anthropic key at Settings → Integrations.",
      },
      { status: 503 }
    );
  }

  try {
    const result = await callClaude({
      systemPrompt: scenarioConfig.system,
      messages: history.map((m) => ({ role: m.role, content: m.content })),
      model: "claude-haiku-4-5-20251001",
      maxTokens: 400,
      temperature: 0.7,
      apiKey,
    });

    const text = extractTextContent(result.response).trim();
    if (!text) {
      return NextResponse.json(
        { error: "Empty AI response" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      reply: text,
      persona: scenarioConfig.persona,
      latencyMs: result.latencyMs,
      remaining: rl.remaining,
    });
  } catch (err) {
    console.error("[demo/message] claude call failed:", err);
    const msg = err instanceof Error ? err.message : "AI unavailable";
    const isAuthErr = /401|invalid.*api.*key|authentication/i.test(msg);
    if (isAuthErr) {
      cachedKey = { value: null, at: 0 };
      return NextResponse.json(
        {
          error:
            "Demo AI key rejected by Anthropic. Update the Anthropic key at Settings → Integrations.",
        },
        { status: 502 }
      );
    }
    const safe = msg.includes("API key") ? msg : "AI is temporarily unavailable. Try again in a moment.";
    return NextResponse.json({ error: safe }, { status: 500 });
  }
}
