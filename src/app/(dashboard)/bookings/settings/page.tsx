"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  Settings,
  Plus,
  Trash2,
  Check,
  X,
  Edit,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface AvailabilitySchedule {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  currency: string;
  is_active: boolean;
  color: string;
  sort_order: number;
}

interface BlockedDate {
  id: string;
  blocked_date: string;
  reason: string | null;
  all_day: boolean;
  created_at: string;
}

interface BookingSettings {
  id: string;
  booking_url_slug: string | null;
  business_name: string | null;
  business_description: string | null;
  min_notice_hours: number;
  max_advance_days: number;
  slot_duration_minutes: number;
  buffer_minutes: number;
  require_payment: boolean;
  deposit_amount_cents: number;
  confirmation_message: string | null;
  cancellation_policy: string | null;
  timezone: string;
  allowed_areas: string[];
  hide_branding: boolean;
  subscription_tier: string;
}

type TabKey = "availability" | "services" | "blocked" | "settings";

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];

const PRESET_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#6366f1",
];

const SLOT_DURATION_OPTIONS = [15, 30, 45, 60, 90, 120];
const BUFFER_OPTIONS = [0, 5, 10, 15, 20, 30, 45, 60];

const TIMEZONES = [
  "Australia/Sydney",
  "Australia/Melbourne",
  "Australia/Brisbane",
  "Australia/Perth",
  "Australia/Adelaide",
  "Australia/Hobart",
  "Australia/Darwin",
  "Pacific/Auckland",
  "Asia/Tokyo",
  "Asia/Singapore",
  "Asia/Hong_Kong",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "UTC",
];

const TABS: { key: TabKey; label: string; icon: typeof Calendar }[] = [
  { key: "availability", label: "Availability", icon: Clock },
  { key: "services", label: "Services", icon: Calendar },
  { key: "blocked", label: "Blocked Dates", icon: X },
  { key: "settings", label: "Settings", icon: Settings },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatTime12(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const m = mStr;
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${m} ${ampm}`;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Generate time options in 15-min increments for selects */
function timeOptions(): string[] {
  const options: string[] = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      options.push(
        `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
      );
    }
  }
  return options;
}

const TIME_OPTIONS = timeOptions();

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */

