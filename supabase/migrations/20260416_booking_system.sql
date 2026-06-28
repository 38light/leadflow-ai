-- Migration 6: Booking system tables
-- services, availability_schedules, blocked_dates, bookings, booking_settings

-- 1. Services offered by the business
CREATE TABLE services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  duration_minutes integer NOT NULL DEFAULT 60,
  price_cents integer NOT NULL DEFAULT 0,
  currency text DEFAULT 'AUD',
  is_active boolean DEFAULT true,
  color text DEFAULT '#3b82f6',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own services" ON services FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own services" ON services FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own services" ON services FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own services" ON services FOR DELETE USING (user_id = auth.uid());
-- Public read for booking page
CREATE POLICY "Public can view active services" ON services FOR SELECT USING (is_active = true);
-- Team member access
CREATE POLICY "Team members can view owner services" ON services FOR SELECT USING (
  user_id IN (SELECT owner_id FROM team_members WHERE member_user_id = auth.uid())
);

-- 2. Weekly recurring availability (e.g., Monday 9am-5pm)
CREATE TABLE availability_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (start_time < end_time)
);

ALTER TABLE availability_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own availability" ON availability_schedules FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own availability" ON availability_schedules FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own availability" ON availability_schedules FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own availability" ON availability_schedules FOR DELETE USING (user_id = auth.uid());
-- Public read for booking page
CREATE POLICY "Public can view active availability" ON availability_schedules FOR SELECT USING (is_active = true);

-- 3. Blocked dates (holidays, vacations, specific days off)
CREATE TABLE blocked_dates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_date date NOT NULL,
  reason text,
  all_day boolean DEFAULT true,
  start_time time,
  end_time time,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own blocked dates" ON blocked_dates FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own blocked dates" ON blocked_dates FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own blocked dates" ON blocked_dates FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own blocked dates" ON blocked_dates FOR DELETE USING (user_id = auth.uid());
-- Public read for booking page
CREATE POLICY "Public can view blocked dates" ON blocked_dates FOR SELECT USING (true);

-- 4. Booking settings (per user configuration)
CREATE TABLE booking_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_url_slug text UNIQUE,
  business_name text,
  business_description text,
  logo_url text,
  min_notice_hours integer DEFAULT 24,
  max_advance_days integer DEFAULT 90,
  slot_duration_minutes integer DEFAULT 60,
  buffer_minutes integer DEFAULT 15,
  require_payment boolean DEFAULT false,
  deposit_amount_cents integer DEFAULT 0,
  confirmation_message text DEFAULT 'Your booking has been confirmed! We look forward to seeing you.',
  cancellation_policy text,
  timezone text DEFAULT 'Australia/Sydney',
  allowed_areas text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE booking_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own booking settings" ON booking_settings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert own booking settings" ON booking_settings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own booking settings" ON booking_settings FOR UPDATE USING (user_id = auth.uid());
-- Public read for booking page (by slug)
CREATE POLICY "Public can view booking settings by slug" ON booking_settings FOR SELECT USING (booking_url_slug IS NOT NULL);

-- 5. Bookings (the actual appointments)
CREATE TABLE bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text,
  booking_date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','confirmed','cancelled','completed','no_show')),
  notes text,
  internal_notes text,
  location text,
  area text,
  payment_status text DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid','deposit_paid','paid','refunded')),
  payment_amount_cents integer DEFAULT 0,
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  cancellation_reason text,
  cancelled_at timestamptz,
  confirmed_at timestamptz,
  completed_at timestamptz,
  reminder_sent_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can insert bookings" ON bookings FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own bookings" ON bookings FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own bookings" ON bookings FOR DELETE USING (user_id = auth.uid());
-- Team member access
CREATE POLICY "Team members can view owner bookings" ON bookings FOR SELECT USING (
  user_id IN (SELECT owner_id FROM team_members WHERE member_user_id = auth.uid())
);
CREATE POLICY "Team members can insert owner bookings" ON bookings FOR INSERT WITH CHECK (
  user_id IN (SELECT owner_id FROM team_members WHERE member_user_id = auth.uid() AND role IN ('admin', 'member'))
);
CREATE POLICY "Team members can update owner bookings" ON bookings FOR UPDATE USING (
  user_id IN (SELECT owner_id FROM team_members WHERE member_user_id = auth.uid() AND role IN ('admin', 'member'))
);
-- Super admin access
CREATE POLICY "Super admins can view all bookings" ON bookings FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles p WHERE p.user_id = auth.uid() AND p.role = 'super_admin')
);

-- 6. Indexes
CREATE INDEX idx_services_user ON services(user_id);
CREATE INDEX idx_services_active ON services(user_id, is_active);
CREATE INDEX idx_availability_user_day ON availability_schedules(user_id, day_of_week);
CREATE INDEX idx_blocked_dates_user_date ON blocked_dates(user_id, blocked_date);
CREATE INDEX idx_bookings_user_date ON bookings(user_id, booking_date);
CREATE INDEX idx_bookings_user_status ON bookings(user_id, status);
CREATE INDEX idx_bookings_contact ON bookings(contact_id);
CREATE INDEX idx_bookings_service ON bookings(service_id);
CREATE INDEX idx_booking_settings_slug ON booking_settings(booking_url_slug);

-- 7. Updated_at triggers
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_availability_updated_at BEFORE UPDATE ON availability_schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_booking_settings_updated_at BEFORE UPDATE ON booking_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
