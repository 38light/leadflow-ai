import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const messageSid = formData.get("MessageSid") as string;
  const messageStatus = formData.get("MessageStatus") as string;

  console.log(`[Twilio Status] ${messageSid}: ${messageStatus}`);

  // TODO: Update message delivered_at/read_at based on status
  // Statuses: queued, sent, delivered, read, failed, undelivered

  return NextResponse.json({ received: true });
}
