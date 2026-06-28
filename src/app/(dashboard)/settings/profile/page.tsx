import { createServerClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth/get-user";
import { ProfileForm } from "@/components/settings/profile-form";
import type { ProfileFormData } from "@/components/settings/profile-form";

export default async function ProfileSettingsPage() {
  const user = await getUser();
  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("business_name, business_type, timezone, phone, website")
    .eq("user_id", user.id)
    .single();

  const initialData: ProfileFormData = {
    business_name: profile?.business_name ?? null,
    business_type: profile?.business_type ?? null,
    timezone: profile?.timezone ?? "Australia/Sydney",
    phone: profile?.phone ?? null,
    website: profile?.website ?? null,
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Profile Settings</h1>
      <ProfileForm initialData={initialData} email={user.email} />
    </div>
  );
}
