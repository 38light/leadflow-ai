import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { LEAD_STATUSES, TEMPERATURES } from "@/constants/app";

export default async function ContactsPage() {
  const user = await getUser();
  const supabase = await createServerClient();

  const { data: contacts, count } = await supabase
    .from("contacts")
    .select("*", { count: "exact" })
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(25);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Contacts</h1>
          <p className="text-sm text-gray-500">{count ?? 0} total contacts</p>
        </div>
      </div>

      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Temp</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {contacts?.map((contact) => {
              const statusConfig = LEAD_STATUSES.find((s) => s.value === contact.status);
              const tempConfig = TEMPERATURES.find((t) => t.value === contact.temperature);
              return (
                <tr key={contact.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{contact.name ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{contact.email ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{contact.source_channel ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusConfig?.color ?? "bg-gray-100 text-gray-800"}`}>
                      {statusConfig?.label ?? contact.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${tempConfig?.color ?? "bg-gray-100 text-gray-800"}`}>
                      {tempConfig?.label ?? contact.temperature}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(contact.created_at).toLocaleDateString()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {(!contacts || contacts.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg font-medium">No contacts yet</p>
            <p className="text-sm mt-1">Contacts will appear here as leads come in.</p>
          </div>
        )}
      </div>
    </div>
  );
}
