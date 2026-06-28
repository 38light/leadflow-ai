import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { sendSlackNotification } from "@/lib/integrations/slack";

interface StaleContact {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  source_channel: string | null;
  last_interaction_at: string | null;
  status: string;
  temperature: string;
}

// GET /api/alerts/stale-hot-leads — hot leads not replied to within profile.stale_lead_hours
export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerClient();

  // Look up the threshold for this owner
  const { data: profile } = await supabase
    .from("profiles")
    .select("stale_lead_hours, slack_webhook_url, slack_notify_hot_leads")
    .eq("user_id", ctx.ownerId)
    .single();

  const hours = profile?.stale_lead_hours ?? 2;
  const cutoffIso = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("contacts")
    .select(
      "id, name, email, phone, source_channel, last_interaction_at, status, temperature"
    )
    .eq("user_id", ctx.ownerId)
    .eq("temperature", "hot")
    .not("status", "in", "(won,lost)")
    .lt("last_interaction_at", cutoffIso)
    .order("last_interaction_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const contacts: StaleContact[] = data ?? [];

  // Bonus: ping Slack if there are stale leads and the integration is enabled
  if (
    contacts.length > 0 &&
    profile?.slack_webhook_url &&
    profile.slack_notify_hot_leads
  ) {
    void sendSlackNotification(profile.slack_webhook_url, {
      text: `${contacts.length} hot lead${contacts.length === 1 ? "" : "s"} waiting for reply for more than ${hours}h`,
    });
  }

  return NextResponse.json({
    data: {
      thresholdHours: hours,
      count: contacts.length,
      contacts,
    },
  });
}
