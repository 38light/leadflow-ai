"use client";

import { useState, useMemo } from "react";
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
  Zap,
  Eye,
} from "lucide-react";
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
// Demo data
// ---------------------------------------------------------------------------

const DEMO_SETTINGS = {
  business_name: "Sarah Mitchell Photography",
  business_description: "Capturing your most precious moments with warmth and artistry.",
  logo_url: null,
  min_notice_hours: 24,
  max_advance_days: 180,
  slot_duration_minutes: 60,
  buffer_minutes: 30,
  require_payment: false,
  deposit_amount_cents: 20000,
  confirmation_message: "Thank you for booking! Sarah will be in touch within 24 hours to confirm your session details.",
  cancellation_policy: "Cancellations made 7+ days in advance receive a full refund.",
  timezone: "Australia/Sydney",
  allowed_areas: ["Sydney CBD", "Inner West", "Eastern Suburbs", "North Shore"],
};

const DEMO_SERVICES = [
  {
    id: "svc-1",
    name: "Wedding Photography",
    description: "Full-day wedding coverage including ceremony and reception. Includes 500+ edited photos delivered via online gallery.",
    duration_minutes: 480,
    price_cents: 350000,
    currency: "AUD",
    color: "#3b82f6",
  },
  {
    id: "svc-2",
    name: "Engagement Session",
    description: "A relaxed 2-hour couples session at a location of your choice. Perfect for Save the Dates.",
    duration_minutes: 120,
    price_cents: 65000,
    currency: "AUD",
    color: "#8b5cf6",
  },
  {
    id: "svc-3",
    name: "Elopement Package",
    description: "Intimate ceremony coverage for small weddings. Up to 4 hours, includes 200+ edited photos.",
    duration_minutes: 240,
    price_cents: 180000,
    currency: "AUD",
    color: "#10b981",
  },
  {
    id: "svc-4",
    name: "Portrait Session",
    description: "1-hour studio or outdoor portrait session. Great for headshots, families, or individual portraits.",
    duration_minutes: 60,
    price_cents: 29900,
    currency: "AUD",
    color: "#f59e0b",
  },
];

// Demo time slots
const DEMO_SLOTS = [
  { time: "09:00", label: "9:00 AM" },
  { time: "10:00", label: "10:00 AM" },
  { time: "11:00", label: "11:00 AM" },
  { time: "13:00", label: "1:00 PM" },
  { time: "14:00", label: "2:00 PM" },
  { time: "15:00", label: "3:00 PM" },
];

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

function formatDateNice(date: Date): string {
  return format(date, "EEEE, MMMM d, yyyy");
}

// ---------------------------------------------------------------------------
// Step indicator
// ---------------------------------------------------------------------------

