import { NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createServerClient } from "@/lib/supabase/server";

export type OnboardingItemKey =
  | "profile_complete"
  | "channel_connected"
  | "knowledge_uploaded"
  | "service_created"
  | "availability_set"
  | "team_invited"
  | "first_contact";

export interface OnboardingItem {
  key: OnboardingItemKey;
  label: string;
  description: string;
  href: string;
  done: boolean;
}

export interface OnboardingResponse {
  items: OnboardingItem[];
  percent: number;
  allDone: boolean;
  hasContacts: boolean;
}

export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerClient();
  const ownerId = ctx.ownerId;

  const [
    profileRes,
    activeChannelRes,
    knowledgeRes,
    serviceRes,
    availabilityRes,
    teamMemberRes,
    teamInviteRes,
    contactRes,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("business_name, twilio_account_sid, meta_page_id, vapi_api_key, hubspot_access_token")
      .eq("user_id", ownerId)
      .maybeSingle(),
    supabase
      .from("channels")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ownerId)
      .eq("is_active", true),
    supabase
      .from("knowledge_documents")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ownerId),
    supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ownerId),
    supabase
      .from("availability_schedules")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ownerId),
    supabase
      .from("team_members")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", ownerId),
    supabase
      .from("team_invitations")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", ownerId),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ownerId),
  ]);

  const profile = profileRes.data ?? null;
  const profileComplete = !!profile?.business_name && profile.business_name.trim().length > 0;

  const hasActiveChannel = (activeChannelRes.count ?? 0) > 0;
  const hasIntegrationKey = !!(
    profile?.twilio_account_sid ||
    profile?.meta_page_id ||
    profile?.vapi_api_key ||
    profile?.hubspot_access_token
  );
  const channelConnected = hasActiveChannel || hasIntegrationKey;

  const knowledgeUploaded = (knowledgeRes.count ?? 0) > 0;
  const serviceCreated = (serviceRes.count ?? 0) > 0;
  const availabilitySet = (availabilityRes.count ?? 0) > 0;
  const teamInvited = (teamMemberRes.count ?? 0) > 0 || (teamInviteRes.count ?? 0) > 0;
  const hasContacts = (contactRes.count ?? 0) > 0;

  const items: OnboardingItem[] = [
    {
      key: "profile_complete",
      label: "Complete your profile",
      description: "Add your business name so AI knows who it represents",
      href: "/settings/profile",
      done: profileComplete,
    },
    {
      key: "channel_connected",
      label: "Connect a messaging channel",
      description: "WhatsApp, SMS, Instagram, or another channel to receive leads",
      href: "/settings/integrations",
      done: channelConnected,
    },
    {
      key: "knowledge_uploaded",
      label: "Upload knowledge",
      description: "Give the AI documents about your business so it can answer questions",
      href: "/knowledge",
      done: knowledgeUploaded,
    },
    {
      key: "service_created",
      label: "Add a service",
      description: "Define what you sell so the AI can recommend the right fit",
      href: "/settings",
      done: serviceCreated,
    },
    {
      key: "availability_set",
      label: "Set your availability",
      description: "Tell the AI when you can take meetings",
      href: "/settings",
      done: availabilitySet,
    },
    {
      key: "team_invited",
      label: "Invite a teammate",
      description: "Bring others in to handle conversations together",
      href: "/settings/team",
      done: teamInvited,
    },
    {
      key: "first_contact",
      label: "Get your first contact",
      description: "Send traffic to your channel and watch leads land here",
      href: "/contacts",
      done: hasContacts,
    },
  ];

  const doneCount = items.filter((i) => i.done).length;
  const percent = Math.round((doneCount / items.length) * 100);
  const allDone = doneCount === items.length;

  const response: OnboardingResponse = {
    items,
    percent,
    allDone,
    hasContacts,
  };

  return NextResponse.json({ data: response });
}
