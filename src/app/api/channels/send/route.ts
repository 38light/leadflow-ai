import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth/get-user";
import { createServerClient } from "@/lib/supabase/server";
import { sendMessage } from "@/lib/channels/router";
import { z } from "zod";

const sendSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1).max(10000),
  content_type: z.enum(["text", "image", "audio", "video", "document"]).default("text"),
  media_url: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  const user = await getUser();
  const supabase = await createServerClient();

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let input;
  try {
    input = sendSchema.parse(body);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Get conversation with contact and channel info
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select("*, contact:contacts(*), channel:channels(*)")
    .eq("id", input.conversation_id)
    .eq("user_id", user.id)
    .single();

  if (convError || !conversation) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const contact = conversation.contact;
  const channel = conversation.channel;

  // Determine recipient address
  const to = contact?.phone || contact?.email || "";
  if (!to) {
    return NextResponse.json({ error: "Contact has no phone or email" }, { status: 400 });
  }

  // Send via channel adapter
  const result = await sendMessage({
    to,
    content: input.content,
    contentType: input.content_type,
    mediaUrl: input.media_url,
    channelType: conversation.channel_type,
    channelConfig: channel?.config ?? {},
  });

  // Store the outbound message
  const { data: message, error: msgError } = await supabase
    .from("messages")
    .insert({
      user_id: user.id,
      conversation_id: input.conversation_id,
      contact_id: conversation.contact_id,
      direction: "outbound",
      sender_type: "human",
      content: input.content,
      content_type: input.content_type,
      channel_type: conversation.channel_type,
      external_message_id: result.externalMessageId,
      media_url: input.media_url,
    })
    .select()
    .single();

  if (msgError) {
    return NextResponse.json({ error: msgError.message }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      message,
      delivery: result,
    },
  });
}
