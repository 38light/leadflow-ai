"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";

const BUSINESS_TYPE_OPTIONS = [
  { value: "agency", label: "Agency" },
  { value: "consultant", label: "Consultant" },
  { value: "freelancer", label: "Freelancer" },
  { value: "other", label: "Other" },
];

const TIMEZONE_OPTIONS = [
  { value: "Pacific/Midway", label: "UTC-11:00 — Midway Island" },
  { value: "Pacific/Honolulu", label: "UTC-10:00 — Hawaii" },
  { value: "America/Anchorage", label: "UTC-09:00 — Alaska" },
  { value: "America/Los_Angeles", label: "UTC-08:00 — Pacific Time (US & Canada)" },
  { value: "America/Denver", label: "UTC-07:00 — Mountain Time (US & Canada)" },
  { value: "America/Chicago", label: "UTC-06:00 — Central Time (US & Canada)" },
  { value: "America/New_York", label: "UTC-05:00 — Eastern Time (US & Canada)" },
  { value: "America/Halifax", label: "UTC-04:00 — Atlantic Time (Canada)" },
  { value: "America/Sao_Paulo", label: "UTC-03:00 — Brasilia" },
  { value: "Atlantic/South_Georgia", label: "UTC-02:00 — Mid-Atlantic" },
  { value: "Atlantic/Azores", label: "UTC-01:00 — Azores" },
  { value: "Europe/London", label: "UTC+00:00 — London, Dublin" },
  { value: "Europe/Paris", label: "UTC+01:00 — Paris, Berlin, Rome" },
  { value: "Europe/Helsinki", label: "UTC+02:00 — Helsinki, Athens" },
  { value: "Europe/Moscow", label: "UTC+03:00 — Moscow" },
  { value: "Asia/Dubai", label: "UTC+04:00 — Dubai, Abu Dhabi" },
  { value: "Asia/Karachi", label: "UTC+05:00 — Karachi, Islamabad" },
  { value: "Asia/Kolkata", label: "UTC+05:30 — Mumbai, New Delhi" },
  { value: "Asia/Dhaka", label: "UTC+06:00 — Dhaka" },
  { value: "Asia/Bangkok", label: "UTC+07:00 — Bangkok, Hanoi" },
  { value: "Asia/Shanghai", label: "UTC+08:00 — Beijing, Singapore" },
  { value: "Asia/Tokyo", label: "UTC+09:00 — Tokyo, Osaka" },
  { value: "Australia/Sydney", label: "UTC+10:00 — Sydney, Melbourne" },
  { value: "Pacific/Auckland", label: "UTC+12:00 — Auckland" },
];

export interface ProfileFormData {
  business_name: string | null;
  business_type: string | null;
  timezone: string | null;
  phone: string | null;
  website: string | null;
}

interface ProfileFormProps {
  initialData: ProfileFormData;
  email?: string;
}

export function ProfileForm({ initialData, email }: ProfileFormProps) {
  const { toast } = useToast();

  const [businessName, setBusinessName] = useState(initialData.business_name ?? "");
  const [businessType, setBusinessType] = useState(initialData.business_type ?? "");
  const [timezone, setTimezone] = useState(initialData.timezone ?? "Australia/Sydney");
  const [phone, setPhone] = useState(initialData.phone ?? "");
  const [website, setWebsite] = useState(initialData.website ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await fetch("/api/settings/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          business_name: businessName || null,
          business_type: businessType || null,
          timezone: timezone || undefined,
          phone: phone || null,
          website: website || null,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        toast(json.error ?? "Failed to save profile", "error");
      } else {
        toast("Profile updated", "success");
      }
    } catch {
      toast("An unexpected error occurred", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border rounded-lg p-6 space-y-5">
      {/* Email — read-only */}
      {email && (
        <div className="space-y-1">
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <p className="text-sm text-gray-500 py-2">{email}</p>
        </div>
      )}

      <Input
        id="business_name"
        label="Business Name"
        value={businessName}
        onChange={(e) => setBusinessName(e.target.value)}
        placeholder="Acme Consulting"
        maxLength={200}
      />

      <Select
        id="business_type"
        label="Business Type"
        value={businessType}
        onChange={(e) => setBusinessType(e.target.value)}
        options={BUSINESS_TYPE_OPTIONS}
        placeholder="Select type…"
      />

      <Select
        id="timezone"
        label="Timezone"
        value={timezone}
        onChange={(e) => setTimezone(e.target.value)}
        options={TIMEZONE_OPTIONS}
      />

      <Input
        id="phone"
        label="Phone"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+61 400 000 000"
        maxLength={20}
      />

      <Input
        id="website"
        label="Website"
        type="url"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        placeholder="https://example.com"
        maxLength={500}
      />

      <div className="pt-2">
        <Button type="submit" loading={saving} disabled={saving}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
