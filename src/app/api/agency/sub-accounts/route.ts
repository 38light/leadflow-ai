import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";

// GET /api/agency/sub-accounts — list sub-accounts for the authenticated user
export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("sub_accounts")
    .select("*")
    .eq("owner_id", ctx.ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/agency/sub-accounts — create a new sub-account
export async function POST(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: {
    business_name?: string;
    contact_name?: string;
    contact_email?: string;
    branding_color?: string;
    plan?: string;
    monthly_fee_cents?: number;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const business_name = typeof body.business_name === "string" ? body.business_name.trim() : "";
  if (!business_name) {
    return NextResponse.json({ error: "business_name is required" }, { status: 400 });
  }

  const validPlans = ["starter", "pro", "enterprise"];
  const plan = typeof body.plan === "string" && validPlans.includes(body.plan) ? body.plan : "starter";

  const monthly_fee_cents =
    typeof body.monthly_fee_cents === "number" && body.monthly_fee_cents >= 0
      ? Math.floor(body.monthly_fee_cents)
      : 0;

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("sub_accounts")
    .insert({
      owner_id: ctx.ownerId,
      business_name,
      contact_name: typeof body.contact_name === "string" ? body.contact_name.trim() || null : null,
      contact_email: typeof body.contact_email === "string" ? body.contact_email.trim() || null : null,
      branding_color: typeof body.branding_color === "string" ? body.branding_color.trim() || "#4f46e5" : "#4f46e5",
      plan,
      monthly_fee_cents,
      status: "active",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
