/**
 * Seed script — populates the LeadFlow AI database with realistic demo data.
 * Run: npx tsx scripts/seed.ts
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve } from "path";

// Load .env.local
const envPath = resolve(import.meta.dirname ?? __dirname, "..", ".env.local");
try {
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx);
      const val = trimmed.slice(eqIdx + 1);
      if (!process.env[key]) process.env[key] = val;
    }
  }
} catch { /* ignore if not found */ }

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Dev user ID (real Supabase auth user — dev@leadflow.ai)
const USER_ID = "784e8466-82e2-4f57-a68b-1e289b62b54a";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

async function clearExisting() {
  console.log("Clearing existing demo data...");
  // Delete in reverse dependency order
  await supabase.from("bookings").delete().eq("user_id", USER_ID);
  await supabase.from("blocked_dates").delete().eq("user_id", USER_ID);
  await supabase.from("availability_schedules").delete().eq("user_id", USER_ID);
  await supabase.from("services").delete().eq("user_id", USER_ID);
  await supabase.from("booking_settings").delete().eq("user_id", USER_ID);
  await supabase.from("ai_interaction_logs").delete().eq("user_id", USER_ID);
  await supabase.from("analytics_events").delete().eq("user_id", USER_ID);
  await supabase.from("messages").delete().eq("user_id", USER_ID);
  await supabase.from("conversations").delete().eq("user_id", USER_ID);
  await supabase.from("knowledge_chunks").delete().eq("user_id", USER_ID);
  await supabase.from("knowledge_documents").delete().eq("user_id", USER_ID);
  await supabase.from("knowledge_bases").delete().eq("user_id", USER_ID);
  await supabase.from("ai_agent_configs").delete().eq("user_id", USER_ID);
  await supabase.from("subscriptions").delete().eq("user_id", USER_ID);
  await supabase.from("contacts").delete().eq("user_id", USER_ID);
  await supabase.from("channels").delete().eq("user_id", USER_ID);
  await supabase.from("profiles").delete().eq("user_id", USER_ID);
}

async function seedProfile() {
  console.log("Seeding profile...");
  const { error } = await supabase.from("profiles").upsert({
    user_id: USER_ID,
    business_name: "Sarah Mitchell Celebrant",
    business_type: "marriage_celebrant",
    timezone: "Australia/Sydney",
    phone: "+61 412 345 678",
    website: "https://sarahmitchell.com.au",
    ai_enabled: true,
    subscription_tier: "pro",
    role: "super_admin",
  }, { onConflict: "user_id" });
  if (error) console.error("Profile error:", error.message);
}

async function seedSubscription() {
  console.log("Seeding subscription...");
  const { error } = await supabase.from("subscriptions").upsert({
    user_id: USER_ID,
    plan: "pro",
    status: "active",
    current_period_start: new Date("2026-04-01").toISOString(),
    current_period_end: new Date("2026-05-01").toISOString(),
    message_count_this_period: 342,
    message_limit: 5000,
    ai_calls_this_period: 187,
    ai_calls_limit: 2500,
  }, { onConflict: "user_id" });
  if (error) console.error("Subscription error:", error.message);
}

async function seedChannels() {
  console.log("Seeding channels...");
  const channels = [
    { user_id: USER_ID, type: "whatsapp", name: "Business WhatsApp", is_active: true, config: { phone: "+61 412 345 678" } },
    { user_id: USER_ID, type: "instagram", name: "Instagram DMs", is_active: true, config: { page_id: "sarahmitchellcelebrant" } },
    { user_id: USER_ID, type: "sms", name: "SMS Line", is_active: true, config: { phone: "+61 412 345 678" } },
    { user_id: USER_ID, type: "web_chat", name: "Website Widget", is_active: true, config: { color: "#2563eb", position: "bottom-right" } },
    { user_id: USER_ID, type: "voice", name: "Phone Line", is_active: false, config: {} },
  ];
  const { data, error } = await supabase.from("channels").insert(channels).select();
  if (error) console.error("Channels error:", error.message);
  return data ?? [];
}

