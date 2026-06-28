-- Security hardening — 2026-06-28
-- Source: multi-agent security audit (see SECURITY-AUDIT.md).
--
-- CRITICAL FIX: privilege-escalation via the profiles UPDATE policy.
-- The base policy "Users can update own profile" (20260410_core_tables.sql:36) has
-- USING (user_id = auth.uid()) but NO WITH CHECK and no column protection. Because
-- production uses the RLS-enforced anon/SSR client, that policy is the ONLY backstop
-- for direct PostgREST writes. A normal user could therefore call the Supabase REST/JS
-- API with their own anon JWT and run `UPDATE profiles SET role='super_admin'`, which
-- RLS permits — then pass every /api/admin/* `isSuperAdmin` gate (role is the sole
-- source of isSuperAdmin in src/lib/auth/get-user.ts). Full platform takeover.
--
-- Fix has two parts:
--   (1) Add WITH CHECK so a user cannot reassign their row's user_id.
--   (2) A BEFORE UPDATE trigger that forbids non-service-role callers from changing
--       the privileged `role` column. The service-role client (admin routes, Stripe
--       webhooks) bypasses RLS but triggers still fire, so it is explicitly allowed
--       through via auth.role() = 'service_role'. No admin route currently writes
--       profiles.role (verified by grep), so this allowance breaks nothing today and
--       leaves room for a future admin role-management flow on the service client.

-- (1) Tighten the self-update policy: post-update row must still belong to the caller.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- (2) Hard guard on the privileged `role` column (WITH CHECK cannot reference OLD).
CREATE OR REPLACE FUNCTION public.guard_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role (admin client, Stripe webhooks) is trusted and bypasses RLS anyway.
  IF auth.role() = 'service_role' THEN
    RETURN NEW;
  END IF;
  -- Authenticated/anon users may not self-promote.
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    RAISE EXCEPTION 'permission denied: profiles.role is not user-modifiable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_privileged_columns ON public.profiles;
CREATE TRIGGER guard_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_profile_privileged_columns();


-- L6 FIX: match_knowledge_chunks is SECURITY DEFINER (bypasses RLS), so it must derive
-- the tenant from the SESSION, never from a caller-supplied argument. The prior fix
-- ('p_user_id required' + WHERE kc.user_id = p_user_id) still let any authenticated
-- caller read ANOTHER tenant's chunks by passing that tenant's uuid as p_user_id.
-- Scope every row to auth.uid() instead (it returns the caller's JWT subject even under
-- SECURITY DEFINER). Three hardening changes vs. the original:
--   (1) Tenant filter is kc.user_id = auth.uid(); the p_user_id IS NULL escape hatch is
--       gone. p_user_id is retained only for signature/back-compat (so the generated
--       TS type is unchanged) and is IGNORED for scoping; if supplied it must equal the
--       session user. A legitimate cross-tenant search must be a separate, explicitly
--       named, service-role-only function — never the default behavior here.
--   (2) SET search_path pins resolution (SECURITY DEFINER hardening); includes
--       extensions + pg_temp(last) so the pgvector '<=>' operator always resolves.
--   (3) REVOKE ALL FROM public, then GRANT to specific roles. CREATE FUNCTION grants
--       EXECUTE to PUBLIC by default, which anon inherits — 'REVOKE ... FROM anon' alone
--       does NOT remove it (the PUBLIC grant remains). Only REVOKE FROM public closes
--       the anon RPC. (anon omitted from GRANT: no anonymous RAG.)
CREATE OR REPLACE FUNCTION match_knowledge_chunks(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5,
  p_knowledge_base_id uuid DEFAULT NULL,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  content text,
  document_id uuid,
  chunk_index integer,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'authentication required';
  END IF;
  -- Defense in depth: a supplied p_user_id may only ever be the caller's own id.
  IF p_user_id IS NOT NULL AND p_user_id <> v_user_id THEN
    RAISE EXCEPTION 'permission denied: cannot query another tenant''s knowledge base';
  END IF;
  RETURN QUERY
  SELECT
    kc.id,
    kc.content,
    kc.document_id,
    kc.chunk_index,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE
    kc.user_id = v_user_id
    AND (p_knowledge_base_id IS NULL OR kc.knowledge_base_id = p_knowledge_base_id)
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

REVOKE ALL ON FUNCTION match_knowledge_chunks(vector, float, int, uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION match_knowledge_chunks(vector, float, int, uuid, uuid) TO authenticated, service_role;


-- L7 FIX: the "Invitees can accept invitations" UPDATE policy has no WITH CHECK and
-- RLS cannot restrict columns, so an invitee could PATCH `role` on their own-email
-- invite (the accept route copies invitation.role into team_members → member→admin
-- escalation). Guard the role column: only the inviting owner or the service role may
-- change it; an invitee (auth.uid() <> owner_id) accepting only flips status.
CREATE OR REPLACE FUNCTION public.guard_team_invitation_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.role() <> 'service_role'
     AND auth.uid() <> OLD.owner_id THEN
    RAISE EXCEPTION 'permission denied: invitees may not change invitation role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_team_invitation_role ON public.team_invitations;
CREATE TRIGGER guard_team_invitation_role
  BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_team_invitation_role();


-- L9 FIX (NOT in the original audit — same class as L6, found while hardening it):
-- increment_message_count / increment_ai_call_count are SECURITY DEFINER (bypass RLS),
-- scope their UPDATE by a caller-supplied p_user_id, and keep the default PUBLIC execute
-- grant — so they are exposed as PostgREST RPCs. Any anon/authenticated caller can bump
-- ANOTHER tenant's billing/quota counters (message_count_this_period / ai_calls_this_period)
-- to push them over their plan limit: a cross-tenant quota-DoS. These are meant to be
-- called only by trusted server code on the service-role client, so pin search_path and
-- lock EXECUTE to service_role (REVOKE the inherited PUBLIC grant). No app code calls them
-- today (verified by grep) and the signatures are unchanged, so nothing breaks and the
-- generated TS types stay valid.
CREATE OR REPLACE FUNCTION increment_message_count(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE subscriptions
  SET message_count_this_period = message_count_this_period + 1
  WHERE user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION increment_message_count(uuid) FROM public;
GRANT EXECUTE ON FUNCTION increment_message_count(uuid) TO service_role;

CREATE OR REPLACE FUNCTION increment_ai_call_count(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE subscriptions
  SET ai_calls_this_period = ai_calls_this_period + 1
  WHERE user_id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION increment_ai_call_count(uuid) FROM public;
GRANT EXECUTE ON FUNCTION increment_ai_call_count(uuid) TO service_role;


-- L10 (defense-in-depth / Supabase `function_search_path_mutable` advisor): the remaining
-- SECURITY DEFINER functions had no pinned search_path. Not directly exploitable (the two
-- triggers only run in trigger context; get_owner_id is an RLS helper), but a DEFINER
-- function with a mutable search_path is a hardening gap. Pin SET search_path = public.
-- Grants are intentionally left unchanged: the triggers are not usefully RPC-callable, and
-- get_owner_id must stay EXECUTE-able by the roles whose RLS policies call it.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION update_contact_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.direction = 'inbound' THEN
    UPDATE contacts
    SET
      temperature = 'hot',
      last_interaction_at = now(),
      updated_at = now()
    WHERE id = NEW.contact_id AND user_id = NEW.user_id;

    UPDATE conversations
    SET
      last_message_at = now(),
      unread_count = unread_count + 1,
      updated_at = now()
    WHERE id = NEW.conversation_id;
  ELSE
    UPDATE conversations
    SET
      last_message_at = now(),
      updated_at = now()
    WHERE id = NEW.conversation_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION get_owner_id(uid uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  owner uuid;
BEGIN
  -- Check if user is a team member under someone
  SELECT tm.owner_id INTO owner FROM team_members tm WHERE tm.member_user_id = uid LIMIT 1;
  IF owner IS NOT NULL THEN
    RETURN owner;
  END IF;
  -- Otherwise they are the owner themselves
  RETURN uid;
END;
$$;
