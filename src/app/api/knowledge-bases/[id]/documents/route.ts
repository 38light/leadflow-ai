import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  const supabase = await createServerClient();
  const { id } = await params;

  const { data, error } = await supabase
    .from("knowledge_documents")
    .select("*")
    .eq("knowledge_base_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getUser();
  const supabase = await createServerClient();
  const { id } = await params;

  // Verify knowledge base belongs to user
  const { error: kbError } = await supabase
    .from("knowledge_bases")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (kbError) {
    return NextResponse.json({ error: "Knowledge base not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const title = formData.get("title") as string | null;

  if (!file) {
    return NextResponse.json({ error: "File is required" }, { status: 400 });
  }

  if (!title) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  // Upload file to Supabase Storage
  const storagePath = `${user.id}/${id}/${Date.now()}-${file.name}`;
  const { error: uploadError } = await supabase.storage
    .from("knowledge-docs")
    .upload(storagePath, file);

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  // Create document record
  const { data: doc, error: docError } = await supabase
    .from("knowledge_documents")
    .insert({
      user_id: user.id,
      knowledge_base_id: id,
      title,
      file_name: file.name,
      file_type: file.type,
      storage_path: storagePath,
      status: "pending",
    })
    .select()
    .single();

  if (docError) {
    return NextResponse.json({ error: docError.message }, { status: 500 });
  }

  // TODO: Phase 3 — trigger document processing (chunking + embedding)

  return NextResponse.json({ data: doc }, { status: 201 });
}
