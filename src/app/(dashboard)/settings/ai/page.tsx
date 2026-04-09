import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";

export default async function AISettingsPage() {
  const user = await getUser();
  const supabase = await createServerClient();

  const { data: agentConfigs } = await supabase
    .from("ai_agent_configs")
    .select("*")
    .eq("user_id", user.id)
    .order("agent_type");

  const agentTypes = [
    { type: "concierge", title: "Concierge Agent", description: "Classifies intent, sentiment, and routes conversations" },
    { type: "knowledge", title: "Knowledge Agent", description: "Answers questions using your uploaded documents (RAG)" },
    { type: "action", title: "Action Agent", description: "Takes actions: books appointments, creates deals, sends payments" },
  ];

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">AI Configuration</h1>
      <div className="space-y-4">
        {agentTypes.map((agent) => {
          const config = agentConfigs?.find((c) => c.agent_type === agent.type);
          return (
            <div key={agent.type} className="bg-white border rounded-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{agent.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">{agent.description}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${config?.enabled !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                  {config?.enabled !== false ? "Enabled" : "Disabled"}
                </span>
              </div>
              {config && (
                <div className="mt-3 text-xs text-gray-500">
                  Model: {config.model} &middot; Max tokens: {config.max_tokens}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