function StepIndicator({ current, total, labels }: { current: number; total: number; labels: string[] }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1;
        const isActive = stepNum === current;
        const isCompleted = stepNum < current;
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                isCompleted ? "bg-blue-600 text-white" : isActive ? "bg-blue-600 text-white ring-4 ring-blue-100" : "bg-gray-200 text-gray-500"
              }`}>
                {isCompleted ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span className={`text-xs mt-1 hidden sm:block ${isActive ? "text-blue-600 font-medium" : isCompleted ? "text-blue-600" : "text-gray-400"}`}>
                {labels[i]}
              </span>
            </div>
            {i < total - 1 && (
              <div className={`w-8 sm:w-12 h-0.5 mb-5 sm:mb-4 ${stepNum < current ? "bg-blue-600" : "bg-gray-200"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

function CalendarPicker({ selectedDate, onSelect }: { selectedDate: Date | null; onSelect: (d: Date) => void }) {
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));

  const activeDays = new Set([1, 2, 3, 4, 5, 6]); // Mon–Sat
  const now = new Date();
  const earliest = addHours(now, 24);
  const latest = addDays(now, 180);

  const calStart = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
  const calEnd = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calStart, end: calEnd });

  const isDisabled = (day: Date) => {
    if (isBefore(day, startOfDay(earliest))) return true;
    if (isBefore(latest, day)) return true;
    if (!activeDays.has(day.getDay())) return true;
    return false;
  };

  const canGoPrev = !isBefore(startOfMonth(subMonths(viewMonth, 1)), startOfMonth(startOfDay(earliest)));

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <button type="button" onClick={() => canGoPrev && setViewMonth(subMonths(viewMonth, 1))}
          className={`p-2 rounded-lg transition-colors ${canGoPrev ? "hover:bg-gray-100 text-gray-700" : "text-gray-300 cursor-not-allowed"}`}
          disabled={!canGoPrev}>
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h3 className="text-lg font-semibold text-gray-900">{format(viewMonth, "MMMM yyyy")}</h3>
        <button type="button" onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-700 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
      <div className="grid grid-cols-7 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day) => {
          const inMonth = isSameMonth(day, viewMonth);
          const disabled = !inMonth || isDisabled(day);
          const selected = selectedDate && isSameDay(day, selectedDate);
          return (
            <button key={day.toISOString()} type="button" disabled={disabled} onClick={() => !disabled && onSelect(day)}
              className={`h-10 w-full rounded-lg text-sm font-medium transition-all ${
                selected ? "bg-blue-600 text-white shadow-sm"
                  : disabled ? "text-gray-300 cursor-not-allowed"
                  : "text-gray-700 hover:bg-blue-50 hover:text-blue-700"
              }`}>
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

export default function BookingPreviewPage() {
  const stepLabels = ["Service", "Area", "Date", "Time", "Details"];
  const totalSteps = stepLabels.length;

  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<typeof DEMO_SERVICES[0] | null>(null);
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<typeof DEMO_SLOTS[0] | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [location, setLocation] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const currentStepKey = confirmed ? "confirmation" : stepLabels[step - 1].toLowerCase();

  const goNext = () => setStep((s) => Math.min(s + 1, totalSteps));
  const goBack = () => setStep((s) => Math.max(s - 1, 1));

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
    setConfirmed(false);
  };

  // Filtered slots — remove some randomly per date to simulate real availability
  const availableSlots = useMemo(() => {
    if (!selectedDate) return DEMO_SLOTS;
    const dayNum = selectedDate.getDay();
    // Simulate Saturday having fewer slots
    if (dayNum === 6) return DEMO_SLOTS.slice(0, 3);
    return DEMO_SLOTS;
  }, [selectedDate]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Preview banner */}
      <div className="bg-amber-500 text-amber-950 text-xs font-semibold text-center py-2 px-4 flex items-center justify-center gap-2">
        <Eye className="w-3.5 h-3.5" />
        Preview Mode — This is how your clients see the booking page. Set a booking URL slug in Bookings → Settings to make it live.
      </div>

      {/* Brand header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-6 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold">{DEMO_SETTINGS.business_name}</h1>
          <p className="mt-2 text-blue-100 text-sm sm:text-base max-w-lg mx-auto">
            {DEMO_SETTINGS.business_description}
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 px-4 py-8">
        <div className="max-w-2xl mx-auto">

          {!confirmed && (
            <StepIndicator current={step} total={totalSteps} labels={stepLabels} />
          )}

          {/* ============================================================ */}
          {/* STEP 1: Service */}
          {/* ============================================================ */}
          {currentStepKey === "service" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Select a Service</h2>
              <p className="text-gray-500 text-sm mb-6">Choose the service you&apos;d like to book.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {DEMO_SERVICES.map((svc) => {
                  const isSelected = selectedService?.id === svc.id;
                  return (
                    <button key={svc.id} type="button" onClick={() => setSelectedService(svc)}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected ? "border-blue-600 bg-blue-50 shadow-sm" : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
                      }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{svc.name}</h3>
                          {svc.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{svc.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {svc.duration_minutes >= 60
                                ? `${svc.duration_minutes / 60}h`
                                : `${svc.duration_minutes} min`}
                            </span>
                            <span className="font-medium text-gray-900">
                              {formatPrice(svc.price_cents, svc.currency)}
                            </span>
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
              <div className="mt-8 flex justify-end">
                <button type="button" disabled={!selectedService} onClick={goNext}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: Area */}
          {/* ============================================================ */}
          {currentStepKey === "area" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Select an Area</h2>
              <p className="text-gray-500 text-sm mb-6">Choose your preferred location area.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {DEMO_SETTINGS.allowed_areas.map((area) => {
                  const isSelected = selectedArea === area;
                  return (
                    <button key={area} type="button" onClick={() => setSelectedArea(area)}
                      className={`p-4 rounded-xl border-2 text-center font-medium transition-all ${
                        isSelected ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:shadow-sm"
                      }`}>
                      <MapPin className={`w-5 h-5 mx-auto mb-2 ${isSelected ? "text-blue-600" : "text-gray-400"}`} />
                      {area}
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 flex justify-between">
                <button type="button" onClick={goBack}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  <ArrowLeft className="w-4 h-4" />Back
                </button>
                <button type="button" disabled={!selectedArea} onClick={goNext}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: Date */}
          {/* ============================================================ */}
          {currentStepKey === "date" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Select a Date</h2>
              <p className="text-gray-500 text-sm mb-6">Available Monday to Saturday.</p>
              <CalendarPicker selectedDate={selectedDate} onSelect={setSelectedDate} />
              {selectedDate && (
                <p className="text-center mt-4 text-sm text-blue-600 font-medium">
                  Selected: {formatDateNice(selectedDate)}
                </p>
              )}
              <div className="mt-8 flex justify-between">
                <button type="button" onClick={goBack}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  <ArrowLeft className="w-4 h-4" />Back
                </button>
                <button type="button" disabled={!selectedDate} onClick={goNext}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: Time */}
          {/* ============================================================ */}
          {currentStepKey === "time" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Select a Time</h2>
              <p className="text-gray-500 text-sm mb-6">
                Available times for {selectedDate ? formatDateNice(selectedDate) : "your selected date"}.
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {availableSlots.map((slot) => {
                  const isSelected = selectedSlot?.time === slot.time;
                  return (
                    <button key={slot.time} type="button" onClick={() => setSelectedSlot(slot)}
                      className={`py-3 px-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        isSelected ? "border-blue-600 bg-blue-50 text-blue-700 shadow-sm" : "border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50"
                      }`}>
                      {slot.label}
                    </button>
                  );
                })}
              </div>
              <div className="mt-8 flex justify-between">
                <button type="button" onClick={goBack}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  <ArrowLeft className="w-4 h-4" />Back
                </button>
                <button type="button" disabled={!selectedSlot} onClick={goNext}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 5: Details */}
          {/* ============================================================ */}
          {currentStepKey === "details" && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-1">Your Details</h2>
              <p className="text-gray-500 text-sm mb-6">Enter your information to complete the booking.</p>

              {/* Booking summary strip */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 flex flex-wrap gap-4 text-sm">
                {selectedService && <span className="text-blue-800 font-medium">{selectedService.name}</span>}
                {selectedArea && <span className="text-blue-600">· {selectedArea}</span>}
                {selectedDate && <span className="text-blue-600">· {format(selectedDate, "EEE, MMM d")}</span>}
                {selectedSlot && <span className="text-blue-600">· {selectedSlot.label}</span>}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <User className="w-4 h-4 text-gray-400" />Full Name <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400" />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <Mail className="w-4 h-4 text-gray-400" />Email Address <span className="text-red-500">*</span>
                  </label>
                  <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400" />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <Phone className="w-4 h-4 text-gray-400" />Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input type="tel" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="+61 4XX XXX XXX"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400" />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />Location <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                    placeholder="Address or location details"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400" />
                </div>
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1.5">
                    <MessageSquare className="w-4 h-4 text-gray-400" />Notes / Special Requests <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder="Any special requests or notes..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none" />
                </div>
              </div>

              <div className="mt-8 flex justify-between">
                <button type="button" onClick={goBack}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-600 hover:text-gray-900 font-medium transition-colors">
                  <ArrowLeft className="w-4 h-4" />Back
                </button>
                <button type="button"
                  disabled={!clientName.trim() || !clientEmail.trim()}
                  onClick={() => setConfirmed(true)}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                  Book Now
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* CONFIRMATION */}
          {/* ============================================================ */}
          {currentStepKey === "confirmation" && (
            <div className="text-center py-4">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-green-100 rounded-full animate-ping opacity-25" />
                <div className="relative w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <Check className="w-10 h-10 text-white" />
                </div>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
              <p className="text-gray-500 mb-8">We&apos;ve sent a confirmation to your email.</p>

              <div className="bg-white rounded-xl border border-gray-200 p-6 text-left max-w-md mx-auto mb-6">
                <h3 className="font-semibold text-gray-900 mb-4">Booking Summary</h3>
                <div className="space-y-3">
                  {selectedService && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div><p className="text-sm text-gray-500">Service</p><p className="font-medium text-gray-900">{selectedService.name}</p></div>
                    </div>
                  )}
                  {selectedArea && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div><p className="text-sm text-gray-500">Area</p><p className="font-medium text-gray-900">{selectedArea}</p></div>
                    </div>
                  )}
                  {selectedDate && (
                    <div className="flex items-start gap-3">
                      <Calendar className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div><p className="text-sm text-gray-500">Date</p><p className="font-medium text-gray-900">{formatDateNice(selectedDate)}</p></div>
                    </div>
                  )}
                  {selectedSlot && (
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div><p className="text-sm text-gray-500">Time</p><p className="font-medium text-gray-900">{selectedSlot.label}</p></div>
                    </div>
                  )}
                  {clientName && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div><p className="text-sm text-gray-500">Name</p><p className="font-medium text-gray-900">{clientName}</p></div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 max-w-md mx-auto mb-8 text-sm text-blue-800">
                {DEMO_SETTINGS.confirmation_message}
              </div>

              <button type="button" onClick={handleRestart}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
                Book Another
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center">
        <div className="flex items-center justify-center gap-1 text-xs text-gray-400">
          <Zap className="w-3 h-3" />
          Powered by LeadFlow AI
        </div>
      </footer>
    </div>
  );
}