async function seedContacts() {
  console.log("Seeding contacts...");
  const now = new Date();
  const contacts = [
    {
      user_id: USER_ID, name: "Emma & Liam Chen", email: "emma.chen@gmail.com", phone: "+61 423 456 789",
      company: null, source_channel: "instagram", status: "qualified", temperature: "hot",
      last_interaction_at: new Date(now.getTime() - 5 * 60000).toISOString(),
      metadata: { wedding_date: "2026-10-12", venue: "Taronga Zoo, Sydney", partner_names: "Emma & Liam", guests: "120" },
      tags: ["2026-wedding", "sydney", "outdoor"], score: 85,
    },
    {
      user_id: USER_ID, name: "Sophie Williams", email: "sophie.w@outlook.com", phone: "+61 434 567 890",
      company: "Williams Events", source_channel: "whatsapp", status: "proposal", temperature: "warm",
      last_interaction_at: new Date(now.getTime() - 45 * 60000).toISOString(),
      metadata: { wedding_date: "2026-12-20", venue: "Doltone House, Pyrmont", partner_names: "Sophie & Jack", package: "Love Story" },
      tags: ["2026-wedding", "sydney", "indoor"], score: 72,
    },
    {
      user_id: USER_ID, name: "Priya & Raj Patel", email: "priya.patel@yahoo.com", phone: "+61 445 678 901",
      company: null, source_channel: "web_chat", status: "negotiation", temperature: "warm",
      last_interaction_at: new Date(now.getTime() - 2 * 3600000).toISOString(),
      metadata: { wedding_date: "2027-03-15", venue: "TBD", partner_names: "Priya & Raj", ceremony_type: "Hindu-Australian fusion" },
      tags: ["2027-wedding", "multicultural"], score: 68,
    },
    {
      user_id: USER_ID, name: "James O'Brien", email: "james.obrien@me.com", phone: "+61 456 789 012",
      company: null, source_channel: "sms", status: "contacted", temperature: "cold",
      last_interaction_at: new Date(now.getTime() - 3 * 86400000).toISOString(),
      metadata: { wedding_date: "2027-06-01" },
      tags: ["2027-wedding"], score: 35,
    },
    {
      user_id: USER_ID, name: "Mia Johnson", email: "mia.j@gmail.com", phone: "+61 467 890 123",
      company: null, source_channel: "instagram", status: "won", temperature: "cold",
      last_interaction_at: new Date(now.getTime() - 14 * 86400000).toISOString(),
      metadata: { wedding_date: "2026-09-05", venue: "Royal Botanic Gardens", partner_names: "Mia & Noah", package: "Elopement", deposit_paid: true },
      tags: ["2026-wedding", "sydney", "elopement"], score: 95,
    },
    {
      user_id: USER_ID, name: "Olivia & Ethan Brown", email: "olivia.brown@proton.me", phone: "+61 478 901 234",
      company: null, source_channel: "whatsapp", status: "new", temperature: "hot",
      last_interaction_at: new Date(now.getTime() - 3 * 60000).toISOString(),
      metadata: {},
      tags: [], score: 10,
    },
    {
      user_id: USER_ID, name: "Grace Taylor", email: "grace.t@icloud.com", phone: "+61 489 012 345",
      company: "Taylor Made Events", source_channel: "instagram", status: "qualified", temperature: "warm",
      last_interaction_at: new Date(now.getTime() - 90 * 60000).toISOString(),
      metadata: { wedding_date: "2026-11-22", venue: "The Grounds of Alexandria", partner_names: "Grace & Will" },
      tags: ["2026-wedding", "sydney"], score: 60,
    },
    {
      user_id: USER_ID, name: "Ava Wilson", email: "ava.wilson@outlook.com.au", phone: "+61 490 123 456",
      company: null, source_channel: "web_chat", status: "lost", temperature: "cold",
      last_interaction_at: new Date(now.getTime() - 30 * 86400000).toISOString(),
      metadata: { wedding_date: "2026-08-15", lost_reason: "Booked another celebrant" },
      tags: ["2026-wedding", "lost"], score: 5,
    },
    {
      user_id: USER_ID, name: "Charlotte Davis", email: "charlotte.d@gmail.com", phone: "+61 401 234 567",
      company: null, source_channel: "sms", status: "contacted", temperature: "warm",
      last_interaction_at: new Date(now.getTime() - 4 * 3600000).toISOString(),
      metadata: { wedding_date: "2027-02-14", partner_names: "Charlotte & Ben" },
      tags: ["2027-wedding", "valentines"], score: 45,
    },
    {
      user_id: USER_ID, name: "Isabella Martinez", email: "bella.m@hotmail.com", phone: "+61 412 345 999",
      company: null, source_channel: "instagram", status: "new", temperature: "cold",
      last_interaction_at: new Date(now.getTime() - 7 * 86400000).toISOString(),
      metadata: {},
      tags: [], score: 15,
    },
    {
      user_id: USER_ID, name: "Ruby & Max Cooper", email: "ruby.cooper@gmail.com", phone: "+61 423 999 888",
      company: null, source_channel: "whatsapp", status: "won", temperature: "cold",
      last_interaction_at: new Date(now.getTime() - 21 * 86400000).toISOString(),
      metadata: { wedding_date: "2026-07-18", venue: "Balmoral Beach", partner_names: "Ruby & Max", package: "Beach Ceremony", deposit_paid: true, amount_paid: 200 },
      tags: ["2026-wedding", "beach", "sydney"], score: 100,
    },
    {
      user_id: USER_ID, name: "Amelia & Thomas White", email: "amelia.white@live.com", phone: "+61 434 888 777",
      company: null, source_channel: "web_chat", status: "proposal", temperature: "hot",
      last_interaction_at: new Date(now.getTime() - 8 * 60000).toISOString(),
      metadata: { wedding_date: "2026-11-08", venue: "Sergeants Mess, Mosman", partner_names: "Amelia & Thomas", package: "Love Story", budget: "$3,500" },
      tags: ["2026-wedding", "sydney", "premium"], score: 78,
    },
  ];

  const { data, error } = await supabase.from("contacts").insert(contacts).select();
  if (error) console.error("Contacts error:", error.message);
  return data ?? [];
}

