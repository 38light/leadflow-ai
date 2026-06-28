import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const querySchema = z.object({
  code: z.string().min(1).max(64),
});

// Public endpoint — used on /register to render "Invited by: X" when a ref code is in the URL.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse({ code: url.searchParams.get("code") ?? "" });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid code" }, { status: 400 });
  }
  const code = parsed.data.code.trim().toUpperCase();

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("profiles")
    .select("business_name")
    .eq("referral_code", code)
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ data: null, valid: false });
  }

  const row = data as { business_name: string | null };

  return NextResponse.json({
    data: {
      code,
      invited_by: row.business_name ?? "a LeadFlow user",
    },
    valid: true,
  });
}
