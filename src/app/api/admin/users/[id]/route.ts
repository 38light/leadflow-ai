import { NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createAdminClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const PutBodySchema = z.object({
  action: z.enum(["suspend", "unsuspend", "change_plan", "reset_password", "resend_verification"]),
  plan: z.string().optional(),
});

// GET /api/admin/users/[id] — full user profile + usage stats
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const adminClient = createAdminClient();

  // Fetch auth user (email, last_sign_in_at, created_at) via service role
  const { data: authUserData, error: authError } = await adminClient.auth.admin.getUserById(id);
  if (authError || !authUserData?.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const authUser = authUserData.user;

  // Fetch profile
  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, user_id, business_name, business_type, subscription_tier, role, ai_enabled, is_active, created_at, updated_at")
    .eq("user_id", id)
    .single();

  // Fetch usage counts in parallel
  const [
    { count: contactCount },
    { count: conversationCount },
    { count: bookingCount },
  ] = await Promise.all([
    adminClient.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", id),
    adminClient.from("conversations").select("*", { count: "exact", head: true }).eq("user_id", id),
    adminClient.from("bookings").select("*", { count: "exact", head: true }).eq("user_id", id),
  ]);

  return NextResponse.json({
    data: {
      id: authUser.id,
      email: authUser.email ?? null,
      created_at: authUser.created_at,
      last_sign_in_at: authUser.last_sign_in_at ?? null,
      subscription_tier: profile?.subscription_tier ?? "free",
      is_active: profile?.is_active ?? true,
      role: profile?.role ?? "user",
      business_name: profile?.business_name ?? null,
      business_type: profile?.business_type ?? null,
      ai_enabled: profile?.ai_enabled ?? false,
      usage: {
        contacts: contactCount ?? 0,
        conversations: conversationCount ?? 0,
        bookings: bookingCount ?? 0,
      },
    },
  });
}

// PUT /api/admin/users/[id] — perform admin action on a user
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const adminClient = createAdminClient();

  // Parse and validate body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PutBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
  }

  const { action, plan } = parsed.data;

  // Confirm the target user exists
  const { data: authUserData, error: authError } = await adminClient.auth.admin.getUserById(id);
  if (authError || !authUserData?.user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const targetEmail = authUserData.user.email ?? "";

  let resultData: Record<string, unknown> = {};

  switch (action) {
    case "suspend": {
      const { error } = await adminClient
        .from("profiles")
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq("user_id", id);
      if (error) {
        console.error("[API]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
      resultData = { is_active: false };
      break;
    }

    case "unsuspend": {
      const { error } = await adminClient
        .from("profiles")
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq("user_id", id);
      if (error) {
        console.error("[API]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
      resultData = { is_active: true };
      break;
    }

    case "change_plan": {
      if (!plan) {
        return NextResponse.json({ error: "plan is required for change_plan action" }, { status: 400 });
      }
      const { error } = await adminClient
        .from("profiles")
        .update({ subscription_tier: plan, updated_at: new Date().toISOString() })
        .eq("user_id", id);
      if (error) {
        console.error("[API]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }
      resultData = { subscription_tier: plan };
      break;
    }

    case "reset_password": {
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: "recovery",
        email: targetEmail,
      });
      if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });
      resultData = { link: linkData?.properties?.action_link ?? null };
      break;
    }

    case "resend_verification": {
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email: targetEmail,
      });
      if (linkError) return NextResponse.json({ error: linkError.message }, { status: 500 });
      resultData = { link: linkData?.properties?.action_link ?? null };
      break;
    }
  }

  // Log audit event (best-effort — logAuditEvent never throws)
  await logAuditEvent({
    actorId: ctx.user.id,
    actorEmail: ctx.user.email ?? undefined,
    action,
    targetId: id,
    targetLabel: targetEmail,
    metadata: { plan: plan ?? null, ...resultData },
  });

  return NextResponse.json({ data: resultData });
}
