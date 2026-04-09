import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  // Log webhook for debugging
  console.log("[HubSpot Webhook]", JSON.stringify(body).slice(0, 500));

  const supabase = await createServerClient();

  // Log to webhook_logs
  await supabase.from("webhook_logs").insert({
    source: "hubspot",
    event_type: body?.[0]?.subscriptionType ?? "unknown",
    payload: body,
    status: "received",
  });

  // TODO: Phase 5 — process HubSpot events
  // - contact.propertyChange: sync contact updates back to our contacts table
  // - deal.propertyChange: sync deal stage changes
  // - contact.creation: create contact in our system if bidirectional sync enabled

  return NextResponse.json({ received: true });
}
