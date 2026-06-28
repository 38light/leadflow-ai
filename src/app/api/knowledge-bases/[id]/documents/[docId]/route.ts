import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const user = await getUser();
  const supabase = await createServerClient();
  const { id, docId } = await params;

  // Fetch the document to get the storage path before deleting
  const { data: doc, error: fetchError } = await supabase
    .from("knowledge_documents")
    .select("storage_path")
    .eq("id", docId)
    .eq("knowledge_base_id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  // Remove from storage if there is a path
  if (doc.storage_path) {
    await supabase.storage
      .from("knowledge-docs")
      .remove([doc.storage_path]);
  }

  const { error } = await supabase
    .from("knowledge_documents")
    .delete()
    .eq("id", docId)
    .eq("knowledge_base_id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: { success: true } });
}
