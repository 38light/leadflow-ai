import { NextRequest, NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createAdminClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";

function getRequestMeta(req: NextRequest) {
  return {
    ipAddress: req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? undefined,
    userAgent: req.headers.get("user-agent") ?? undefined,
  };
}

// POST /api/admin/impersonate — start impersonating a user
export async function POST(req: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden: super admin only" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (
    typeof body !== "object" ||
    body === null ||
    typeof (body as Record<string, unknown>).user_id !== "string" ||
    !(body as Record<string, unknown>).user_id
  ) {
    return NextResponse.json({ error: "user_id is required" }, { status: 400 });
  }

  const targetUserId = (body as Record<string, string>).user_id;

  // Prevent admins from impersonating themselves
  if (targetUserId === ctx.user.id) {
    return NextResponse.json({ error: "Cannot impersonate yourself" }, { status: 400 });
  }

  // Fetch target user's email from auth
  const adminClient = createAdminClient();
  const { data: authUser, error: authError } = await adminClient.auth.admin.getUserById(targetUserId);
  if (authError || !authUser?.user) {
    return NextResponse.json({ error: "Target user not found" }, { status: 404 });
  }
  const targetEmail = authUser.user.email ?? "unknown@example.com";

  const impersonationPayload = {
    userId: targetUserId,
    email: targetEmail,
    adminId: ctx.user.id,
    adminEmail: ctx.user.email ?? "",
    startedAt: new Date().toISOString(),
  };

  const { ipAddress, userAgent } = getRequestMeta(req);

  await logAuditEvent({
    actorId: ctx.user.id,
    actorEmail: ctx.user.email ?? undefined,
    action: "impersonate.start",
    targetType: "user",
    targetId: targetUserId,
    targetLabel: targetEmail,
    metadata: { adminEmail: ctx.user.email },
    ipAddress,
    userAgent,
  });

  const response = NextResponse.json({
    success: true,
    user: { id: targetUserId, email: targetEmail },
  });

  response.cookies.set("impersonation", JSON.stringify(impersonationPayload), {
    httpOnly: false,
    maxAge: 3600,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}

// DELETE /api/admin/impersonate — end impersonation
export async function DELETE(req: NextRequest) {
  // Read cookie before clearing to log who was being impersonated
  const cookieHeader = req.cookies.get("impersonation")?.value;

  let impersonationData: {
    userId?: string;
    email?: string;
    adminId?: string;
    adminEmail?: string;
  } = {};

  if (cookieHeader) {
    try {
      impersonationData = JSON.parse(cookieHeader) as typeof impersonationData;
    } catch {
      // Cookie was malformed — proceed with clearing
    }
  }

  const { ipAddress, userAgent } = getRequestMeta(req);

  // Log end event using whatever context we have from the cookie
  if (impersonationData.adminId) {
    await logAuditEvent({
      actorId: impersonationData.adminId,
      actorEmail: impersonationData.adminEmail,
      action: "impersonate.end",
      targetType: "user",
      targetId: impersonationData.userId,
      targetLabel: impersonationData.email,
      metadata: { adminEmail: impersonationData.adminEmail },
      ipAddress,
      userAgent,
    });
  }

  const response = NextResponse.json({ success: true });

  response.cookies.set("impersonation", "", {
    httpOnly: false,
    maxAge: 0,
    path: "/",
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
