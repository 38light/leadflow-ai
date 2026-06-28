import { NextRequest, NextResponse } from "next/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createAdminClient } from "@/lib/supabase/server";
import { logAuditEvent } from "@/lib/audit";
import { z } from "zod";

const BulkBodySchema = z.discriminatedUnion("operation", [
  z.object({
    operation: z.literal("archive_contacts"),
    user_id: z.string().uuid(),
  }),
  z.object({
    operation: z.literal("export_contacts"),
    user_id: z.string().uuid(),
  }),
  z.object({
    operation: z.literal("reassign_contacts"),
    user_id: z.string().uuid(),
    target_user_id: z.string().uuid(),
  }),
]);

// POST /api/admin/data/bulk
// Bulk operations on user data
export async function POST(req: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!ctx.isSuperAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = BulkBodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const adminClient = createAdminClient();
  const data = parsed.data;

  switch (data.operation) {
    case "archive_contacts": {
      const { count, error } = await adminClient
        .from("contacts")
        .update({ status: "lost", updated_at: new Date().toISOString() }, { count: "exact" })
        .eq("user_id", data.user_id);

      if (error) {
        console.error("[API]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }

      await logAuditEvent({
        actorId: ctx.user.id,
        actorEmail: ctx.user.email ?? undefined,
        action: "data.bulk_archive_contacts",
        targetType: "user",
        targetId: data.user_id,
        metadata: { archived_count: count ?? 0 },
      });

      return NextResponse.json({ success: true, archived: count ?? 0 });
    }

    case "export_contacts": {
      const { data: contacts, error } = await adminClient
        .from("contacts")
        .select("name, email, phone, status, temperature, created_at")
        .eq("user_id", data.user_id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("[API]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }

      // Build CSV
      const header = "Name,Email,Phone,Status,Temperature,Created At";
      const rows = (contacts ?? []).map((c) => {
        const name = csvEscape(c.name ?? "");
        const email = csvEscape(c.email ?? "");
        const phone = csvEscape(c.phone ?? "");
        const status = csvEscape(c.status ?? "");
        const temperature = csvEscape(c.temperature ?? "");
        const createdAt = csvEscape(c.created_at ?? "");
        return `${name},${email},${phone},${status},${temperature},${createdAt}`;
      });

      const csv = [header, ...rows].join("\n");

      await logAuditEvent({
        actorId: ctx.user.id,
        actorEmail: ctx.user.email ?? undefined,
        action: "data.bulk_export_contacts",
        targetType: "user",
        targetId: data.user_id,
        metadata: { exported_count: contacts?.length ?? 0 },
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="contacts-${data.user_id}-${dateStr}.csv"`,
        },
      });
    }

    case "reassign_contacts": {
      const { target_user_id } = data;

      if (data.user_id === target_user_id) {
        return NextResponse.json(
          { error: "source and target user must be different" },
          { status: 400 }
        );
      }

      // Verify target user exists
      const { data: targetAuthData, error: targetAuthError } =
        await adminClient.auth.admin.getUserById(target_user_id);
      if (targetAuthError || !targetAuthData?.user) {
        return NextResponse.json({ error: "Target user not found" }, { status: 404 });
      }

      const { count, error } = await adminClient
        .from("contacts")
        .update({ user_id: target_user_id, updated_at: new Date().toISOString() }, { count: "exact" })
        .eq("user_id", data.user_id);

      if (error) {
        console.error("[API]", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
      }

      await logAuditEvent({
        actorId: ctx.user.id,
        actorEmail: ctx.user.email ?? undefined,
        action: "data.bulk_reassign_contacts",
        targetType: "user",
        targetId: data.user_id,
        metadata: {
          source_user_id: data.user_id,
          target_user_id,
          reassigned_count: count ?? 0,
        },
      });

      return NextResponse.json({ success: true, reassigned: count ?? 0 });
    }
  }
}

/** Wrap a CSV field in quotes if it contains commas, quotes, or newlines */
function csvEscape(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
