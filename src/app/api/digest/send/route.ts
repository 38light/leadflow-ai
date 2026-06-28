import { NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { buildDigest } from "@/lib/email/weekly-digest";
import { getResend } from "@/lib/email/resend";

// POST /api/digest/send — send the weekly digest to the user's email
export async function POST() {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const recipient = ctx.user.email;
  if (!recipient) {
    return NextResponse.json(
      { error: "No email address on file for current user" },
      { status: 422 }
    );
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email is not configured (RESEND_API_KEY missing)" },
      { status: 503 }
    );
  }

  let digest;
  try {
    digest = await buildDigest(ctx.ownerId);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to build digest";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  try {
    const resend = getResend();
    await resend.emails.send({
      from: "LeadFlow AI <noreply@leadflow.ai>",
      to: recipient,
      subject: digest.subject,
      html: digest.html,
      text: digest.text,
    });
  } catch (err) {
    console.error("[digest/send] Resend error:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 502 });
  }

  return NextResponse.json({ data: { sent: true, recipient } });
}
