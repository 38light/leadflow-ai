/**
 * Demo extras — run AFTER `npx tsx scripts/seed.ts`.
 * Adds bulk contacts, AI interaction logs, and notifications
 * so the funnel, Sankey, team analytics, and bell panel show real data.
 *
 * Run: npx tsx scripts/seed-demo-extras.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(import.meta.dirname ?? __dirname, "..", ".env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq > 0) {
      const key = trimmed.slice(0, eq);
      const val = trimmed.slice(eq + 1);
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch { /* ignore */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const USER_ID = "784e8466-82e2-4f57-a68b-1e289b62b54a";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const FIRST_NAMES = [
  "Alex", "Ben", "Chloe", "Daniel", "Ella", "Finn", "Grace", "Harry",
  "Ivy", "Jack", "Kate", "Leo", "Maya", "Nick", "Olivia", "Peter",
  "Quinn", "Ryan", "Sarah", "Tom", "Uma", "Victor", "Willow", "Xavier",
  "Yara", "Zoe", "Aaron", "Bella", "Caleb", "Diana", "Ethan", "Fiona",
];
const LAST_NAMES = [
  "Anderson", "Baker", "Clarke", "Dixon", "Evans", "Foster", "Green", "Hayes",
  "Irwin", "Jones", "King", "Lewis", "Miller", "Nelson", "Owen", "Parker",
];
const CHANNELS = ["whatsapp", "sms", "instagram", "facebook", "web_chat", "voice", "manual"];
const TEMPS = ["cold", "warm", "hot"];

type Stage = "new" | "contacted" | "qualified" | "proposal" | "negotiation" | "won" | "lost";
const DISTRIBUTION: Array<{ stage: Stage; count: number }> = [
  { stage: "new", count: 14 },
  { stage: "contacted", count: 10 },
  { stage: "qualified", count: 7 },
  { stage: "proposal", count: 5 },
  { stage: "negotiation", count: 3 },
  { stage: "won", count: 4 },
  { stage: "lost", count: 3 },
];

const SCORE_RANGES: Record<Stage, [number, number]> = {
  new: [5, 20],
  contacted: [20, 45],
  qualified: [40, 65],
  proposal: [55, 80],
  negotiation: [70, 90],
  won: [95, 100],
  lost: [0, 15],
};

function randFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function clearExtras() {
  console.log("Clearing extras (keeping main seed intact)...");
  await supabase.from("notifications").delete().eq("user_id", USER_ID);
  await supabase.from("ai_interaction_logs").delete().eq("user_id", USER_ID);
  await supabase
    .from("contacts")
    .delete()
    .eq("user_id", USER_ID)
    .like("email", "%@demo.leadflow%");
}

async function seedBulkContacts() {
  console.log("Seeding bulk contacts for funnel shape...");
  const now = Date.now();
  const contacts: Array<Record<string, unknown>> = [];

  for (const { stage, count } of DISTRIBUTION) {
    for (let i = 0; i < count; i++) {
      const first = randFrom(FIRST_NAMES);
      const last = randFrom(LAST_NAMES);
      const channel = randFrom(CHANNELS);
      const [scoreMin, scoreMax] = SCORE_RANGES[stage];
      const daysBack = stage === "new" ? randInt(0, 3) : randInt(1, 60);
      const createdAt = new Date(now - daysBack * 86_400_000).toISOString();
      const lastInteraction = new Date(now - randInt(5, 60) * 60_000).toISOString();

      contacts.push({
        user_id: USER_ID,
        name: `${first} ${last}`,
        email: `${first}.${last}@demo.leadflow.ai`.toLowerCase(),
        phone: `+61 4${randInt(10, 99)} ${randInt(100, 999)} ${randInt(100, 999)}`,
        company: Math.random() > 0.7 ? `${last} & Co` : null,
        source_channel: channel,
        status: stage,
        temperature: stage === "won" || stage === "lost" ? "cold" : randFrom(TEMPS),
        score: randInt(scoreMin, scoreMax),
        last_interaction_at: lastInteraction,
        created_at: createdAt,
        metadata: stage === "lost"
          ? { win_loss_reason: randFrom(["Price", "Timing", "Competitor", "No response"]) }
          : stage === "won"
            ? { win_loss_reason: "Strong fit", deposit_paid: true }
            : {},
        tags: [stage === "won" ? "customer" : "demo-seed"],
      });
    }
  }

  const { data, error } = await supabase.from("contacts").insert(contacts).select("id,name,source_channel,status");
  if (error) {
    console.error("Bulk contacts error:", error.message);
    return [];
  }
  console.log(`  Created ${data?.length ?? 0} bulk contacts`);
  return data ?? [];
}

