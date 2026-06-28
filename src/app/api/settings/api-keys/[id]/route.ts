import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";

// DELETE /api/settings/api-keys/[id] — revoke an API key (set is_active=false)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("api_keys")
    .update({ is_active: false })
    .eq("id", id)
    .eq("user_id", ctx.ownerId)
    .select("id, name, is_active")
    .single();

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data });
}
