import { NextRequest, NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createAdminClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import { getResend } from "@/lib/email/resend";

const BROADCAST_CAP = 100;

function buildEmailHtml(subject: string, body: string): string {
  const paragraphs = body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `<p style="margin: 0 0 12px 0;">${line}</p>`)
    .join("");

  return `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #1d4ed8;">${subject}</h2>
  <div style="color: #374151; line-height: 1.6;">${paragraphs}</div>
  <hr style="border: 1px solid #e5e7eb; margin: 24px 0;">
  <p style="color: #9ca3af; font-size: 12px;">Sent by LeadFlow AI admin team</p>
</div>`;
}

// POST /api/admin/communications/email
// Body (single user):    { user_id: string, subject: string, body: string }
// Body (broadcast):      { segment: 'all' | 'free' | 'paid' | 'inactive', subject: string, body: string }
export async function POST(req: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { subject, body: emailBody, user_id, segment } = body as {
    subject?: string;
    body?: string;
    user_id?: string;
    segment?: string;
  };

  if (!subject || typeof subject !== "string" || subject.trim().length === 0) {
    return NextResponse.json({ error: "subject is required" }, { status: 400 });
  }
  if (!emailBody || typeof emailBody !== "string" || emailBody.trim().length === 0) {
    return NextResponse.json({ error: "body is required" }, { status: 400 });
  }
  if (subject.length > 200) {
    return NextResponse.json({ error: "subject must be 200 characters or fewer" }, { status: 400 });
  }

  // Check Resend is configured before doing any DB work
  if (!process.env.RESEND_API_KEY) {
    console.warn("[admin/communications/email] RESEND_API_KEY is not set — skipping email send");
    await logAuditEvent({
      actorId: ctx.user.id,
      actorEmail: ctx.user.email,
      action: "communication.email_sent",
      metadata: {
        recipient_count: 0,
        subject: subject.trim(),
        segment: segment ?? "single_user",
        skipped_reason: "RESEND_API_KEY not configured",
      },
    });
    return NextResponse.json({
      success: true,
      sent_count: 0,
      warning: "Email not configured",
    });
  }

  const adminClient = createAdminClient();
  const resend = getResend();
  const html = buildEmailHtml(subject.trim(), emailBody.trim());

  // --- Single user mode ---
  if (user_id) {
    if (typeof user_id !== "string" || user_id.trim().length === 0) {
      return NextResponse.json({ error: "user_id must be a non-empty string" }, { status: 400 });
    }

    // Fetch email from auth.users via admin API
    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(
      user_id.trim()
    );

    if (userError || !userData.user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const recipientEmail = userData.user.email;
    if (!recipientEmail) {
      return NextResponse.json({ error: "User has no email address" }, { status: 422 });
    }

    try {
      await resend.emails.send({
        from: "LeadFlow AI <noreply@leadflow.ai>",
        to: recipientEmail,
        subject: subject.trim(),
        html,
      });
    } catch (err) {
      console.error("[admin/communications/email] Resend error:", err);
      return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
    }

    await logAuditEvent({
      actorId: ctx.user.id,
      actorEmail: ctx.user.email,
      action: "communication.email_sent",
      targetType: "user",
      targetId: user_id.trim(),
      targetLabel: recipientEmail,
      metadata: { recipient_count: 1, subject: subject.trim(), segment: "single_user" },
    });

    return NextResponse.json({ success: true, sent_count: 1 });
  }

  // --- Segment / broadcast mode ---
  const validSegments = ["all", "free", "paid", "inactive"] as const;
  if (!segment || !validSegments.includes(segment as (typeof validSegments)[number])) {
    return NextResponse.json(
      { error: "Provide either user_id or a valid segment: all | free | paid | inactive" },
      { status: 400 }
    );
  }

  // Build query for profiles based on segment
  let profilesQuery = adminClient
    .from("profiles")
    .select("user_id, subscription_tier")
    .limit(BROADCAST_CAP + 1); // fetch one extra to detect overflow

  if (segment === "free") {
    profilesQuery = profilesQuery.eq("subscription_tier", "free");
  } else if (segment === "paid") {
    profilesQuery = profilesQuery.in("subscription_tier", ["starter", "pro", "professional", "enterprise"]);
  } else if (segment === "inactive") {
    profilesQuery = profilesQuery.eq("ai_enabled", false);
  }
  // "all" — no extra filter

  const { data: profiles, error: profilesError } = await profilesQuery;

  if (profilesError) {
    console.error("[admin/communications/email] profiles query error:", profilesError);
    return NextResponse.json({ error: "Failed to fetch recipients" }, { status: 500 });
  }

  const capped = (profiles ?? []).length > BROADCAST_CAP;
  const targetProfiles = (profiles ?? []).slice(0, BROADCAST_CAP);

  if (targetProfiles.length === 0) {
    return NextResponse.json({ success: true, sent_count: 0 });
  }

  // Fetch emails for all target user IDs
  const userIds = targetProfiles.map((p) => p.user_id as string);

  // auth.admin.listUsers returns paginated results; fetch up to cap
  const { data: listData, error: listError } = await adminClient.auth.admin.listUsers({
    perPage: BROADCAST_CAP,
  });

  if (listError) {
    console.error("[admin/communications/email] listUsers error:", listError);
    return NextResponse.json({ error: "Failed to fetch user emails" }, { status: 500 });
  }

  const userIdSet = new Set(userIds);
  const recipients = (listData.users ?? [])
    .filter((u) => userIdSet.has(u.id) && u.email)
    .map((u) => u.email as string);

  if (recipients.length === 0) {
    return NextResponse.json({ success: true, sent_count: 0 });
  }

  // Send individually (Resend free tier doesn't support batch; keep it simple)
  let sentCount = 0;
  const errors: string[] = [];

  for (const recipientEmail of recipients) {
    try {
      await resend.emails.send({
        from: "LeadFlow AI <noreply@leadflow.ai>",
        to: recipientEmail,
        subject: subject.trim(),
        html,
      });
      sentCount++;
    } catch (err) {
      console.error(`[admin/communications/email] Failed to send to ${recipientEmail}:`, err);
      errors.push(recipientEmail);
    }
  }

  await logAuditEvent({
    actorId: ctx.user.id,
    actorEmail: ctx.user.email,
    action: "communication.email_sent",
    metadata: {
      recipient_count: sentCount,
      subject: subject.trim(),
      segment,
      failed_count: errors.length,
    },
  });

  const response: Record<string, unknown> = { success: true, sent_count: sentCount };
  if (capped) {
    response.warning = `Broadcast capped at ${BROADCAST_CAP} users. There are more users in this segment.`;
  }
  if (errors.length > 0) {
    response.failed_count = errors.length;
  }

  return NextResponse.json(response);
}