async function seedAIInteractionLogs(contacts: Array<{ id: string }>) {
  console.log("Seeding AI interaction logs for team analytics...");
  const now = Date.now();
  const logs: Array<Record<string, unknown>> = [];

  for (let day = 0; day < 14; day++) {
    const perDay = randInt(8, 25);
    for (let i = 0; i < perDay; i++) {
      const agent = randFrom(["concierge", "knowledge", "action"]);
      const hour = randInt(8, 20);
      const ts = new Date(now - day * 86_400_000 - (24 - hour) * 3_600_000).toISOString();
      logs.push({
        user_id: USER_ID,
        agent_type: agent,
        model: "claude-sonnet-4-6",
        input_tokens: randInt(400, 2_000),
        output_tokens: randInt(80, 500),
        latency_ms: randInt(800, 3_500),
        tools_called: agent === "action" ? [{ name: "check_calendar" }] : [],
        reasoning: null,
        error: null,
        created_at: ts,
      });
    }
  }

  const { error } = await supabase.from("ai_interaction_logs").insert(logs);
  if (error) console.error("AI logs error:", error.message);
  else console.log(`  Created ${logs.length} AI interaction logs`);
}

async function seedNotifications() {
  console.log("Seeding notifications...");
  const now = Date.now();
  const notifications = [
    {
      user_id: USER_ID, type: "booking_completed",
      title: "Booking completed", body: "Mia Johnson — 30 min consult wrapped up",
      link: "/bookings", read: false,
      created_at: new Date(now - 2 * 60_000).toISOString(),
    },
    {
      user_id: USER_ID, type: "new_lead",
      title: "New hot lead", body: "Olivia & Ethan Brown via WhatsApp",
      link: "/contacts", read: false,
      created_at: new Date(now - 15 * 60_000).toISOString(),
    },
    {
      user_id: USER_ID, type: "ai_handoff",
      title: "AI handed off", body: "Priya & Raj Patel — pricing question",
      link: "/conversations", read: false,
      created_at: new Date(now - 45 * 60_000).toISOString(),
    },
    {
      user_id: USER_ID, type: "waterfall_triggered",
      title: "Follow-up sent", body: "James O'Brien — stalled 3 days, WhatsApp sent",
      link: "/settings/automation", read: true,
      created_at: new Date(now - 3 * 3_600_000).toISOString(),
    },
    {
      user_id: USER_ID, type: "payment_received",
      title: "Deposit received", body: "Ruby & Max Cooper — $200 deposit paid",
      link: "/bookings", read: true,
      created_at: new Date(now - 6 * 3_600_000).toISOString(),
    },
  ];
  const { error } = await supabase.from("notifications").insert(notifications);
  if (error) console.error("Notifications error:", error.message);
  else console.log(`  Created ${notifications.length} notifications`);
}

async function main() {
  console.log("=== LeadFlow AI Demo Extras ===\n");
  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    console.error("Missing Supabase env vars.");
    process.exit(1);
  }
  await clearExtras();
  const bulk = await seedBulkContacts();
  await seedAIInteractionLogs(bulk);
  // Notifications table not yet pushed to remote Supabase; skip gracefully.
  try { await seedNotifications(); } catch { /* migration not pushed */ }
  console.log("\n=== Extras complete! ===");
  console.log("Refresh /dashboard, /analytics, /analytics/funnel, /analytics/team to see.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