async function seedConversationsAndMessages(contacts: Array<{ id: string; name: string; source_channel: string; status: string }>) {
  console.log("Seeding conversations and messages...");

  const conversationTemplates: Record<string, { messages: Array<{ direction: string; sender_type: string; content: string; delay_min: number }>; summary: string; sentiment: string; intent: string }> = {
    "Emma & Liam Chen": {
      summary: "Wedding inquiry for Oct 12, 2026 at Taronga Zoo. Qualified — sent brochure.",
      sentiment: "positive",
      intent: "booking_inquiry",
      messages: [
        { direction: "inbound", sender_type: "contact", content: "Hi! Are you available Oct 12, 2026? We're planning our wedding at Taronga Zoo!", delay_min: 0 },
        { direction: "outbound", sender_type: "ai", content: "Hi! I'm Sarah's AI assistant. Let me check... Yes, Sarah is available on October 12, 2026! A Taronga Zoo wedding sounds absolutely magical. Sarah's 'Love Story' package is very popular for outdoor ceremonies. Would you like me to send the brochure?", delay_min: 0.2 },
        { direction: "inbound", sender_type: "contact", content: "Yes please! We're thinking around 120 guests. What's the pricing like?", delay_min: 3 },
        { direction: "outbound", sender_type: "ai", content: "Great! I've sent the brochure to your DMs. For 120 guests at an outdoor venue, the Love Story package is $2,800 which includes a custom ceremony, rehearsal, PA system, and all legal paperwork. Sarah also offers a 'Grand Celebration' package at $3,500 with additional pre-wedding meetings. Would you like to book a free consultation?", delay_min: 0.3 },
        { direction: "inbound", sender_type: "contact", content: "That sounds perfect. What about the legal requirements? It's our first time dealing with Australian marriage laws", delay_min: 8 },
        { direction: "outbound", sender_type: "ai", content: "Great question! For a legal marriage in NSW, you'll need to file a Notice of Intended Marriage (NOIM) at least 1 month before your wedding date. Sarah will guide you through the entire process. You'll also need: valid ID, birth certificates or passports, and if either of you has been married before, a divorce certificate. Sarah handles all the legal paperwork. Shall I lock in a consultation time?", delay_min: 0.4 },
        { direction: "inbound", sender_type: "contact", content: "Yes! Do you have anything this Saturday afternoon?", delay_min: 2 },
        { direction: "outbound", sender_type: "ai", content: "Let me check Sarah's calendar... She's free at 2:00 PM and 3:30 PM this Saturday. Which works better for you?", delay_min: 0.2 },
      ],
    },
    "Sophie Williams": {
      summary: "Wedding Dec 20 at Doltone House. Proposal sent — awaiting deposit.",
      sentiment: "positive",
      intent: "booking_inquiry",
      messages: [
        { direction: "inbound", sender_type: "contact", content: "Hey! I found you on Instagram. We're getting married Dec 20 at Doltone House. Are you free?", delay_min: 0 },
        { direction: "outbound", sender_type: "ai", content: "Hi Sophie! I'm Sarah's AI assistant. Congratulations on your upcoming wedding! Let me check December 20... Great news — Sarah is available! Doltone House in Pyrmont is a beautiful venue. What kind of ceremony are you envisioning?", delay_min: 0.3 },
        { direction: "inbound", sender_type: "contact", content: "Something romantic but not too traditional. We want personal vows and maybe some readings from friends", delay_min: 15 },
        { direction: "outbound", sender_type: "ai", content: "That sounds lovely! Sarah specialises in personalised ceremonies with exactly that feel. Her 'Love Story' package ($2,800) includes a pre-wedding interview where she learns your story and weaves it into the ceremony. It also includes help writing personal vows. Would you like to see a sample ceremony script?", delay_min: 0.3 },
        { direction: "inbound", sender_type: "contact", content: "Oh yes please! Also what's the process for the NOIM form?", delay_min: 5 },
        { direction: "outbound", sender_type: "ai", content: "I've sent you a sample ceremony script and the Love Story package brochure! For the NOIM (Notice of Intended Marriage), you'll need to lodge it at least 1 month before Dec 20. Sarah will help you fill it out — it's very straightforward. Ready to secure the date? I can send a $200 deposit link to lock in December 20.", delay_min: 0.2 },
      ],
    },
    "Olivia & Ethan Brown": {
      summary: "New inquiry via WhatsApp — just arrived, needs response.",
      sentiment: "neutral",
      intent: "general_info",
      messages: [
        { direction: "inbound", sender_type: "contact", content: "Hi there! We saw your profile and love your style. Do you do ceremonies outside of Sydney?", delay_min: 0 },
        { direction: "outbound", sender_type: "ai", content: "Hi! I'm Sarah's AI assistant. Thank you so much — Sarah would love to hear from you! Yes, Sarah travels across NSW for ceremonies. She's done beautiful weddings in the Hunter Valley, Blue Mountains, South Coast, and Byron Bay. Travel fees apply for locations over 50km from Sydney CBD. Where are you thinking?", delay_min: 0.2 },
        { direction: "inbound", sender_type: "contact", content: "We're looking at somewhere in the Hunter Valley, probably around March next year", delay_min: 1 },
      ],
    },
    "Amelia & Thomas White": {
      summary: "Premium lead — interested in Love Story package at Sergeants Mess. Very engaged.",
      sentiment: "positive",
      intent: "booking_inquiry",
      messages: [
        { direction: "inbound", sender_type: "contact", content: "Hello! We're planning a wedding at Sergeants Mess in Mosman for November 8. Is Sarah available?", delay_min: 0 },
        { direction: "outbound", sender_type: "ai", content: "Hi Amelia! I'm Sarah's AI assistant. Sergeants Mess is one of Sydney's most stunning venues — great choice! Checking Sarah's calendar... She's available on November 8, 2026! What style of ceremony are you looking for?", delay_min: 0.2 },
        { direction: "inbound", sender_type: "contact", content: "We want something elegant and emotional. Our budget is around $3,500. What packages do you offer?", delay_min: 7 },
        { direction: "outbound", sender_type: "ai", content: "With a $3,500 budget, Sarah's 'Grand Celebration' package is perfect for you. It includes:\n\n- 3 pre-wedding meetings to craft your story\n- Custom-written ceremony with personal vows guidance\n- Full rehearsal at Sergeants Mess\n- Premium PA system\n- All legal paperwork (NOIM filing, marriage certificate)\n- Post-ceremony signing table setup\n\nWould you like to book a consultation to meet Sarah in person?", delay_min: 0.3 },
        { direction: "inbound", sender_type: "contact", content: "That sounds perfect! Can we meet this week?", delay_min: 2 },
      ],
    },
    "Mia Johnson": {
      summary: "Won — Elopement package booked, deposit paid, NOIM filed.",
      sentiment: "positive",
      intent: "booking_inquiry",
      messages: [
        { direction: "inbound", sender_type: "contact", content: "We want a small intimate elopement at the Royal Botanic Gardens. Just us and 2 witnesses. Sept 5. Available?", delay_min: 0 },
        { direction: "outbound", sender_type: "ai", content: "Hi Mia! How exciting — an elopement at the Botanic Gardens sounds dreamy! Sarah is available September 5. Her Elopement package ($1,500) is designed exactly for this — intimate, personal, and stress-free. Includes ceremony writing, all legal requirements, and a 30-min photo-friendly ceremony. Want to go ahead?", delay_min: 0.2 },
        { direction: "inbound", sender_type: "contact", content: "Yes!! Send us the deposit link!", delay_min: 1 },
        { direction: "outbound", sender_type: "ai", content: "Amazing! Here's your $200 deposit link to secure September 5: [Payment Link]. Once paid, Sarah will reach out personally to start planning your ceremony. Congratulations, Mia & Noah!", delay_min: 0.2 },
        { direction: "inbound", sender_type: "contact", content: "Paid! So excited!!", delay_min: 10 },
        { direction: "outbound", sender_type: "human", content: "Mia! Sarah here. Just received your deposit — September 5 is officially YOURS! I'll send through the NOIM form this week. Can't wait to create something beautiful for you and Noah. Chat soon!", delay_min: 30 },
      ],
    },
  };

  for (const contact of contacts) {
    const template = conversationTemplates[contact.name];
    if (!template) continue;

    // Create conversation
    const { data: conv, error: convError } = await supabase.from("conversations").insert({
      user_id: USER_ID,
      contact_id: contact.id,
      channel_type: contact.source_channel,
      status: contact.status === "won" ? "closed" : contact.status === "lost" ? "archived" : "active",
      is_ai_active: contact.status !== "won",
      summary: template.summary,
      sentiment: template.sentiment,
      intent: template.intent,
      last_message_at: new Date().toISOString(),
      unread_count: contact.name === "Olivia & Ethan Brown" ? 1 : 0,
    }).select().single();

    if (convError) {
      console.error(`Conversation error for ${contact.name}:`, convError.message);
      continue;
    }

    // Create messages
    const baseTime = new Date(Date.now() - 2 * 3600000); // 2 hours ago
    let cumulativeDelay = 0;

    for (const msg of template.messages) {
      cumulativeDelay += msg.delay_min;
      const msgTime = new Date(baseTime.getTime() + cumulativeDelay * 60000);

      await supabase.from("messages").insert({
        user_id: USER_ID,
        conversation_id: conv.id,
        contact_id: contact.id,
        direction: msg.direction,
        sender_type: msg.sender_type,
        content: msg.content,
        content_type: "text",
        channel_type: contact.source_channel,
        ai_model: msg.sender_type === "ai" ? "claude-sonnet-4-20250514" : null,
        created_at: msgTime.toISOString(),
      });
    }
  }
}

