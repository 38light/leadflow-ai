import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createContactSchema, contactFiltersSchema } from "@/lib/validators/contacts";
import { deliverWebhookEvent } from "@/lib/webhooks/deliver";
import { sendSlackNotification } from "@/lib/integrations/slack";

export async function GET(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = await createServerClient();

  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = contactFiltersSchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ error: "Invalid contact filters" }, { status: 400 });
  const filters = parsed.data;

  let query = supabase
    .from("contacts")
    .select("*, follow_ups(id, title, due_at, assigned_to)", { count: "exact" })
    .eq("user_id", ctx.ownerId)
    .eq("follow_ups.status", "pending")
    .order("due_at", { referencedTable: "follow_ups", ascending: true })
    .limit(1, { referencedTable: "follow_ups" })
    .order("created_at", { ascending: false })
    .range((filters.page - 1) * filters.limit, filters.page * filters.limit - 1);

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.temperature) query = query.eq("temperature", filters.temperature);
  if (filters.source_channel) query = query.eq("source_channel", filters.source_channel);
  if (filters.search) {
    const search = filters.search.replace(/[,().%_*\\]/g, " ").trim();
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({
    data,
    pagination: {
      page: filters.page,
      limit: filters.limit,
      total: count ?? 0,
      totalPages: Math.ceil((count ?? 0) / filters.limit),
    },
  });
}

export async function POST(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (ctx.teamRole === "viewer") return NextResponse.json({ error: "Read-only team members cannot create contacts" }, { status: 403 });
  const supabase = await createServerClient();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let input;
  try {
    input = createContactSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("contacts")
    .insert({ ...input, user_id: ctx.ownerId })
    .select()
    .single();

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // Non-blocking webhook delivery
  void deliverWebhookEvent(supabase, ctx.ownerId, {
    event: "contact.created",
    timestamp: new Date().toISOString(),
    data: {
      contactId: data.id,
      name: data.name,
      source_channel: data.source_channel,
      status: data.status,
    },
  });

  // Non-blocking Slack notification for hot leads
  if (data.temperature === "hot") {
    void (async () => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("slack_webhook_url, slack_notify_hot_leads")
          .eq("user_id", ctx.ownerId)
          .single();
        if (profile?.slack_webhook_url && profile.slack_notify_hot_leads) {
          await sendSlackNotification(profile.slack_webhook_url, {
            text: `New hot lead: *${data.name ?? "Unknown"}* via ${data.source_channel ?? "manual"}`,
          });
        }
      } catch {
        // swallow
      }
    })();
  }

  return NextResponse.json({ data }, { status: 201 });
}
