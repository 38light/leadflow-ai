import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { CHANNEL_TYPES } from "@/constants/app";
export default async function ChannelsPage() {
  const user = await getUser();
  const supabase = await createServerClient();

  const { data: channels } = await supabase
    .from("channels")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Channels</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {CHANNEL_TYPES.map((channelType) => {
          const configured = channels?.find((c) => c.type === channelType.value);
          return (
            <div
              key={channelType.value}
              className={`bg-white border rounded-lg p-6 ${configured ? "border-green-200" : "border-dashed"}`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${configured ? "bg-green-100" : "bg-gray-100"}`}>
                  <span className="text-lg">{channelType.label.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="font-semibold">{channelType.label}</h3>
                  <p className="text-xs text-gray-500">
                    {configured ? (configured.is_active ? "Active" : "Paused") : "Not configured"}
                  </p>
                </div>
              </div>
              {configured && (
                <p className="text-sm text-gray-500 mt-3">{configured.name}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
