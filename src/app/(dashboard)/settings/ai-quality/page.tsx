import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { AIQualityForm, type AIQualityFormData } from "@/components/settings/ai-quality-form";

export default async function AIQualitySettingsPage() {
  const user = await getUser();
  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "ai_confidence_threshold, require_approval, ai_memory_depth, training_data_opt_out, default_language"
    )
    .eq("user_id", user.id)
    .single();

  const initialData: AIQualityFormData = {
    ai_confidence_threshold: profile?.ai_confidence_threshold ?? 0,
    require_approval: profile?.require_approval ?? false,
    ai_memory_depth: profile?.ai_memory_depth ?? 3,
    training_data_opt_out: profile?.training_data_opt_out ?? false,
    default_language: profile?.default_language ?? "en",
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-2">AI Quality</h1>
      <p className="text-sm text-gray-500 mb-6">
        Tune trust, memory, and language defaults for your AI agents.
      </p>
      <AIQualityForm initialData={initialData} />
    </div>
  );
}