async function seedKnowledgeBase() {
  console.log("Seeding knowledge base...");
  const { data: kb, error: kbError } = await supabase.from("knowledge_bases").insert({
    user_id: USER_ID,
    name: "Sarah's Celebrant Info",
    description: "Pricing, packages, legal requirements, and FAQs for Sarah Mitchell Celebrant",
    is_active: true,
  }).select().single();

  if (kbError || !kb) {
    console.error("Knowledge base error:", kbError?.message);
    return;
  }

  const documents = [
    { title: "Pricing & Packages 2026", file_name: "pricing-2026.pdf", file_type: "application/pdf", status: "ready", chunk_count: 8 },
    { title: "Legal Requirements - NSW Marriages", file_name: "nsw-legal-guide.pdf", file_type: "application/pdf", status: "ready", chunk_count: 12 },
    { title: "FAQ - Common Questions", file_name: "faq.txt", file_type: "text/plain", status: "ready", chunk_count: 6 },
    { title: "Sample Ceremony Scripts", file_name: "ceremony-scripts.pdf", file_type: "application/pdf", status: "ready", chunk_count: 15 },
    { title: "Venue Partnerships", file_name: "venue-list.pdf", file_type: "application/pdf", status: "processing", chunk_count: 0 },
  ];

  for (const doc of documents) {
    await supabase.from("knowledge_documents").insert({
      user_id: USER_ID,
      knowledge_base_id: kb.id,
      ...doc,
    });
  }
}

