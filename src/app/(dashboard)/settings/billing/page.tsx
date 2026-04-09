import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";

export default async function BillingSettingsPage() {
  const user = await getUser();
  const supabase = await createServerClient();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      <div className="bg-white border rounded-lg p-6 mb-6">
        <h2 className="font-semibold mb-4">Current Plan</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-bold capitalize">{subscription?.plan ?? "Free"}</p>
            <p className="text-sm text-gray-500">
              Status: <span className="capitalize">{subscription?.status ?? "active"}</span>
            </p>
          </div>
        </div>
      </div>

      {subscription && (
        <div className="bg-white border rounded-lg p-6">
          <h2 className="font-semibold mb-4">Usage This Period</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Messages</span>
                <span>{subscription.message_count_this_period} / {subscription.message_limit}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${Math.min(100, subscription.message_limit > 0 ? (subscription.message_count_this_period / subscription.message_limit) * 100 : 0)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>AI Calls</span>
                <span>{subscription.ai_calls_this_period} / {subscription.ai_calls_limit}</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full"
                  style={{ width: `${Math.min(100, subscription.ai_calls_limit > 0 ? (subscription.ai_calls_this_period / subscription.ai_calls_limit) * 100 : 0)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
