import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { notFound } from "next/navigation";

export default async function KnowledgeBaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getUser();
  const supabase = await createServerClient();
  const { id } = await params;

  const { data: knowledgeBase } = await supabase
    .from("knowledge_bases")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!knowledgeBase) notFound();

  const { data: documents } = await supabase
    .from("knowledge_documents")
    .select("*")
    .eq("knowledge_base_id", id)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{knowledgeBase.name}</h1>
        {knowledgeBase.description && (
          <p className="text-gray-500 mt-1">{knowledgeBase.description}</p>
        )}
      </div>

      <div className="bg-white border rounded-lg">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Documents ({documents?.length ?? 0})</h2>
        </div>

        <div className="divide-y">
          {documents?.map((doc) => (
            <div key={doc.id} className="px-6 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{doc.title}</p>
                <p className="text-xs text-gray-500">
                  {doc.file_name} &middot; {doc.file_type}
                </p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${
                doc.status === "ready" ? "bg-green-100 text-green-800" :
                doc.status === "processing" ? "bg-yellow-100 text-yellow-800" :
                doc.status === "error" ? "bg-red-100 text-red-800" :
                "bg-gray-100 text-gray-800"
              }`}>
                {doc.status}
              </span>
            </div>
          ))}
          {(!documents || documents.length === 0) && (
            <div className="px-6 py-8 text-center text-gray-400 text-sm">
              No documents uploaded yet. Upload PDFs, text files, or documents to train your AI.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
