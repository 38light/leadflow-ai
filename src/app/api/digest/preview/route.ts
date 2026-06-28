import { NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { buildDigest } from "@/lib/email/weekly-digest";

// GET /api/digest/preview — return weekly digest payload for the current owner
export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const digest = await buildDigest(ctx.ownerId);
    return NextResponse.json({ data: digest });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build digest";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
