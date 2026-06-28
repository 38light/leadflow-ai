-- Security hardening (M5): stop anon enumeration of every tenant's booking_settings.
--
-- The previous public policy `USING (booking_url_slug IS NOT NULL)` let the anon
-- role hit raw PostgREST (`GET /rest/v1/booking_settings?select=*`) and dump ALL
-- published tenants' full settings rows (user_id, deposit amounts, policy text, …).
-- RLS is row-level, so it cannot enforce "only the row whose slug you asked for".
-- Fix: serve the public booking page's settings lookup through a SECURITY DEFINER
-- function keyed on a known slug, and drop the broad public SELECT policy.
--
-- Owners still read their own row via the existing "Users can view own booking
-- settings" policy (user_id = auth.uid()); only the public-by-slug path changes.

CREATE OR REPLACE FUNCTION public.get_public_booking_settings(p_slug text)
RETURNS SETOF booking_settings
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT *
  FROM booking_settings
  WHERE booking_url_slug = p_slug
  LIMIT 1;
$$;

-- Lock down execute: only the roles the public booking page runs as.
REVOKE ALL ON FUNCTION public.get_public_booking_settings(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_booking_settings(text)
  TO anon, authenticated, service_role;

-- Remove the over-broad public enumeration policy now that the RPC is the path in.
DROP POLICY IF EXISTS "Public can view booking settings by slug" ON booking_settings;
