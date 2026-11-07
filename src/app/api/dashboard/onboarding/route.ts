import { NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createAdminClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export type OnboardingItemKey =
  | "profile_complete"
  | "first_visitor_message"
  | "first_delivered_reply"
  | "first_follow_up";

export interface OnboardingItem {
  key: OnboardingItemKey;
  label: string;
  description: string;
  href: string;
  done: boolean;
}

export interface OnboardingResponse {
  ownerId: string;
  currentUserId: string;
  items: OnboardingItem[];
  percent: number;
  allDone: boolean;
}

export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    // Session capabilities are not readable by authenticated database clients.
    // After resolving the workspace, use only tenant-filtered existence checks;
    // never select or return the visitor's session token/hash.
    const supabase = createAdminClient();
    const ownerId = ctx.ownerId;
    const visitorConversation = "id, conversation:conversations!inner(web_chat_sessions!inner(id))";
    const [profile, visitorMessage, deliveredReply, followUp] = await Promise.all([
      supabase.from("profiles").select("business_name").eq("user_id", ownerId).maybeSingle(),
      supabase.from("messages").select(visitorConversation)
        .eq("user_id", ownerId).eq("channel_type", "web_chat")
        .eq("direction", "inbound").eq("sender_type", "contact")
        .eq("conversation.user_id", ownerId).eq("conversation.channel_type", "web_chat")
        .eq("conversation.web_chat_sessions.user_id", ownerId).limit(1),
      supabase.from("messages").select(visitorConversation)
        .eq("user_id", ownerId).eq("channel_type", "web_chat")
        .eq("direction", "outbound").not("delivered_at", "is", null)
        .eq("conversation.user_id", ownerId).eq("conversation.channel_type", "web_chat")
        .eq("conversation.web_chat_sessions.user_id", ownerId).limit(1),
      supabase.from("follow_ups").select("id").eq("user_id", ownerId).limit(1),
    ]);

    for (const result of [profile, visitorMessage, deliveredReply, followUp]) {
      if (result.error) throw result.error;
    }

    const items: OnboardingItem[] = [
      {
        key: "profile_complete",
        label: "Add your business name",
        description: "Give visitors the right business identity in web chat.",
        href: "/settings/profile",
        done: Boolean(profile.data?.business_name?.trim()),
      },
      {
        key: "first_visitor_message",
        label: "Receive a visitor message",
        description: "Open your web chat preview and send a message to your inbox.",
        href: "/settings/widget",
        done: (visitorMessage.data?.length ?? 0) > 0,
      },
      {
        key: "first_delivered_reply",
        label: "Get a reply back to the visitor",
        description: "Reply from your inbox, then keep the visitor chat open until the reply appears.",
        href: "/conversations",
        done: (deliveredReply.data?.length ?? 0) > 0,
      },
      {
        key: "first_follow_up",
        label: "Plan the next step",
        description: "Open a contact and add a follow-up with an owner and a due date.",
        href: "/contacts",
        done: (followUp.data?.length ?? 0) > 0,
      },
    ];
    const doneCount = items.filter((item) => item.done).length;
    const data: OnboardingResponse = {
      ownerId,
      currentUserId: ctx.user.id,
      items,
      percent: Math.round((doneCount / items.length) * 100),
      allDone: doneCount === items.length,
    };
    return NextResponse.json({ data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[Pilot onboarding]", error);
    return NextResponse.json({ error: "Could not load your pilot checklist. Please try again." }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
