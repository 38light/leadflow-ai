import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { notFound } from "next/navigation";
import { LEAD_STATUSES, TEMPERATURES } from "@/constants/app";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  const supabase = await createServerClient();
  const { id } = await params;

  const { data: contact } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!contact) notFound();

  const { data: conversations } = await supabase
    .from("conversations")
    .select("*")
    .eq("contact_id", id)
    .eq("user_id", user.id)
    .order("last_message_at", { ascending: false });

  const statusConfig = LEAD_STATUSES.find((s) => s.value === contact.status);
  const tempConfig = TEMPERATURES.find((t) => t.value === contact.temperature);

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{contact.name ?? "Unknown Contact"}</h1>
        <div className="flex gap-2 mt-2">
          <span className={`text-xs px-2 py-1 rounded-full ${statusConfig?.color ?? ""}`}>
            {statusConfig?.label ?? contact.status}
          </span>
          <span className={`text-xs px-2 py-1 rounded-full ${tempConfig?.color ?? ""}`}>
            {tempConfig?.label ?? contact.temperature}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-4">Details</h2>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-gray-500">Email</dt><dd>{contact.email ?? "—"}</dd></div>
            <div><dt className="text-gray-500">Phone</dt><dd>{contact.phone ?? "—"}</dd></div>
            <div><dt className="text-gray-500">Company</dt><dd>{contact.company ?? "—"}</dd></div>
            <div><dt className="text-gray-500">Source</dt><dd>{contact.source_channel ?? "—"}</dd></div>
            <div><dt className="text-gray-500">Score</dt><dd>{contact.score}</dd></div>
          </dl>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-4">Conversations ({conversations?.length ?? 0})</h2>
          <div className="space-y-2">
            {conversations?.map((conv) => (
              <div key={conv.id} className="p-3 border rounded hover:bg-gray-50">
                <p className="text-sm font-medium">{conv.channel_type}</p>
                <p className="text-xs text-gray-500">{conv.status} &middot; {conv.unread_count ?? 0} unread</p>
              </div>
            ))}
            {(!conversations || conversations.length === 0) && (
              <p className="text-sm text-gray-400">No conversations yet.</p>
            )}
          </div>
        </div>
      </div>

      {contact.metadata && Object.keys(contact.metadata).length > 0 && (
        <div className="mt-6 bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-4">Extracted Data</h2>
          <dl className="space-y-2 text-sm">
            {Object.entries(contact.metadata).map(([key, value]) => (
              <div key={key}>
                <dt className="text-gray-500 capitalize">{key.replace(/_/g, " ")}</dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