async function seedAIAgentConfigs() {
  console.log("Seeding AI agent configs...");
  const agents = [
    {
      user_id: USER_ID, agent_type: "concierge", name: "Concierge Agent",
      system_prompt: "You are the concierge for Sarah Mitchell, a marriage celebrant in Sydney. Classify incoming inquiries by intent and route them appropriately.",
      enabled: true, model: "claude-sonnet-4-20250514", max_tokens: 512, temperature: 0.3,
    },
    {
      user_id: USER_ID, agent_type: "knowledge", name: "Knowledge Agent",
      system_prompt: "You are a knowledgeable assistant for Sarah Mitchell Celebrant. Answer questions about pricing, packages, legal requirements, and venues using the provided knowledge base documents.",
      enabled: true, model: "claude-sonnet-4-20250514", max_tokens: 1024, temperature: 0.5,
    },
    {
      user_id: USER_ID, agent_type: "action", name: "Action Agent",
      system_prompt: "You are an action-taking assistant for Sarah Mitchell Celebrant. Check calendar availability, book appointments, generate payment links, and update contact information.",
      enabled: true, model: "claude-sonnet-4-20250514", max_tokens: 1024, temperature: 0.4,
      tools_enabled: ["check_calendar", "book_appointment", "generate_payment_link", "update_contact", "search_knowledge", "escalate_to_human"],
    },
  ];

  for (const agent of agents) {
    await supabase.from("ai_agent_configs").insert(agent);
  }
}

