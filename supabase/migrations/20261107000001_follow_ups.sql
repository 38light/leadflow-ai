-- A tenant-scoped next step for each customer, with owner/team assignment.
CREATE UNIQUE INDEX IF NOT EXISTS contacts_id_user_id_unique ON public.contacts (id, user_id);

CREATE TABLE public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL,
  title text NOT NULL CHECK (char_length(btrim(title)) BETWEEN 1 AND 200),
  due_at timestamptz NOT NULL CHECK (isfinite(due_at)),
  assigned_to uuid NOT NULL REFERENCES auth.users(id) DEFERRABLE INITIALLY DEFERRED,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT follow_ups_contact_tenant_fk FOREIGN KEY (contact_id, user_id)
    REFERENCES public.contacts(id, user_id) ON DELETE CASCADE,
  CONSTRAINT follow_ups_completion_consistent CHECK ((status = 'completed') = (completed_at IS NOT NULL))
);
CREATE INDEX follow_ups_owner_status_due ON public.follow_ups (user_id, status, due_at);
CREATE INDEX follow_ups_contact ON public.follow_ups (user_id, contact_id, due_at);
CREATE INDEX follow_ups_assignee ON public.follow_ups (assigned_to, status, due_at);

ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners and team can read follow ups" ON public.follow_ups FOR SELECT TO authenticated
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.team_members tm WHERE tm.owner_id = follow_ups.user_id AND tm.member_user_id = auth.uid()
));
CREATE POLICY "Owners and editors can create follow ups" ON public.follow_ups FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.team_members tm WHERE tm.owner_id = follow_ups.user_id AND tm.member_user_id = auth.uid() AND tm.role IN ('admin', 'member')
));
CREATE POLICY "Owners and editors can update follow ups" ON public.follow_ups FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.team_members tm WHERE tm.owner_id = follow_ups.user_id AND tm.member_user_id = auth.uid() AND tm.role IN ('admin', 'member')
))
WITH CHECK (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.team_members tm WHERE tm.owner_id = follow_ups.user_id AND tm.member_user_id = auth.uid() AND tm.role IN ('admin', 'member')
));
CREATE POLICY "Owners and editors can delete follow ups" ON public.follow_ups FOR DELETE TO authenticated
USING (user_id = auth.uid() OR EXISTS (
  SELECT 1 FROM public.team_members tm WHERE tm.owner_id = follow_ups.user_id AND tm.member_user_id = auth.uid() AND tm.role IN ('admin', 'member')
));

CREATE FUNCTION public.guard_follow_up()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Follow-up owner cannot change' USING ERRCODE = '23514';
  END IF;
  IF NEW.assigned_to <> NEW.user_id THEN
    PERFORM 1 FROM public.team_members
      WHERE owner_id = NEW.user_id AND member_user_id = NEW.assigned_to AND role IN ('admin', 'member')
      FOR SHARE;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Assignee must belong to this team' USING ERRCODE = '23514';
    END IF;
  END IF;
  NEW.title := btrim(NEW.title);
  IF TG_OP = 'INSERT' THEN
    NEW.created_at := clock_timestamp();
    NEW.updated_at := NEW.created_at;
    NEW.completed_at := CASE WHEN NEW.status = 'completed' THEN NEW.created_at ELSE NULL END;
  ELSE
    NEW.created_at := OLD.created_at;
    NEW.updated_at := greatest(clock_timestamp(), OLD.updated_at + interval '1 microsecond');
    IF NEW.status = 'completed' THEN
      NEW.completed_at := CASE WHEN OLD.status = 'completed' THEN OLD.completed_at ELSE NEW.updated_at END;
    ELSE
      NEW.completed_at := NULL;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.guard_follow_up() FROM public;
CREATE TRIGGER guard_follow_up BEFORE INSERT OR UPDATE ON public.follow_ups
  FOR EACH ROW EXECUTE FUNCTION public.guard_follow_up();

-- Preserve assignment integrity when a colleague leaves or becomes read-only.
CREATE FUNCTION public.reassign_departed_follow_ups()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.team_members WHERE owner_id = OLD.owner_id
      AND member_user_id = OLD.member_user_id AND role IN ('admin', 'member')
  ) THEN
    UPDATE public.follow_ups SET assigned_to = user_id
      WHERE user_id = OLD.owner_id AND assigned_to = OLD.member_user_id;
  END IF;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public.reassign_departed_follow_ups() FROM public;
