-- Fix: infinite recursion in RLS policy for "profiles" (Postgres 42P17).
--
-- The original super-admin policies on `profiles` (20260415_roles_and_teams.sql)
-- did `EXISTS (SELECT 1 FROM profiles ...)` inside a policy ON profiles, so
-- evaluating profiles RLS required evaluating profiles RLS → infinite recursion.
-- Any query reaching profiles via the anon/authenticated role 500'd.
--
-- Fix: move the super-admin check into a SECURITY DEFINER function that reads
-- profiles outside RLS (owner = postgres/superuser bypasses RLS), then have the
-- profiles policies call it instead of self-selecting.
--
-- NOTE: filename uses a unique 14-digit version on purpose — the date-only names
-- elsewhere (20260417/18/19_*) collide on schema_migrations.version.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'super_admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated, service_role;

DROP POLICY IF EXISTS "Super admins can view all profiles" ON public.profiles;
CREATE POLICY "Super admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_super_admin());

DROP POLICY IF EXISTS "Super admins can update all profiles" ON public.profiles;
CREATE POLICY "Super admins can update all profiles" ON public.profiles
  FOR UPDATE USING (public.is_super_admin());