async function seedAnalyticsEvents(contacts: Array<{ id: string }>) {
  console.log("Seeding analytics events...");
  const events = [];
  const now = Date.now();

  for (let i = 0; i < 50; i++) {
    const daysAgo = Math.floor(Math.random() * 30);
    const contactIdx = Math.floor(Math.random() * contacts.length);
    const eventTypes = ["lead_captured", "message_sent", "ai_response", "conversion", "handoff"];
    const channels = ["whatsapp", "instagram", "sms", "web_chat"];

    events.push({
      user_id: USER_ID,
      event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      contact_id: contacts[contactIdx]?.id,
      channel_type: channels[Math.floor(Math.random() * channels.length)],
      created_at: new Date(now - daysAgo * 86400000 - Math.random() * 86400000).toISOString(),
    });
  }

  await supabase.from("analytics_events").insert(events);
}

async function main() {
  console.log("=== LeadFlow AI Seed Script ===\n");

  await clearExisting();
  await seedProfile();
  await seedSubscription();
  const channels = await seedChannels();
  console.log(`  Created ${channels.length} channels`);

  const contacts = await seedContacts();
  console.log(`  Created ${contacts.length} contacts`);

  await seedConversationsAndMessages(contacts);
  await seedKnowledgeBase();
  await seedAIAgentConfigs();
  await seedAnalyticsEvents(contacts);
  await seedBookingSystem(contacts);

  console.log("\n=== Seed complete! ===");
  console.log("Open http://localhost:3000/dashboard to see your data.");
}

