import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";

// PATCH /api/agency/sub-accounts/[id] — update sub-account fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Build a safe update payload — only allow known fields
  const allowedFields = [
    "business_name",
    "contact_name",
    "contact_email",
    "branding_color",
    "logo_url",
    "custom_domain",
    "status",
    "plan",
    "monthly_fee_cents",
    "notes",
    "metadata",
  ];

  const validStatuses = ["active", "suspended", "cancelled"];
  const validPlans = ["starter", "pro", "enterprise"];

  const updatePayload: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      updatePayload[field] = body[field];
    }
  }

  // Validate constrained fields
  if ("status" in updatePayload && !validStatuses.includes(updatePayload.status as string)) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
  }
  if ("plan" in updatePayload && !validPlans.includes(updatePayload.plan as string)) {
    return NextResponse.json({ error: "Invalid plan value" }, { status: 400 });
  }
  if ("monthly_fee_cents" in updatePayload) {
    const fee = Number(updatePayload.monthly_fee_cents);
    if (isNaN(fee) || fee < 0) {
      return NextResponse.json({ error: "monthly_fee_cents must be a non-negative number" }, { status: 400 });
    }
    updatePayload.monthly_fee_cents = Math.floor(fee);
  }

  if (Object.keys(updatePayload).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("sub_accounts")
    .update(updatePayload)
    .eq("id", id)
    .eq("owner_id", ctx.ownerId)
    .select()
    .single();

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// DELETE /api/agency/sub-accounts/[id] — remove a sub-account
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = await createServerClient();

  const { error } = await supabase
    .from("sub_accounts")
    .delete()
    .eq("id", id)
    .eq("owner_id", ctx.ownerId);

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } });
}
