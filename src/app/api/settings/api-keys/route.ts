import { NextRequest, NextResponse } from "next/server";
import { createHash } from "crypto";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { nanoid } from "nanoid";

// GET /api/settings/api-keys — list user's API keys
export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, last_used_at, is_active, created_at")
    .eq("user_id", ctx.ownerId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

// POST /api/settings/api-keys — create a new API key
export async function POST(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name) {
    return NextResponse.json({ error: "Key name is required" }, { status: 400 });
  }
  if (name.length > 100) {
    return NextResponse.json({ error: "Key name must be 100 characters or less" }, { status: 400 });
  }

  // Generate key: lf_live_ + nanoid(32)
  const rawKey = `lf_live_${nanoid(32)}`;
  const keyPrefix = rawKey.slice(0, 12); // first 12 chars for display
  const keyHash = createHash("sha256").update(rawKey).digest("hex");

  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from("api_keys")
    .insert({
      user_id: ctx.ownerId,
      name,
      key_hash: keyHash, // SHA-256 hash — raw key never persisted
      key_prefix: keyPrefix,
      is_active: true,
      scopes: [],
    })
    .select("id, name, key_prefix, is_active, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Return the full key ONCE — it won't be retrievable again
  return NextResponse.json({
    data: {
      ...data,
      key: rawKey, // shown once in response, not stored in plain text after this
    },
  }, { status: 201 });
}