export default function BookingSettingsPage() {
  const [tab, setTab] = useState<TabKey>("availability");
  const [loading, setLoading] = useState(true);

  // Availability state
  const [availability, setAvailability] = useState<AvailabilitySchedule[]>([]);
  const [availSaving, setAvailSaving] = useState(false);
  const [availMessage, setAvailMessage] = useState<string | null>(null);

  // Services state
  const [services, setServices] = useState<Service[]>([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    duration_minutes: 60,
    price_cents: 0,
    color: "#3b82f6",
    is_active: true,
  });
  const [serviceSaving, setServiceSaving] = useState(false);

  // Blocked dates state
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [blockForm, setBlockForm] = useState({ blocked_date: "", reason: "" });
  const [blockSaving, setBlockSaving] = useState(false);

  // Settings state
  const [settings, setSettings] = useState<BookingSettings | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null);
  const [areaInput, setAreaInput] = useState("");

  /* ================================================================ */
  /*  AVAILABILITY                                                     */
  /* ================================================================ */

  const fetchAvailability = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings/availability");
      if (res.ok) {
        const json = await res.json();
        const existing: AvailabilitySchedule[] = json.data ?? [];

        // Build a 7-day grid: one entry per day
        const grid: AvailabilitySchedule[] = DAY_NAMES.map((_, i) => {
          const found = existing.find((s) => s.day_of_week === i);
          return found
            ? { ...found }
            : {
                day_of_week: i,
                start_time: "09:00",
                end_time: "17:00",
                is_active: i >= 1 && i <= 5, // Mon-Fri active by default
              };
        });
        setAvailability(grid);
      }
    } catch {
      // silently fail
    }
  }, []);

  async function saveAvailability() {
    setAvailSaving(true);
    setAvailMessage(null);
    try {
      const res = await fetch("/api/bookings/availability", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          schedules: availability.map((s) => ({
            day_of_week: s.day_of_week,
            start_time: s.start_time,
            end_time: s.end_time,
            is_active: s.is_active,
          })),
        }),
      });
      if (res.ok) {
        setAvailMessage("Availability saved successfully.");
        await fetchAvailability();
      } else {
        const json = await res.json();
        setAvailMessage(json.error ?? "Failed to save availability.");
      }
    } catch {
      setAvailMessage("Network error. Please try again.");
    } finally {
      setAvailSaving(false);
      setTimeout(() => setAvailMessage(null), 3000);
    }
  }

  /* ================================================================ */
  /*  SERVICES                                                         */
  /* ================================================================ */

  const fetchServices = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings/services");
      if (res.ok) {
        const json = await res.json();
        setServices(json.data ?? []);
      }
    } catch {
      // silently fail
    }
  }, []);

  function resetServiceForm() {
    setServiceForm({
      name: "",
      description: "",
      duration_minutes: 60,
      price_cents: 0,
      color: "#3b82f6",
      is_active: true,
    });
    setEditingServiceId(null);
    setShowServiceForm(false);
  }

  function startEditService(service: Service) {
    setServiceForm({
      name: service.name,
      description: service.description ?? "",
      duration_minutes: service.duration_minutes,
      price_cents: service.price_cents,
      color: service.color,
      is_active: service.is_active,
    });
    setEditingServiceId(service.id);
    setShowServiceForm(true);
  }

  async function saveService() {
    if (!serviceForm.name.trim()) return;
    setServiceSaving(true);
    try {
      const payload = {
        name: serviceForm.name.trim(),
        description: serviceForm.description.trim() || null,
        duration_minutes: serviceForm.duration_minutes,
        price_cents: serviceForm.price_cents,
        color: serviceForm.color,
        is_active: serviceForm.is_active,
      };

      const isEdit = editingServiceId !== null;
      const url = isEdit
        ? `/api/bookings/services/${editingServiceId}`
        : "/api/bookings/services";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        resetServiceForm();
        await fetchServices();
      }
    } finally {
      setServiceSaving(false);
    }
  }

  async function deleteService(id: string) {
    if (!confirm("Are you sure you want to delete this service?")) return;
    try {
      const res = await fetch(`/api/bookings/services/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchServices();
      }
    } catch {
      // silently fail
    }
  }

  async function toggleServiceActive(service: Service) {
    try {
      await fetch(`/api/bookings/services/${service.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_active: !service.is_active }),
      });
      await fetchServices();
    } catch {
      // silently fail
    }
  }

  /* ================================================================ */
  /*  BLOCKED DATES                                                    */
  /* ================================================================ */

  const fetchBlockedDates = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings/blocked-dates");
      if (res.ok) {
        const json = await res.json();
        setBlockedDates(json.data ?? []);
      }
    } catch {
      // silently fail
    }
  }, []);

  async function addBlockedDate() {
    if (!blockForm.blocked_date) return;
    setBlockSaving(true);
    try {
      const res = await fetch("/api/bookings/blocked-dates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blocked_date: blockForm.blocked_date,
          reason: blockForm.reason.trim() || null,
          all_day: true,
        }),
      });
      if (res.ok) {
        setBlockForm({ blocked_date: "", reason: "" });
        await fetchBlockedDates();
      }
    } finally {
      setBlockSaving(false);
    }
  }

  async function deleteBlockedDate(id: string) {
    try {
      const res = await fetch(`/api/bookings/blocked-dates/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchBlockedDates();
      }
    } catch {
      // silently fail
    }
  }

  /* ================================================================ */
  /*  SETTINGS                                                         */
  /* ================================================================ */

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/bookings/settings");
      if (res.ok) {
        const json = await res.json();
        setSettings(json.data ?? null);
      }
    } catch {
      // silently fail
    }
  }, []);

  async function saveSettings() {
    if (!settings) return;
    setSettingsSaving(true);
    setSettingsMessage(null);
    try {
      const res = await fetch("/api/bookings/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          booking_url_slug: settings.booking_url_slug || null,
          business_name: settings.business_name || null,
          business_description: settings.business_description || null,
          min_notice_hours: settings.min_notice_hours,
          max_advance_days: settings.max_advance_days,
          slot_duration_minutes: settings.slot_duration_minutes,
          buffer_minutes: settings.buffer_minutes,
          require_payment: settings.require_payment,
          deposit_amount_cents: settings.deposit_amount_cents,
          confirmation_message: settings.confirmation_message || undefined,
          cancellation_policy: settings.cancellation_policy || null,
          timezone: settings.timezone,
          allowed_areas: settings.allowed_areas,
          hide_branding: settings.hide_branding,
        }),
      });
      if (res.ok) {
        setSettingsMessage("Settings saved successfully.");
        await fetchSettings();
      } else {
        const json = await res.json();
        setSettingsMessage(json.error ?? "Failed to save settings.");
      }
    } catch {
      setSettingsMessage("Network error. Please try again.");
    } finally {
      setSettingsSaving(false);
      setTimeout(() => setSettingsMessage(null), 3000);
    }
  }

  function addArea() {
    const trimmed = areaInput.trim();
    if (!trimmed || !settings) return;
    if (settings.allowed_areas.includes(trimmed)) {
      setAreaInput("");
      return;
    }
    setSettings({
      ...settings,
      allowed_areas: [...settings.allowed_areas, trimmed],
    });
    setAreaInput("");
  }

  function removeArea(area: string) {
    if (!settings) return;
    setSettings({
      ...settings,
      allowed_areas: settings.allowed_areas.filter((a) => a !== area),
    });
  }

  /* ================================================================ */
  /*  INITIAL LOAD                                                     */
  /* ================================================================ */

  useEffect(() => {
    async function loadAll() {
      setLoading(true);
      await Promise.all([
        fetchAvailability(),
        fetchServices(),
        fetchBlockedDates(),
        fetchSettings(),
      ]);
      setLoading(false);
    }
    loadAll();
  }, [fetchAvailability, fetchServices, fetchBlockedDates, fetchSettings]);

  /* ================================================================ */
  /*  LOADING SKELETON                                                 */
  /* ================================================================ */

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Booking Settings</h1>
            <p className="text-sm text-gray-500">
              Configure your booking system
            </p>
          </div>
        </div>

        <div className="flex gap-1 mb-6 border-b">
          {TABS.map((t) => (
            <div
              key={t.key}
              className="h-10 w-24 bg-gray-100 rounded-t-lg animate-pulse"
            />
          ))}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
                <div className="h-8 w-12 bg-gray-200 rounded-full animate-pulse" />
                <div className="h-8 flex-1 bg-gray-100 rounded animate-pulse" />
                <div className="h-8 flex-1 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
            <Settings className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Booking Settings</h1>
            <p className="text-sm text-gray-500">
              Configure your booking system
            </p>
          </div>
        </div>
        <a
          href="/bookings"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
        >
          <Calendar className="h-4 w-4" />
          View Bookings
        </a>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                tab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              )}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/*  AVAILABILITY TAB                                             */}
      {/* ============================================================ */}
      {tab === "availability" && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">Weekly Availability</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Set which days and times you are available for bookings.
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {availability.map((sched, idx) => (
              <div
                key={sched.day_of_week}
                className="px-6 py-4 flex items-center gap-4"
              >
                {/* Day name */}
                <span className="w-28 text-sm font-medium text-gray-700">
                  {DAY_NAMES[sched.day_of_week]}
                </span>

                {/* Active toggle */}
                <button
                  onClick={() => {
                    const updated = [...availability];
                    updated[idx] = { ...sched, is_active: !sched.is_active };
                    setAvailability(updated);
                  }}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
                    sched.is_active ? "bg-blue-600" : "bg-gray-200"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      sched.is_active ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>

                {/* Time pickers */}
                {sched.is_active ? (
                  <div className="flex items-center gap-2 flex-1">
                    <select
                      value={sched.start_time}
                      onChange={(e) => {
                        const updated = [...availability];
                        updated[idx] = {
                          ...sched,
                          start_time: e.target.value,
                        };
                        setAvailability(updated);
                      }}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {formatTime12(t)}
                        </option>
                      ))}
                    </select>
                    <span className="text-sm text-gray-400">to</span>
                    <select
                      value={sched.end_time}
                      onChange={(e) => {
                        const updated = [...availability];
                        updated[idx] = {
                          ...sched,
                          end_time: e.target.value,
                        };
                        setAvailability(updated);
                      }}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {formatTime12(t)}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 flex-1">
                    Unavailable
                  </span>
                )}
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            {availMessage && (
              <p
                className={cn(
                  "text-sm font-medium",
                  availMessage.includes("success")
                    ? "text-green-600"
                    : "text-red-600"
                )}
              >
                {availMessage}
              </p>
            )}
            <div className="flex-1" />
            <button
              onClick={saveAvailability}
              disabled={availSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all"
            >
              {availSaving ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Availability
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  SERVICES TAB                                                 */}
      {/* ============================================================ */}
      {tab === "services" && (
        <div className="space-y-4">
          {/* Service list */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-gray-900">Services</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Services your clients can book.
                </p>
              </div>
              {!showServiceForm && (
                <button
                  onClick={() => {
                    resetServiceForm();
                    setShowServiceForm(true);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-purple-700 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  Add Service
                </button>
              )}
            </div>

            {services.length === 0 && !showServiceForm && (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900">
                  No services yet
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Add a service to start accepting bookings.
                </p>
              </div>
            )}

            {services.length > 0 && (
              <div className="divide-y divide-gray-100">
                {services.map((service) => (
                  <div
                    key={service.id}
                    className="px-6 py-4 flex items-center gap-4"
                  >
                    {/* Color dot */}
                    <div
                      className="h-3 w-3 rounded-full shrink-0"
                      style={{ backgroundColor: service.color }}
                    />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {service.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {service.duration_minutes} min &middot;{" "}
                        {formatPrice(service.price_cents)}
                      </p>
                    </div>

                    {/* Active toggle */}
                    <button
                      onClick={() => toggleServiceActive(service)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
                        service.is_active ? "bg-green-500" : "bg-gray-200"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          service.is_active
                            ? "translate-x-6"
                            : "translate-x-1"
                        )}
                      />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => startEditService(service)}
                      className="p-2 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => deleteService(service.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Service form (inline below list) */}
          {showServiceForm && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">
                  {editingServiceId ? "Edit Service" : "Add Service"}
                </h3>
              </div>
              <div className="px-6 py-4 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={serviceForm.name}
                    onChange={(e) =>
                      setServiceForm({ ...serviceForm, name: e.target.value })
                    }
                    placeholder="e.g. Wedding Photography"
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={serviceForm.description}
                    onChange={(e) =>
                      setServiceForm({
                        ...serviceForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Describe this service..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                {/* Duration & Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Duration
                    </label>
                    <select
                      value={serviceForm.duration_minutes}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          duration_minutes: parseInt(e.target.value, 10),
                        })
                      }
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {DURATION_OPTIONS.map((d) => (
                        <option key={d} value={d}>
                          {d} minutes
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (AUD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={serviceForm.price_cents / 100}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            price_cents: Math.round(
                              parseFloat(e.target.value || "0") * 100
                            ),
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {/* Color picker */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() =>
                          setServiceForm({ ...serviceForm, color })
                        }
                        className={cn(
                          "h-8 w-8 rounded-full border-2 transition-all",
                          serviceForm.color === color
                            ? "border-gray-900 scale-110"
                            : "border-transparent hover:scale-105"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setServiceForm({
                        ...serviceForm,
                        is_active: !serviceForm.is_active,
                      })
                    }
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
                      serviceForm.is_active ? "bg-green-500" : "bg-gray-200"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        serviceForm.is_active
                          ? "translate-x-6"
                          : "translate-x-1"
                      )}
                    />
                  </button>
                  <span className="text-sm text-gray-700">Active</span>
                </div>
              </div>

              {/* Form actions */}
              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-2">
                <button
                  onClick={resetServiceForm}
                  className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveService}
                  disabled={serviceSaving || !serviceForm.name.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all"
                >
                  {serviceSaving ? (
                    <>
                      <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" />
                      {editingServiceId ? "Update Service" : "Add Service"}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/*  BLOCKED DATES TAB                                            */}
      {/* ============================================================ */}
      {tab === "blocked" && (
        <div className="space-y-4">
          {/* Block date form */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Block a Date</h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Prevent bookings on specific dates (holidays, vacations, etc.)
              </p>
            </div>
            <div className="px-6 py-4 flex flex-wrap items-end gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={blockForm.blocked_date}
                  onChange={(e) =>
                    setBlockForm({
                      ...blockForm,
                      blocked_date: e.target.value,
                    })
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <input
                  type="text"
                  value={blockForm.reason}
                  onChange={(e) =>
                    setBlockForm({ ...blockForm, reason: e.target.value })
                  }
                  placeholder="e.g. Public Holiday"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={addBlockedDate}
                disabled={blockSaving || !blockForm.blocked_date}
                className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all"
              >
                {blockSaving ? (
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Block
              </button>
            </div>
          </div>

          {/* Blocked dates list */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Blocked Dates</h2>
            </div>

            {blockedDates.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
                  <Calendar className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-lg font-medium text-gray-900">
                  No blocked dates
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  All dates are currently available for booking.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {blockedDates.map((bd) => (
                  <div
                    key={bd.id}
                    className="px-6 py-3 flex items-center gap-4"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 shrink-0">
                      <X className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(bd.blocked_date)}
                      </p>
                      {bd.reason && (
                        <p className="text-xs text-gray-500">{bd.reason}</p>
                      )}
                    </div>
                    <button
                      onClick={() => deleteBlockedDate(bd.id)}
                      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/*  SETTINGS TAB                                                 */}
      {/* ============================================================ */}
      {tab === "settings" && settings && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="font-semibold text-gray-900">
              General Booking Settings
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">
              Configure how your booking page works.
            </p>
          </div>

          <div className="px-6 py-6 space-y-6">
            {/* Booking URL slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Booking URL Slug
              </label>
              <input
                type="text"
                value={settings.booking_url_slug ?? ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    booking_url_slug: e.target.value
                      .toLowerCase()
                      .replace(/[^a-z0-9-]/g, ""),
                  })
                }
                placeholder="my-business"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {settings.booking_url_slug && (
                <p className="text-xs text-gray-500 mt-1">
                  Preview: booking.leadflow.ai/
                  <span className="font-medium">
                    {settings.booking_url_slug}
                  </span>
                </p>
              )}
            </div>

            {/* Business name & description */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  value={settings.business_name ?? ""}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      business_name: e.target.value,
                    })
                  }
                  placeholder="Your Business"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timezone
                </label>
                <select
                  value={settings.timezone}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      timezone: e.target.value,
                    })
                  }
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Description
              </label>
              <textarea
                value={settings.business_description ?? ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    business_description: e.target.value,
                  })
                }
                placeholder="Tell clients about your business..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
            </div>

            {/* Scheduling rules */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Scheduling Rules
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Minimum Notice (hours)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={720}
                    value={settings.min_notice_hours}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        min_notice_hours: parseInt(e.target.value || "0", 10),
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    How far in advance clients must book.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Advance (days)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    value={settings.max_advance_days}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        max_advance_days: parseInt(e.target.value || "1", 10),
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    How far ahead clients can book.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Slot Duration (minutes)
                  </label>
                  <select
                    value={settings.slot_duration_minutes}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        slot_duration_minutes: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {SLOT_DURATION_OPTIONS.map((d) => (
                      <option key={d} value={d}>
                        {d} minutes
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buffer Time (minutes)
                  </label>
                  <select
                    value={settings.buffer_minutes}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        buffer_minutes: parseInt(e.target.value, 10),
                      })
                    }
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {BUFFER_OPTIONS.map((b) => (
                      <option key={b} value={b}>
                        {b} minutes
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    Gap between consecutive bookings.
                  </p>
                </div>
              </div>
            </div>

            {/* Payment */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Payment
              </h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() =>
                      setSettings({
                        ...settings,
                        require_payment: !settings.require_payment,
                      })
                    }
                    className={cn(
                      "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0",
                      settings.require_payment
                        ? "bg-blue-600"
                        : "bg-gray-200"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                        settings.require_payment
                          ? "translate-x-6"
                          : "translate-x-1"
                      )}
                    />
                  </button>
                  <span className="text-sm text-gray-700">
                    Require payment to confirm booking
                  </span>
                </div>

                {settings.require_payment && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deposit Amount (AUD)
                    </label>
                    <div className="relative max-w-xs">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        $
                      </span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={settings.deposit_amount_cents / 100}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            deposit_amount_cents: Math.round(
                              parseFloat(e.target.value || "0") * 100
                            ),
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Messages
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmation Message
                  </label>
                  <textarea
                    value={settings.confirmation_message ?? ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        confirmation_message: e.target.value,
                      })
                    }
                    placeholder="Your booking has been confirmed!"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cancellation Policy
                  </label>
                  <textarea
                    value={settings.cancellation_policy ?? ""}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        cancellation_policy: e.target.value,
                      })
                    }
                    placeholder="Cancellations must be made at least 24 hours in advance..."
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Branding */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Branding
              </h3>
              <div className="flex items-start gap-3">
                <button
                  onClick={() => {
                    if (settings.subscription_tier === "free") return;
                    setSettings({
                      ...settings,
                      hide_branding: !settings.hide_branding,
                    });
                  }}
                  disabled={settings.subscription_tier === "free"}
                  title={
                    settings.subscription_tier === "free"
                      ? "Upgrade to Starter or higher to hide the LeadFlow branding."
                      : undefined
                  }
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0 mt-0.5",
                    settings.hide_branding ? "bg-blue-600" : "bg-gray-200",
                    settings.subscription_tier === "free" && "opacity-50 cursor-not-allowed"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                      settings.hide_branding ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    Hide &quot;Powered by&quot; branding
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Removes the LeadFlow link from the footer of your public booking page.
                  </p>
                  {settings.subscription_tier === "free" && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1 mt-2 inline-flex">
                      Upgrade to Starter or higher to enable this option.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Allowed Areas */}
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">
                Allowed Areas
              </h3>
              <p className="text-sm text-gray-500 mb-3">
                Add locations or areas where you provide services.
              </p>

              {/* Tag display */}
              {settings.allowed_areas.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {settings.allowed_areas.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center gap-1 rounded-full bg-blue-50 text-blue-700 px-3 py-1 text-sm"
                    >
                      {area}
                      <button
                        onClick={() => removeArea(area)}
                        className="hover:text-red-600 transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Area input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={areaInput}
                  onChange={(e) => setAreaInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addArea();
                    }
                  }}
                  placeholder="Type an area and press Enter"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  onClick={addArea}
                  disabled={!areaInput.trim()}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            {settingsMessage && (
              <p
                className={cn(
                  "text-sm font-medium",
                  settingsMessage.includes("success")
                    ? "text-green-600"
                    : "text-red-600"
                )}
              >
                {settingsMessage}
              </p>
            )}
            <div className="flex-1" />
            <button
              onClick={saveSettings}
              disabled={settingsSaving}
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 transition-all"
            >
              {settingsSaving ? (
                <>
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Settings tab when settings haven't loaded */}
      {tab === "settings" && !settings && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <AlertCircle className="h-8 w-8 text-gray-400 mb-3" />
            <p className="text-lg font-medium text-gray-900">
              Could not load settings
            </p>
            <p className="text-sm text-gray-500 mt-1">
              Please refresh the page and try again.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
