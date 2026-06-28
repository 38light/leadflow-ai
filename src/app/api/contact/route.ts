import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimitByIp } from "@/lib/rate-limit/chat";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  subject: z.string().min(1, "Subject is required").max(200),
  message: z.string().min(10, "Message must be at least 10 characters"),
});

export async function POST(request: NextRequest) {
  try {
    // Public + unauthenticated: throttle per IP to protect the Resend quota / inbox.
    const rl = await rateLimitByIp(request, "contact:form", 5, 3600);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(Math.max(0, rl.reset - Math.floor(Date.now() / 1000))) } }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message ?? "Validation failed";
      return NextResponse.json({ error: firstError }, { status: 422 });
    }

    const { name, email, subject, message } = parsed.data;

    if (process.env.RESEND_API_KEY) {
      try {
        const { getResend } = await import("@/lib/email/resend");
        const resend = getResend();
        const toEmail = process.env.CONTACT_EMAIL ?? "hello@leadflow.ai";

        await resend.emails.send({
          from: "LeadFlow AI <noreply@leadflow.ai>",
          to: [toEmail],
          replyTo: email,
          subject: `[Contact Form] ${subject}`,
          text: `New contact form submission\n\nFrom: ${name} <${email}>\nSubject: ${subject}\n\nMessage:\n${message}`,
        });
      } catch (emailError) {
        // Log the error server-side but don't fail the request
        console.error("[contact] Failed to send email:", emailError);
      }
    } else {
      console.log("[contact] RESEND_API_KEY not set — skipping email send", {
        name,
        email,
        subject,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[contact] Unexpected error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again later." },
      { status: 500 }
    );
  }
}
