import { NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createServerClient } from "@/lib/supabase/server";
import { loadToday } from "@/lib/dashboard/today";

export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const supabase = await createServerClient();
    return NextResponse.json({ data: await loadToday(supabase, ctx) });
  } catch (error) {
    console.error("[Today GET]", error);
    return NextResponse.json({ error: "Could not load your day. Please try again." }, { status: 500 });
  }
}
