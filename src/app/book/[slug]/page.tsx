"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Mail,
  Phone,
  MessageSquare,
  Check,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Loader2,
  Zap,
} from "lucide-react";
import { useParams } from "next/navigation";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isBefore,
  startOfDay,
  addDays,
  addHours,
} from "date-fns";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ServiceData {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price_cents: number;
  currency: string;
  color: string;
}

interface AvailabilityData {
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

interface BlockedDateData {
  blocked_date: string;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
}

interface SettingsData {
  business_name: string | null;
  business_description: string | null;
  logo_url: string | null;
  min_notice_hours: number;
  max_advance_days: number;
  slot_duration_minutes: number;
  buffer_minutes: number;
  require_payment: boolean;
  deposit_amount_cents: number;
  confirmation_message: string;
  cancellation_policy: string | null;
  timezone: string;
  allowed_areas: string[];
  hide_branding?: boolean;
}

interface BookingPageData {
  settings: SettingsData;
  services: ServiceData[];
  availability: AvailabilityData[];
  blockedDates: BlockedDateData[];
}

interface TimeSlot {
  time: string; // HH:MM
  label: string; // 9:00 AM
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: currency || "AUD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

function to12Hour(time24: string): string {
  const [hStr, mStr] = time24.split(":");
  let h = parseInt(hStr, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${ampm}`;
}

function formatDateNice(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return format(d, "EEEE, MMMM d, yyyy");
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({
  current,
  total,
  labels,
}: {
  current: number;
  total: number;
  labels: string[];
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isCompleted = stepNum < current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200 ${
                  isCompleted
                    ? "bg-blue-600 text-white"
                    : isActive
                      ? "bg-blue-600 text-white ring-4 ring-blue-100"
                      : "bg-gray-200 text-gray-500"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4" />
                ) : (
                  stepNum
                )}
              </div>
              <span
                className={`text-xs mt-1 hidden sm:block ${
                  isActive
                    ? "text-blue-600 font-medium"
                    : isCompleted
                      ? "text-blue-600"
                      : "text-gray-400"
                }`}
              >
                {labels[i]}
              </span>
            </div>
            {i < total - 1 && (
              <div
                className={`w-8 sm:w-12 h-0.5 mb-5 sm:mb-4 ${
                  stepNum < current ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar component
// ---------------------------------------------------------------------------

function CalendarPicker({
  selectedDate,
  onSelect,
  blockedDates,
  availability,
  minNoticeHours,
  maxAdvanceDays,
}: {
  selectedDate: Date | null;
  onSelect: (d: Date) => void;
  blockedDates: BlockedDateData[];
  availability: AvailabilityData[];
  minNoticeHours: number;
  maxAdvanceDays: number;
}) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));

  const blockedSet = useMemo(() => {
    const s = new Set<string>();
    blockedDates.forEach((b) => {
      if (b.all_day) s.add(b.blocked_date);
    });
    return s;
  }, [blockedDates]);

  const activeDays = useMemo(() => {
    const s = new Set<number>();
    availability.forEach((a) => {
      if (a.is_active) s.add(a.day_of_week);
    });
    return s;
  }, [availability]);

  const now = new Date();
  const earliest = addHours(now, minNoticeHours);
  const latest = addDays(now, maxAdvanceDays);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const isDisabled = (day: Date) => {
    if (isBefore(day, startOfDay(earliest))) return true;
    if (isBefore(latest, day)) return true;
    const dayOfWeek = day.getDay();
    if (!activeDays.has(dayOfWeek)) return true;
    const dateStr = format(day, "yyyy-MM-dd");
    if (blockedSet.has(dateStr)) return true;
    return false;
  };

  const canGoPrev = !isBefore(startOfMonth(subMonths(viewMonth, 1)), startOfMonth(startOfDay(earliest)));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => canGoPrev && setViewMonth(subMonths(viewMonth, 1))}
          className={`p-2 rounded-lg transition-colors ${
            canGoPrev
              ? "hover:bg-gray-100 text-gray-700"
              : "text-gray-300 cursor-not-allowed"
          }`}
          disabled={!canGoPrev}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">
          {format(viewMonth, "MMMM yyyy")}
        </h3>
        <button
          type="button"
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-medium text-gray-500 py-2"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const inMonth = isSameMonth(day, viewMonth);
          const disabled = !inMonth || isDisabled(day);
          const selected = selectedDate && isSameDay(day, selectedDate);