CREATE TRIGGER reassign_departed_follow_ups AFTER DELETE OR UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.reassign_departed_follow_ups();

-- Latest-message selection happens in SQL, so a busy thread cannot hide another
-- customer's unanswered enquiry behind a limited client-side message scan.
CREATE FUNCTION public.today_needs_reply(p_owner_id uuid, p_limit integer DEFAULT 200)
RETURNS TABLE (
  id uuid, contact_id uuid, contact_name text, channel text,
  last_message_at timestamptz, preview text, total_count bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND (
    auth.uid() IS NULL OR (auth.uid() <> p_owner_id AND NOT EXISTS (
      SELECT 1 FROM public.team_members WHERE owner_id = p_owner_id AND member_user_id = auth.uid()
    ))
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT c.id, c.contact_id, coalesce(nullif(ct.name, ''), ct.email, ct.phone, 'Customer'),
    c.channel_type, latest.created_at, left(coalesce(latest.content, 'Attachment received'), 240), count(*) OVER ()
  FROM public.conversations c
  JOIN public.contacts ct ON ct.id = c.contact_id AND ct.user_id = c.user_id
  CROSS JOIN LATERAL (
    SELECT m.direction, m.content, m.created_at
    FROM public.messages m
    WHERE m.conversation_id = c.id AND m.user_id = p_owner_id
      AND (m.direction = 'inbound' OR (
        coalesce(m.metadata->>'delivery_status', '') NOT IN ('failed', 'pending', 'sending')
        AND coalesce(m.metadata->'delivery'->>'status', '') NOT IN ('failed', 'pending', 'sending')
      ))
    ORDER BY m.created_at DESC, m.id DESC LIMIT 1
  ) latest
  WHERE c.user_id = p_owner_id AND c.status IN ('active', 'paused')
    AND NOT coalesce(ct.opted_out, false)
    AND latest.direction = 'inbound'
    AND NOT EXISTS (
      SELECT 1 FROM public.ai_approvals a
      WHERE a.user_id = p_owner_id AND a.conversation_id = c.id AND a.status = 'pending'
    )
  ORDER BY latest.created_at ASC, c.id
  LIMIT greatest(1, least(coalesce(p_limit, 200), 200));
END;
$$;
REVOKE ALL ON FUNCTION public.today_needs_reply(uuid, integer) FROM public;
GRANT EXECUTE ON FUNCTION public.today_needs_reply(uuid, integer) TO authenticated, service_role;

CREATE INDEX IF NOT EXISTS messages_owner_conversation_latest
  ON public.messages (user_id, conversation_id, created_at DESC, id DESC);

-- A minimal roster supports assignment for members without exposing profiles or
-- expanding the existing team_members table policies.
CREATE FUNCTION public.follow_up_assignees(p_owner_id uuid)
RETURNS TABLE (id uuid, name text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND (
    auth.uid() IS NULL OR (auth.uid() <> p_owner_id AND NOT EXISTS (
      SELECT 1 FROM public.team_members WHERE owner_id = p_owner_id AND member_user_id = auth.uid()
    ))
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT p_owner_id, coalesce(nullif(p.business_name, ''), 'Business owner') FROM public.profiles p
  WHERE p.user_id = p_owner_id
  UNION ALL
  SELECT eligible.member_user_id,
    coalesce(nullif(p.business_name, ''), 'Team member ' || row_number() OVER (ORDER BY eligible.member_user_id)::text)
  FROM (
    SELECT DISTINCT tm.member_user_id FROM public.team_members tm
    WHERE tm.owner_id = p_owner_id AND tm.role IN ('admin', 'member') AND tm.member_user_id <> p_owner_id
  ) eligible
  LEFT JOIN public.profiles p ON p.user_id = eligible.member_user_id;
END;
$$;
REVOKE ALL ON FUNCTION public.follow_up_assignees(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.follow_up_assignees(uuid) TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.follow_ups TO authenticated, service_role;

CREATE FUNCTION public.today_timezone(p_owner_id uuid)
RETURNS text LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' AND (
    auth.uid() IS NULL OR (auth.uid() <> p_owner_id AND NOT EXISTS (
      SELECT 1 FROM public.team_members WHERE owner_id = p_owner_id AND member_user_id = auth.uid()
    ))
  ) THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  RETURN (SELECT timezone FROM public.profiles WHERE user_id = p_owner_id);
END;
$$;
REVOKE ALL ON FUNCTION public.today_timezone(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.today_timezone(uuid) TO authenticated, service_role;
