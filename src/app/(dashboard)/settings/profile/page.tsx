import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";

export default async function ProfileSettingsPage() {
  const user = await getUser();
  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      <div className="bg-white border rounded-lg p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
          <p className="text-sm">{profile?.business_name ?? "Not set"}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Business Type</label>
          <p className="text-sm">{profile?.business_type ?? "Not set"}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
          <p className="text-sm">{profile?.timezone ?? "Australia/Sydney"}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <p className="text-sm">{profile?.phone ?? "Not set"}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
          <p className="text-sm">{profile?.website ?? "Not set"}</p>
        </div>
      </div>
    </div>
  );
}
