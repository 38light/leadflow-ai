import { NextRequest, NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";

const PostBodySchema = z.object({
  content: z.string().min(1, "Content is required").max(5000, "Content too long"),
});

// GET /api/admin/users/[id]/notes — returns all notes for user (newest first)
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("admin_notes")
    .select("id, target_user_id, author_id, author_email, content, created_at, updated_at")
    .eq("target_user_id", id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

// POST /api/admin/users/[id]/notes — creates a note
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = PostBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request body", details: parsed.error.flatten() }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .from("admin_notes")
    .insert({
      target_user_id: id,
      author_id: ctx.user.id,
      author_email: ctx.user.email ?? null,
      content: parsed.data.content,
    })
    .select("id, target_user_id, author_id, author_email, content, created_at, updated_at")
    .single();

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}

// DELETE /api/admin/users/[id]/notes?note_id=xxx — deletes a note
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const noteId = searchParams.get("note_id");

  if (!noteId) {
    return NextResponse.json({ error: "note_id query parameter is required" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Fetch the note to verify ownership or super admin
  const { data: note, error: fetchError } = await adminClient
    .from("admin_notes")
    .select("id, target_user_id, author_id")
    .eq("id", noteId)
    .eq("target_user_id", id)
    .single();

  if (fetchError || !note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  // Only author or super admin can delete
  if (note.author_id !== ctx.user.id && !ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { error } = await adminClient
    .from("admin_notes")
    .delete()
    .eq("id", noteId);

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data: { deleted: true } });
}
