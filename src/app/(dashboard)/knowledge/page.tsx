import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";

export default async function KnowledgePage() {
  const user = await getUser();
  const supabase = await createServerClient();

  const { data: knowledgeBases } = await supabase
    .from("knowledge_bases")
    .select("*, documents:knowledge_documents(count)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Knowledge Base</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {knowledgeBases?.map((kb) => (
          <div key={kb.id} className="bg-white border rounded-lg p-6 hover:shadow-sm transition-shadow">
            <h3 className="font-semibold">{kb.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{kb.description ?? "No description"}</p>
            <div className="flex items-center gap-2 mt-4">
              <span className={`text-xs px-2 py-1 rounded-full ${kb.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                {kb.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {(!knowledgeBases || knowledgeBases.length === 0) && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg font-medium">No knowledge bases yet</p>
          <p className="text-sm mt-1">Upload documents to help your AI assistant answer questions.</p>
        </div>
      )}
    </div>
  );
}