          return (
            <button
              key={day.toISOString()}
              type="button"
              disabled={disabled}
              onClick={() => !disabled && onSelect(day)}
              className={`h-10 w-full rounded-lg text-sm font-medium transition-all duration-150 ${
                selected
                  ? "bg-blue-600 text-white shadow-sm"
                  : disabled
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export default function BookingPage() {
  const params = useParams();
  const slug = params.slug as string;

  // Data state
  const [data, setData] = useState<BookingPageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Wizard state
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<ServiceData | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);

  // Slots
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState<string | null>(null);

  // Form
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");

  // Booking
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);

  // Determine steps dynamically
  const hasAreas = (data?.settings?.allowed_areas?.length ?? 0) > 0;

  const stepConfig = useMemo(() => {
    const steps: { key: string; label: string }[] = [
      { key: "service", label: "Service" },
    ];
    if (hasAreas) {
      steps.push({ key: "area", label: "Area" });
    }
    steps.push(
      { key: "date", label: "Date" },
      { key: "time", label: "Time" },
      { key: "details", label: "Details" },
    );
    return steps;
  }, [hasAreas]);

  const totalSteps = stepConfig.length;
  const confirmationStep = totalSteps + 1;

  const currentStepKey = step <= totalSteps ? stepConfig[step - 1].key : "confirmation";

  // Fetch initial data
  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const res = await fetch(`/api/public/booking/${slug}`);
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        if (!res.ok) {
          throw new Error("Failed to load booking page");
        }
        const json = await res.json();
        const pageData = {
          settings: json.data.settings,
          services: json.data.services,
          availability: json.data.availability,
          blockedDates: json.data.blocked_dates,
        };
        setData(pageData);

        // Auto-select if only 1 service
        if (pageData.services?.length === 1) {
          setSelectedService(pageData.services[0]);
          setStep(2);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [slug]);

  // Fetch time slots when date changes
  useEffect(() => {
    if (!selectedDate || !selectedService) return;

    async function fetchSlots() {
      setSlotsLoading(true);
      setSlotsError(null);
      setSelectedSlot(null);
      try {
        const dateStr = format(selectedDate!, "yyyy-MM-dd");
        const res = await fetch(
          `/api/public/booking/${slug}/slots?date=${dateStr}&service_id=${selectedService!.id}`
        );
        if (!res.ok) throw new Error("Failed to load time slots");
        const json = await res.json();
        const slotsData = json.data ?? json.slots ?? [];
        const mapped: TimeSlot[] = slotsData.map((s: { start_time: string; end_time: string } | string) => {
          const timeStr = typeof s === "string" ? s : s.start_time;
          return { time: timeStr, label: to12Hour(timeStr) };
        });
        setSlots(mapped);
      } catch (err) {
        setSlotsError(
          err instanceof Error ? err.message : "Could not load slots"
        );
      } finally {
        setSlotsLoading(false);
      }
    }
    fetchSlots();
  }, [selectedDate, selectedService, slug]);

  // Handle booking submission
  const handleBooking = useCallback(async () => {
    if (!selectedService || !selectedDate || !selectedSlot) return;

    setBookingLoading(true);
    setBookingError(null);
    try {
      const res = await fetch(`/api/public/booking/${slug}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service_id: selectedService.id,
          client_name: clientName.trim(),
          client_email: clientEmail.trim(),
          client_phone: clientPhone.trim() || null,
          booking_date: format(selectedDate, "yyyy-MM-dd"),
          start_time: selectedSlot.time,
          notes: notes.trim() || null,
          location: location.trim() || null,
          area: selectedArea || null,
        }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "Booking failed. Please try again.");
      }
      setStep(confirmationStep);
    } catch (err) {
      setBookingError(
        err instanceof Error ? err.message : "Something went wrong"
      );
    } finally {
      setBookingLoading(false);
    }
  }, [
    selectedService,
    selectedDate,
    selectedSlot,
    slug,
    clientName,
    clientEmail,
    clientPhone,
    notes,
    location,
    selectedArea,
    confirmationStep,
  ]);

  const handleRestart = () => {
    setStep(1);
    setSelectedService(null);
    setSelectedArea(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setNotes("");
    setLocation("");
    setBookingError(null);

    // Re-auto-select if only 1 service
    if (data?.services?.length === 1) {
      setSelectedService(data.services[0]);
      setStep(2);
    }
  };

  // Navigation helpers
  const goNext = () => setStep((s) => Math.min(s + 1, confirmationStep));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

  // Skip area step if no areas
  const handleServiceContinue = () => {
    if (hasAreas) {
      setStep(stepConfig.findIndex((s) => s.key === "area") + 1);
    } else {
      setStep(stepConfig.findIndex((s) => s.key === "date") + 1);
    }
  };

  // ---------------------------------------------------------------------------
  // Not found
  // ---------------------------------------------------------------------------
  if (notFound) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Booking page not found
          </h1>
          <p className="text-gray-500">
            The booking page you&apos;re looking for doesn&apos;t exist or has
            been removed.
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Loading
  // ---------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-500 font-medium">Loading booking page...</p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // Error
  // ---------------------------------------------------------------------------
  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-500">{error || "Unable to load booking page."}</p>
        </div>
      </div>
    );
  }

  const { settings, services, availability, blockedDates } = data;

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col">
      {/* Brand header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6 px-4">
        <div className="max-w-2xl mx-auto text-center">
          {settings.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={settings.logo_url}
              alt={settings.business_name || "Business logo"}
              className="h-12 w-auto mx-auto mb-3 rounded-lg"
            />
          )}
          <h1 className="text-2xl sm:text-3xl font-bold">
            {settings.business_name || "Book an Appointment"}
          </h1>
          {settings.business_description && (
            <p className="mt-2 text-blue-100 text-sm sm:text-base max-w-lg mx-auto">
              {settings.business_description}
            </p>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Step indicator (hidden on confirmation) */}
          {step <= totalSteps && (
            <StepIndicator
              current={step}
              total={totalSteps}
              labels={stepConfig.map((s) => s.label)}
            />
          )}

          {/* ============================================================== */}
          {/* STEP: Select Service */}
          {/* ============================================================== */}
          {currentStepKey === "service" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Select a Service
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Choose the service you&apos;d like to book.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                {services.map((svc) => {
                  const isSelected = selectedService?.id === svc.id;
                  return (
                    <button
                      key={svc.id}
                      type="button"
                      onClick={() => setSelectedService(svc)}
                      className={`text-left p-4 rounded-xl border-2 transition-all duration-150 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">
                            {svc.name}
                          </h3>
                          {svc.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                              {svc.description}
                            </p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {svc.duration_minutes} min
                            </span>
                            {svc.price_cents > 0 && (
                              <span className="font-medium text-gray-900">
                                {formatPrice(svc.price_cents, svc.currency)}
                              </span>
                            )}
                            {svc.price_cents === 0 && (
                              <span className="text-green-600 font-medium">
                                Free
                              </span>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {services.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  No services are currently available.
                </div>
              )}

              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  disabled={!selectedService}
                  onClick={handleServiceContinue}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP: Select Area */}
          {/* ============================================================== */}
          {currentStepKey === "area" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Select an Area
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Choose your preferred location area.
              </p>

              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {settings.allowed_areas.map((area) => {
                  const isSelected = selectedArea === area;
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => setSelectedArea(area)}
                      className={`p-4 rounded-xl border-2 text-center font-medium transition-all duration-150 ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                          : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm"
                      }`}
                    >
                      <MapPin
                        className={`w-5 h-5 mx-auto mb-2 ${
                          isSelected ? "text-blue-600" : "text-gray-400"
                        }`}
                      />
                      {area}
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  disabled={!selectedArea}
                  onClick={goNext}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP: Select Date */}
          {/* ============================================================== */}
          {currentStepKey === "date" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Select a Date
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Choose your preferred date for the appointment.
              </p>

              <CalendarPicker
                selectedDate={selectedDate}
                onSelect={setSelectedDate}
                blockedDates={blockedDates}
                availability={availability}
                minNoticeHours={settings.min_notice_hours}
                maxAdvanceDays={settings.max_advance_days}
              />

              {selectedDate && (
                <p className="text-center mt-4 text-sm text-blue-600 font-medium">
                  Selected: {formatDateNice(format(selectedDate, "yyyy-MM-dd"))}
                </p>
              )}

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  disabled={!selectedDate}
                  onClick={goNext}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP: Select Time Slot */}
          {/* ============================================================== */}
          {currentStepKey === "time" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Select a Time
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Available times for{" "}
                {selectedDate
                  ? formatDateNice(format(selectedDate, "yyyy-MM-dd"))
                  : "your selected date"}
                .
              </p>

              {slotsLoading && (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              )}

              {slotsError && (
                <div className="text-center py-12">
                  <p className="text-red-500 mb-2">{slotsError}</p>
                  <button
                    type="button"
                    onClick={() => {
                      // Re-trigger slot fetch
                      const d = selectedDate;
                      setSelectedDate(null);
                      setTimeout(() => setSelectedDate(d), 0);
                    }}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Try again
                  </button>
                </div>
              )}

              {!slotsLoading && !slotsError && slots.length === 0 && (
                <div className="text-center py-12">
                  <Clock className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">
                    No available slots for this date
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    Please select a different date.
                  </p>
                </div>
              )}

              {!slotsLoading && !slotsError && slots.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {slots.map((slot) => {
                    const isSelected = selectedSlot?.time === slot.time;
                    return (
                      <button
                        key={slot.time}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-3 px-2 rounded-lg border-2 text-sm font-medium transition-all duration-150 ${
                          isSelected
                            ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm"
                            : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                        }`}
                      >
                        {slot.label}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  disabled={!selectedSlot}
                  onClick={goNext}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP: Your Details */}
          {/* ============================================================== */}
          {currentStepKey === "details" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">
                Your Details
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                Enter your information to complete the booking.
              </p>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <User className="w-4 h-4 text-gray-400" />
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    required
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <Mail className="w-4 h-4 text-gray-400" />
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <Phone className="w-4 h-4 text-gray-400" />
                    Phone Number{" "}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+61 4XX XXX XXX"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* Location */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    Location{" "}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Address or location details"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <MessageSquare className="w-4 h-4 text-gray-400" />
                    Notes / Special Requests{" "}
                    <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or notes..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
                  />
                </div>
              </div>

              {bookingError && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {bookingError}
                </div>
              )}

              <div className="mt-8 flex justify-between">
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
                <button
                  type="button"
                  disabled={
                    !clientName.trim() ||
                    !clientEmail.trim() ||
                    bookingLoading
                  }
                  onClick={handleBooking}
                  className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {bookingLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    "Book Now"
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* CONFIRMATION */}
          {/* ============================================================== */}
          {currentStepKey === "confirmation" && (
            <div className="text-center py-4">
              {/* Success animation */}
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-25" />
                <div className="relative w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-10 h-10 text-white" />
                </div>
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Booking Confirmed!
              </h2>
              <p className="text-gray-500 mb-8">
                We&apos;ve sent a confirmation to your email.
              </p>

              {/* Summary */}
              <div className="bg-white rounded-xl border border-gray-200 p-6 text-left max-w-md mx-auto mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Booking Summary
                </h3>
                <div className="space-y-3">
                  {selectedService && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Service</p>
                        <p className="font-medium text-gray-900">
                          {selectedService.name}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Date</p>
                        <p className="font-medium text-gray-900">
                          {formatDateNice(format(selectedDate, "yyyy-MM-dd"))}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedSlot && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-medium text-gray-900">
                          {selectedSlot.label}
                        </p>
                      </div>
                    </div>
                  )}
                  {selectedArea && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Area</p>
                        <p className="font-medium text-gray-900">
                          {selectedArea}
                        </p>
                      </div>
                    </div>
                  )}
                  {location && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="font-medium text-gray-900">{location}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Confirmation message */}
              {settings.confirmation_message && (
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 max-w-md mx-auto mb-8 text-sm text-blue-800">
                  {settings.confirmation_message}
                </div>
              )}

              <button
                type="button"
                onClick={handleRestart}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                Book Another
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      {!settings.hide_branding && (
        <footer className="py-4 text-center">
          <a
            href="https://leadflow.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Zap className="w-3 h-3" />
            Powered by LeadFlow AI
            <span className="ml-1">&rarr;</span>
          </a>
        </footer>
      )}
    </div>
  );
}
