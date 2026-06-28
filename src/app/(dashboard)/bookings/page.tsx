"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  User,
  Plus,
  Check,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  List,
  Settings,
  Sparkles,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Types                                                               */
/* ------------------------------------------------------------------ */

interface Service {
  id: string;
  name: string;
  duration_minutes: number;
  price_cents: number;
  color: string;
}

interface Booking {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  notes: string | null;
  internal_notes: string | null;
  location: string | null;
  area: string | null;
  payment_status: "unpaid" | "deposit_paid" | "paid" | "refunded";
  payment_amount_cents: number;
  cancellation_reason: string | null;
  service: Service | null;
  created_at: string;
}

type TabKey = "upcoming" | "past" | "cancelled";
type ViewMode = "list" | "calendar";

/* ------------------------------------------------------------------ */
/*  Constants                                                           */
/* ------------------------------------------------------------------ */

const STATUS_BADGE: Record<Booking["status"], string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
  no_show: "bg-gray-100 text-gray-800",
};

const STATUS_DOT: Record<Booking["status"], string> = {
  pending: "bg-yellow-400",
  confirmed: "bg-green-500",
  cancelled: "bg-red-400",
  completed: "bg-blue-500",
  no_show: "bg-gray-400",
};

const PAYMENT_BADGE: Record<Booking["payment_status"], string> = {
  unpaid: "bg-red-100 text-red-800",
  deposit_paid: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  refunded: "bg-gray-100 text-gray-800",
};

