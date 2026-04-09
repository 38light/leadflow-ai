import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";

export async function GET() {
  const user = await getUser();
  const supabase = await createServerClient();

  const [
    { count: totalContacts },
    { count: hotLeads },
    { count: warmLeads },
    { count: totalConversations },
    { count: activeConversations },
    { count: wonContacts },
    { count: lostContacts },
    { count: totalMessages },
    { count: aiMessages },
  ] = await Promise.all([
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("temperature", "hot"),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("temperature", "warm"),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "active"),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "won"),
    supabase.from("contacts").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("status", "lost"),
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("user_id", user.id),
    supabase.from("messages").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("sender_type", "ai"),
  ]);

  const conversionRate = totalContacts && totalContacts > 0
    ? ((wonContacts ?? 0) / totalContacts * 100)
    : 0;

  const handoffRate = totalMessages && totalMessages > 0
    ? (((totalMessages - (aiMessages ?? 0)) / totalMessages) * 100)
    : 0;

  return NextResponse.json({
    data: {
      contacts: {
        total: totalContacts ?? 0,
        hot: hotLeads ?? 0,
        warm: warmLeads ?? 0,
        won: wonContacts ?? 0,
        lost: lostContacts ?? 0,
      },
      conversations: {
        total: totalConversations ?? 0,
        active: activeConversations ?? 0,
      },
      messages: {
        total: totalMessages ?? 0,
        ai: aiMessages ?? 0,
      },
      rates: {
        conversion: Math.round(conversionRate * 10) / 10,
        handoff: Math.round(handoffRate * 10) / 10,
      },
    },
  });
}