async function seedBookingSystem(contacts: Array<{ id: string; name: string }>) {
  console.log("Seeding booking system...");

  // Booking settings
  const { error: settingsError } = await supabase.from("booking_settings").upsert({
    user_id: USER_ID,
    booking_url_slug: "sarah-mitchell",
    business_name: "Sarah Mitchell Celebrant",
    business_description: "Creating beautiful, heartfelt wedding ceremonies across Sydney and the NSW South Coast. Let me help tell your love story.",
    min_notice_hours: 48,
    max_advance_days: 180,
    slot_duration_minutes: 60,
    buffer_minutes: 30,
    require_payment: true,
    deposit_amount_cents: 20000,
    confirmation_message: "Your consultation has been booked! Sarah will be in touch within 24 hours to confirm the details. We look forward to helping you plan your special day!",
    cancellation_policy: "Free cancellation up to 48 hours before your appointment. Cancellations within 48 hours may forfeit the deposit.",
    timezone: "Australia/Sydney",
    allowed_areas: ["Sydney CBD", "Northern Beaches", "Eastern Suburbs", "Inner West", "South Coast", "Blue Mountains", "Hunter Valley"],
  }, { onConflict: "user_id" });
  if (settingsError) console.error("Booking settings error:", settingsError.message);

  // Services
  const serviceData = [
    { user_id: USER_ID, name: "Wedding Ceremony", description: "Full wedding ceremony including ceremony writing, rehearsal, and all legal requirements. 60-90 minute ceremony.", duration_minutes: 90, price_cents: 250000, currency: "AUD", color: "#8b5cf6", sort_order: 0 },
    { user_id: USER_ID, name: "Elopement Package", description: "Intimate ceremony for just the couple and witnesses. Includes ceremony writing and legal documentation.", duration_minutes: 60, price_cents: 150000, currency: "AUD", color: "#ec4899", sort_order: 1 },
    { user_id: USER_ID, name: "Vow Renewal", description: "Celebrate your love all over again with a beautiful vow renewal ceremony.", duration_minutes: 60, price_cents: 180000, currency: "AUD", color: "#f59e0b", sort_order: 2 },
    { user_id: USER_ID, name: "Free Consultation", description: "30-minute chat to discuss your vision, ask questions, and see if we're the right fit.", duration_minutes: 30, price_cents: 0, currency: "AUD", color: "#3b82f6", sort_order: 3 },
    { user_id: USER_ID, name: "Naming Ceremony", description: "Welcome your little one with a personalised naming ceremony surrounded by family and friends.", duration_minutes: 60, price_cents: 80000, currency: "AUD", color: "#10b981", sort_order: 4 },
  ];

  const { data: services, error: svcError } = await supabase.from("services").insert(serviceData).select();
  if (svcError) console.error("Services error:", svcError.message);
  console.log(`  Created ${services?.length ?? 0} services`);

  // Availability: Mon-Fri 9am-5pm, Sat 10am-3pm
  const availData = [
    { user_id: USER_ID, day_of_week: 1, start_time: "09:00", end_time: "17:00", is_active: true },
    { user_id: USER_ID, day_of_week: 2, start_time: "09:00", end_time: "17:00", is_active: true },
    { user_id: USER_ID, day_of_week: 3, start_time: "09:00", end_time: "17:00", is_active: true },
    { user_id: USER_ID, day_of_week: 4, start_time: "09:00", end_time: "17:00", is_active: true },
    { user_id: USER_ID, day_of_week: 5, start_time: "09:00", end_time: "17:00", is_active: true },
    { user_id: USER_ID, day_of_week: 6, start_time: "10:00", end_time: "15:00", is_active: true },
  ];
  const { error: availError } = await supabase.from("availability_schedules").insert(availData);
  if (availError) console.error("Availability error:", availError.message);
  console.log("  Created availability schedules (Mon-Sat)");

  // Blocked dates
  const blockedData = [
    { user_id: USER_ID, blocked_date: "2026-04-25", reason: "ANZAC Day", all_day: true },
    { user_id: USER_ID, blocked_date: "2026-06-08", reason: "Queen's Birthday", all_day: true },
    { user_id: USER_ID, blocked_date: "2026-05-01", reason: "Personal day", all_day: true },
    { user_id: USER_ID, blocked_date: "2026-07-20", reason: "Family vacation", all_day: true },
    { user_id: USER_ID, blocked_date: "2026-07-21", reason: "Family vacation", all_day: true },
    { user_id: USER_ID, blocked_date: "2026-07-22", reason: "Family vacation", all_day: true },
  ];
  const { error: blockedError } = await supabase.from("blocked_dates").insert(blockedData);
  if (blockedError) console.error("Blocked dates error:", blockedError.message);
  console.log(`  Created ${blockedData.length} blocked dates`);

  // Sample bookings
  if (services && services.length > 0) {
    const weddingService = services.find((s: { name: string }) => s.name === "Wedding Ceremony");
    const consultService = services.find((s: { name: string }) => s.name === "Free Consultation");
    const elopementService = services.find((s: { name: string }) => s.name === "Elopement Package");

    const bookings = [
      {
        user_id: USER_ID, service_id: consultService?.id, contact_id: contacts[0]?.id ?? null,
        client_name: "Emily & James Parker", client_email: "emily.parker@email.com", client_phone: "+61 421 555 001",
        booking_date: "2026-04-14", start_time: "10:00", end_time: "10:30",
        status: "confirmed", notes: "Interested in a garden ceremony", area: "Northern Beaches",
        payment_status: "unpaid", payment_amount_cents: 0,
        confirmed_at: new Date("2026-04-08").toISOString(),
      },
      {
        user_id: USER_ID, service_id: weddingService?.id, contact_id: contacts[1]?.id ?? null,
        client_name: "Olivia & Ethan Brown", client_email: "olivia.brown@email.com", client_phone: "+61 421 555 002",
        booking_date: "2026-06-20", start_time: "14:00", end_time: "15:30",
        status: "confirmed", notes: "Outdoor ceremony at Bradleys Head, 80 guests", area: "Sydney CBD",
        location: "Bradleys Head Amphitheatre, Mosman",
        payment_status: "deposit_paid", payment_amount_cents: 20000,
        confirmed_at: new Date("2026-03-15").toISOString(),
      },
      {
        user_id: USER_ID, service_id: elopementService?.id,
        client_name: "Mia & Noah Wilson", client_email: "mia.wilson@email.com", client_phone: "+61 421 555 003",
        booking_date: "2026-09-05", start_time: "11:00", end_time: "12:00",
        status: "pending", notes: "Small intimate elopement at the Royal Botanic Gardens. Just us and 2 witnesses.", area: "Sydney CBD",
        location: "Royal Botanic Gardens, Sydney",
        payment_status: "deposit_paid", payment_amount_cents: 20000,
      },
      {
        user_id: USER_ID, service_id: consultService?.id,
        client_name: "Sophie & Liam Taylor", client_email: "sophie.taylor@email.com", client_phone: "+61 421 555 004",
        booking_date: "2026-04-15", start_time: "14:00", end_time: "14:30",
        status: "pending", notes: "Looking for a celebrant for December wedding", area: "South Coast",
        payment_status: "unpaid", payment_amount_cents: 0,
      },
      {
        user_id: USER_ID, service_id: weddingService?.id,
        client_name: "Grace & Daniel Martinez", client_email: "grace.martinez@email.com", client_phone: "+61 421 555 005",
        booking_date: "2026-03-22", start_time: "15:00", end_time: "16:30",
        status: "completed", notes: "Beach ceremony", area: "Northern Beaches",
        location: "Palm Beach, Sydney",
        payment_status: "paid", payment_amount_cents: 250000,
        confirmed_at: new Date("2026-01-10").toISOString(),
        completed_at: new Date("2026-03-22").toISOString(),
      },
      {
        user_id: USER_ID, service_id: consultService?.id,
        client_name: "Amy & Chris Johnson", client_email: "amy.johnson@email.com",
        booking_date: "2026-04-02", start_time: "11:00", end_time: "11:30",
        status: "cancelled", cancellation_reason: "Changed plans — going with a different vendor",
        payment_status: "unpaid", payment_amount_cents: 0,
        cancelled_at: new Date("2026-03-30").toISOString(),
      },
    ];

    const { error: bookingError } = await supabase.from("bookings").insert(bookings);
    if (bookingError) console.error("Bookings error:", bookingError.message);
    console.log(`  Created ${bookings.length} sample bookings`);
  }
}

main().catch(console.error);