const TABS: { key: TabKey; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/* ------------------------------------------------------------------ */
/*  Helpers                                                             */
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

function statusLabel(s: string): string {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getCalendarDays(year: number, month: number): (Date | null)[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];
  for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
  for (let d = 1; d <= lastDay.getDate(); d++) {
    days.push(new Date(year, month, d));
  }
  return days;
}

/* ------------------------------------------------------------------ */
/*  Component                                                           */
/* ------------------------------------------------------------------ */

export default function BookingsPage() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  // --- List view state ---
  const [tab, setTab] = useState<TabKey>("upcoming");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // --- Calendar view state ---
  const [calMonth, setCalMonth] = useState(() => new Date());
  const [calBookings, setCalBookings] = useState<Booking[]>([]);
  const [calLoading, setCalLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // --- Meeting prep state ---
  const [prepLoadingId, setPrepLoadingId] = useState<string | null>(null);
  const [prepBrief, setPrepBrief] = useState<{ bookingId: string; text: string } | null>(null);

  /* ---- Fetch list bookings ---- */
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const responses = await Promise.all(
        tab === "upcoming"
          ? [
              fetch("/api/bookings?status=pending"),
              fetch("/api/bookings?status=confirmed"),
            ]
          : tab === "past"
            ? [
                fetch("/api/bookings?status=completed"),
                fetch("/api/bookings?status=no_show"),
              ]
            : [fetch("/api/bookings?status=cancelled")]
      );

      const allData: Booking[] = [];
      for (const res of responses) {
        if (res.ok) {
          const json = await res.json();
          if (json.data) allData.push(...json.data);
        }
      }

      allData.sort((a, b) => {
        const cmp =
          a.booking_date.localeCompare(b.booking_date) ||
          a.start_time.localeCompare(b.start_time);
        return tab === "upcoming" ? cmp : -cmp;
      });

      setBookings(allData);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    if (viewMode === "list") fetchBookings();
  }, [fetchBookings, viewMode]);

  /* ---- Fetch calendar bookings (all statuses) ---- */
  const fetchCalendarBookings = useCallback(async () => {
    setCalLoading(true);
    try {
      const statuses = ["pending", "confirmed", "completed", "no_show", "cancelled"];
      const responses = await Promise.all(
        statuses.map((s) => fetch(`/api/bookings?status=${s}`))
      );
      const allData: Booking[] = [];
      for (const res of responses) {
        if (res.ok) {
          const json = await res.json();
          if (json.data) allData.push(...json.data);
        }
      }
      setCalBookings(allData);
    } catch {
      // silently fail
    } finally {
      setCalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === "calendar") fetchCalendarBookings();
  }, [viewMode, fetchCalendarBookings]);

  /* ---- Actions ---- */
  async function updateBooking(id: string, payload: Record<string, unknown>) {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/bookings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await fetchBookings();
        if (viewMode === "calendar") await fetchCalendarBookings();
        setExpandedId(null);
      }
    } finally {
      setActionLoading(null);
    }
  }

  /* ---- Meeting prep ---- */
  async function getMeetingPrep(bookingId: string) {
    setPrepLoadingId(bookingId);
    try {
      const res = await fetch("/api/ai/meeting-prep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const json = await res.json();
      if (res.ok && json.data?.brief) {
        setPrepBrief({ bookingId, text: json.data.brief });
      }
    } finally {
      setPrepLoadingId(null);
    }
  }

  /* ---- Calendar helpers ---- */
  const calYear = calMonth.getFullYear();
  const calMonthIndex = calMonth.getMonth();
  const calDays = getCalendarDays(calYear, calMonthIndex);
  const todayKey = toDateKey(new Date());

  const bookingsByDay = calBookings.reduce<Record<string, Booking[]>>((acc, b) => {
    const key = b.booking_date;
    if (!acc[key]) acc[key] = [];
    acc[key].push(b);
    return acc;
  }, {});

  const selectedDayBookings = selectedDay ? (bookingsByDay[selectedDay] ?? []) : [];

  function prevMonth() {
    setCalMonth(new Date(calYear, calMonthIndex - 1, 1));
    setSelectedDay(null);
  }
  function nextMonth() {
    setCalMonth(new Date(calYear, calMonthIndex + 1, 1));
    setSelectedDay(null);
  }

  /* ---- Header (shared) ---- */
  const header = (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600">
          <Calendar className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Bookings</h1>
          <p className="text-sm text-gray-500">Manage your appointments</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* View toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
          <button
            onClick={() => setViewMode("list")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              viewMode === "list"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <List className="h-4 w-4" />
            List
          </button>
          <button
            onClick={() => setViewMode("calendar")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
              viewMode === "calendar"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            )}
          >
            <Calendar className="h-4 w-4" />
            Calendar
          </button>
        </div>

        <a
          href="/bookings/settings"
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-all"
          title="Booking Settings"
        >
          <Settings className="h-4 w-4" />
          Settings
        </a>

        <button
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:from-blue-700 hover:to-purple-700 transition-all"
        >
          <Plus className="h-4 w-4" />
          New Booking
        </button>
      </div>
    </div>
  );

  /* ================================================================ */
  /*  CALENDAR VIEW                                                    */
  /* ================================================================ */
  if (viewMode === "calendar") {
    return (
      <div>
        {header}

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {/* Month navigation */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-base font-semibold text-gray-900">
              {calMonth.toLocaleDateString("en-AU", { month: "long", year: "numeric" })}
            </h2>
            <button
              onClick={nextMonth}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          {calLoading ? (
            <div className="grid grid-cols-7">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-2 text-center text-xs font-medium text-gray-400 border-b border-gray-100">
                  {d}
                </div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-24 border-b border-r border-gray-100 p-1.5">
                  <div className="h-5 w-5 bg-gray-100 rounded animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {/* Weekday headers */}
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="py-2 text-center text-xs font-medium text-gray-400 border-b border-gray-100"
                >
                  {d}
                </div>
              ))}

              {/* Day cells */}
              {calDays.map((day, i) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${i}`}
                      className="h-24 border-b border-r border-gray-100 bg-gray-50/50"
                    />
                  );
                }

                const dateKey = toDateKey(day);
                const dayBookings = bookingsByDay[dateKey] ?? [];
                const isToday = dateKey === todayKey;
                const isSelected = dateKey === selectedDay;

                return (
                  <div
                    key={dateKey}
                    onClick={() => setSelectedDay(isSelected ? null : dateKey)}
                    className={cn(
                      "h-24 border-b border-r border-gray-100 p-1.5 cursor-pointer transition-colors flex flex-col",
                      isSelected ? "bg-blue-50" : "hover:bg-gray-50"
                    )}
                  >
                    {/* Date number */}
                    <div className="mb-1">
                      <span
                        className={cn(
                          "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                          isToday
                            ? "bg-blue-600 text-white"
                            : "text-gray-700"
                        )}
                      >
                        {day.getDate()}
                      </span>
                    </div>

                    {/* Booking chips */}
                    <div className="flex flex-col gap-0.5 overflow-hidden flex-1">
                      {dayBookings.slice(0, 3).map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center gap-1 min-w-0"
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full shrink-0",
                              STATUS_DOT[b.status]
                            )}
                          />
                          <span className="text-xs text-gray-700 truncate leading-tight">
                            {formatTime12(b.start_time)} {b.client_name.split(" ")[0]}
                          </span>
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <span className="text-xs text-gray-400 pl-2.5">
                          +{dayBookings.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Day detail panel */}
        {selectedDay && selectedDayBookings.length > 0 && (
          <div className="mt-4 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-900">
                {new Date(selectedDay + "T00:00:00").toLocaleDateString("en-AU", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
                <span className="ml-2 text-gray-400 font-normal">
                  {selectedDayBookings.length} booking{selectedDayBookings.length !== 1 ? "s" : ""}
                </span>
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {selectedDayBookings
                .sort((a, b) => a.start_time.localeCompare(b.start_time))
                .map((booking) => {
                  const isActioning = actionLoading === booking.id;
                  const isExpanded = expandedId === booking.id;

                  return (
                    <div key={booking.id}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                        className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                      >
                        <div
                          className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: booking.service?.color
                              ? `${booking.service.color}20`
                              : "#f3f4f6",
                          }}
                        >
                          <User
                            className="h-4 w-4"
                            style={{ color: booking.service?.color ?? "#9ca3af" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm">{booking.client_name}</p>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-0.5">
                            {booking.service && <span>{booking.service.name}</span>}
                            <span className="inline-flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatTime12(booking.start_time)} – {formatTime12(booking.end_time)}
                            </span>
                            {booking.area && (
                              <span className="inline-flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {booking.area}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className={cn(
                              "text-xs font-medium px-2 py-0.5 rounded-full",
                              STATUS_BADGE[booking.status]
                            )}
                          >
                            {statusLabel(booking.status)}
                          </span>
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 text-gray-400 transition-transform",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-5 pb-4 bg-gray-50/50 border-t border-gray-100">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3">
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contact</p>
                              <p className="text-sm text-gray-700">{booking.client_email}</p>
                              {booking.client_phone && <p className="text-sm text-gray-700">{booking.client_phone}</p>}
                              {booking.location && (
                                <p className="text-sm text-gray-700 flex items-center gap-1">
                                  <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                  {booking.location}
                                </p>
                              )}
                            </div>
                            <div className="space-y-1.5">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Payment</p>
                              {booking.service && (
                                <p className="text-sm text-gray-700 flex items-center gap-1">
                                  <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                                  {booking.service.name} — {formatPrice(booking.service.price_cents)}
                                </p>
                              )}
                              <span className={cn("inline-flex text-xs font-medium px-2 py-0.5 rounded-full", PAYMENT_BADGE[booking.payment_status])}>
                                {statusLabel(booking.payment_status)}
                              </span>
                            </div>
                            {booking.notes && (
                              <div className="sm:col-span-2">
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                                <p className="text-sm text-gray-700">{booking.notes}</p>
                              </div>
                            )}
                          </div>

                          {(booking.status === "pending" || booking.status === "confirmed") && (
                            <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                              {booking.status === "pending" && (
                                <button
                                  onClick={() => updateBooking(booking.id, { status: "confirmed" })}
                                  disabled={isActioning}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                                >
                                  <Check className="h-3.5 w-3.5" /> Confirm
                                </button>
                              )}
                              <button
                                onClick={() => updateBooking(booking.id, { status: "completed" })}
                                disabled={isActioning}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                              >
                                <Check className="h-3.5 w-3.5" /> Mark Complete
                              </button>
                              <button
                                onClick={() => updateBooking(booking.id, { status: "no_show" })}
                                disabled={isActioning}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-gray-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
                              >
                                <AlertCircle className="h-3.5 w-3.5" /> No-Show
                              </button>
                              <button
                                onClick={() => updateBooking(booking.id, { status: "cancelled" })}
                                disabled={isActioning}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                              >
                                <X className="h-3.5 w-3.5" /> Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {selectedDay && selectedDayBookings.length === 0 && (
          <div className="mt-4 bg-white border border-gray-200 rounded-xl shadow-sm px-5 py-8 text-center">
            <p className="text-sm text-gray-400">No bookings on this day</p>
          </div>
        )}
      </div>
    );
  }

  /* ================================================================ */
  /*  LIST VIEW                                                        */
  /* ================================================================ */

  if (loading) {
    return (
      <div>
        {header}
        <div className="flex gap-1 mb-6 border-b">
          {TABS.map((t) => (
            <div key={t.key} className="h-10 w-24 bg-gray-100 rounded-t-lg animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
                  <div className="h-3 w-56 bg-gray-100 rounded animate-pulse" />
                </div>
                <div className="flex gap-2">
                  <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse" />
                  <div className="h-6 w-14 bg-gray-200 rounded-full animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {header}

      {/* Tab bar */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setTab(t.key);
              setExpandedId(null);
            }}
            className={cn(
              "px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
              tab === t.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Booking list */}
      {bookings.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
              <Calendar className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-lg font-medium text-gray-900">No {tab} bookings</p>
            <p className="text-sm text-gray-500 mt-1">
              {tab === "upcoming"
                ? "You have no upcoming appointments. New bookings will appear here."
                : tab === "past"
                  ? "No completed or missed bookings yet."
                  : "No cancelled bookings."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const isExpanded = expandedId === booking.id;
            const isActioning = actionLoading === booking.id;

            return (
              <div
                key={booking.id}
                className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: booking.service?.color
                        ? `${booking.service.color}20`
                        : "#f3f4f6",
                    }}
                  >
                    <User
                      className="h-5 w-5"
                      style={{ color: booking.service?.color ?? "#9ca3af" }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{booking.client_name}</p>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500 mt-0.5">
                      {booking.service && <span className="truncate">{booking.service.name}</span>}
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(booking.booking_date)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatTime12(booking.start_time)} – {formatTime12(booking.end_time)}
                      </span>
                      {booking.area && (
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {booking.area}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", STATUS_BADGE[booking.status])}>
                      {statusLabel(booking.status)}
                    </span>
                    <span className={cn("text-xs font-medium px-2.5 py-1 rounded-full", PAYMENT_BADGE[booking.payment_status])}>
                      {statusLabel(booking.payment_status)}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 text-gray-400 transition-transform",
                        isExpanded && "rotate-180"
                      )}
                    />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100 bg-gray-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Contact</h4>
                        <p className="text-sm text-gray-700">{booking.client_email}</p>
                        {booking.client_phone && <p className="text-sm text-gray-700">{booking.client_phone}</p>}
                        {booking.location && (
                          <p className="text-sm text-gray-700 inline-flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-gray-400" />
                            {booking.location}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Details</h4>
                        {booking.service && (
                          <p className="text-sm text-gray-700 inline-flex items-center gap-1">
                            <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                            {booking.service.name} — {formatPrice(booking.service.price_cents)}
                          </p>
                        )}
                        {booking.payment_amount_cents > 0 && (
                          <p className="text-sm text-gray-700">Paid: {formatPrice(booking.payment_amount_cents)}</p>
                        )}
                        {booking.cancellation_reason && (
                          <p className="text-sm text-red-600 inline-flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            {booking.cancellation_reason}
                          </p>
                        )}
                      </div>

                      {(booking.notes || booking.internal_notes) && (
                        <div className="sm:col-span-2 space-y-2">
                          <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Notes</h4>
                          {booking.notes && <p className="text-sm text-gray-700">{booking.notes}</p>}
                          {booking.internal_notes && (
                            <p className="text-sm text-gray-500 italic">Internal: {booking.internal_notes}</p>
                          )}
                        </div>
                      )}
                    </div>

                    {tab === "upcoming" && (
                      <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => getMeetingPrep(booking.id)}
                          disabled={prepLoadingId === booking.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50 transition-colors"
                        >
                          {prepLoadingId === booking.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Sparkles className="h-4 w-4" />
                          )}
                          Meeting Prep
                        </button>
                        {booking.status === "pending" && (
                          <button
                            onClick={() => updateBooking(booking.id, { status: "confirmed" })}
                            disabled={isActioning}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                          >
                            <Check className="h-4 w-4" /> Confirm
                          </button>
                        )}
                        <button
                          onClick={() => updateBooking(booking.id, { status: "completed" })}
                          disabled={isActioning}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          <Check className="h-4 w-4" /> Mark Complete
                        </button>
                        <button
                          onClick={() => updateBooking(booking.id, { status: "no_show" })}
                          disabled={isActioning}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-gray-600 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:opacity-50 transition-colors"
                        >
                          <AlertCircle className="h-4 w-4" /> Mark No-Show
                        </button>
                        <button
                          onClick={() => updateBooking(booking.id, { status: "cancelled" })}
                          disabled={isActioning}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          <X className="h-4 w-4" /> Cancel
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Meeting Prep Modal */}
      {prepBrief && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-600" />
                <h2 className="font-semibold text-gray-900">AI Meeting Prep Brief</h2>
              </div>
              <button
                onClick={() => setPrepBrief(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-6 py-4 flex-1">
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap leading-relaxed">
                {prepBrief.text}
              </div>
            </div>
            <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setPrepBrief(null)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
