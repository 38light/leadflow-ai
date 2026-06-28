-- Public RLS hardening — 2026-06-28 (follow-up to 20260628000001)
-- Source: multi-agent security audit (see SECURITY-AUDIT.md), findings M2–M4 + M6.

-- ---------------------------------------------------------------------------
-- M2–M4: the booking subsystem exposed every tenant's rows to the anon role via
-- raw PostgREST. The public policies had no tenant scoping at all:
--   services              USING (is_active = true)
--   availability_schedules USING (is_active = true)
--   blocked_dates         USING (true)
-- so an unauthenticated caller could dump ALL tenants' catalogs, working hours,
-- and blocked dates. Scope each to owners who have actually PUBLISHED a booking
-- page (so only intentionally-public data is anon-readable). The public booking
-- route resolves a slug → that owner (who by definition has a published slug),
-- so the booking page keeps working.

-- SECURITY DEFINER helper so the policy can consult booking_settings without
-- depending on that table's own RLS (avoids subquery-RLS surprises / recursion).
CREATE OR REPLACE FUNCTION public.has_published_booking(p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM booking_settings
    WHERE user_id = p_user_id AND booking_url_slug IS NOT NULL
  );
$$;
REVOKE ALL ON FUNCTION public.has_published_booking(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.has_published_booking(uuid) TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Public can view active services" ON public.services;
CREATE POLICY "Public can view active services" ON public.services
  FOR SELECT
  USING (is_active = true AND public.has_published_booking(user_id));

DROP POLICY IF EXISTS "Public can view active availability" ON public.availability_schedules;
CREATE POLICY "Public can view active availability" ON public.availability_schedules
  FOR SELECT
  USING (is_active = true AND public.has_published_booking(user_id));

DROP POLICY IF EXISTS "Public can view blocked dates" ON public.blocked_dates;
CREATE POLICY "Public can view blocked dates" ON public.blocked_dates
  FOR SELECT
  USING (public.has_published_booking(user_id));

-- ---------------------------------------------------------------------------
-- M6: the notifications INSERT policy was `WITH CHECK (true)` for ALL roles, so
-- any anon/authenticated caller could POST a notification with an arbitrary
-- user_id + attacker-controlled title/body/link into any victim's feed
-- (cross-tenant phishing). Restrict inserts to either the row's own owner
-- (user_id = auth.uid()) or the service role. The three app routes that create
-- notifications for a possibly-different tenant (broadcasts send, booking
-- completion, waterfall trigger) are switched to the service-role client so
-- they still work for team members; the admin announcement route already used
-- it. This blocks cross-user injection while preserving every legitimate path.
DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications" ON public.notifications
  FOR INSERT
  WITH CHECK (user_id = auth.uid() OR auth.role() = 'service_role');
