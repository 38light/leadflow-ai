-- Durable visitor capabilities and transactional web-chat delivery.
CREATE TABLE public.web_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE CHECK (token_hash ~ '^[0-9a-f]{64}$'),
  conversation_id uuid UNIQUE REFERENCES public.conversations(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '30 days',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.web_chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners can read chat sessions" ON public.web_chat_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Owners can create chat sessions" ON public.web_chat_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners can update chat sessions" ON public.web_chat_sessions FOR UPDATE USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Owners can delete chat sessions" ON public.web_chat_sessions FOR DELETE USING (user_id = auth.uid());
-- Sessions are managed only by validated server endpoints, never directly by visitors.
REVOKE ALL ON public.web_chat_sessions FROM anon, authenticated;
GRANT ALL ON public.web_chat_sessions TO service_role;
CREATE INDEX web_chat_sessions_owner ON public.web_chat_sessions(user_id);
CREATE TRIGGER update_web_chat_sessions_updated_at BEFORE UPDATE ON public.web_chat_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE UNIQUE INDEX messages_web_chat_request_id ON public.messages(user_id, conversation_id, external_message_id)
  WHERE channel_type = 'web_chat' AND external_message_id IS NOT NULL;

-- Creating the first contact/conversation and accepting a visitor message is one transaction.
-- An unverified visitor email is never used to join another customer's private history.
CREATE FUNCTION public.receive_web_chat_message(
  p_owner_id uuid, p_token_hash text, p_request_id uuid, p_content text,
  p_name text DEFAULT NULL, p_email text DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  s public.web_chat_sessions%ROWTYPE;
  c public.conversations%ROWTYPE;
  m public.messages%ROWTYPE;
  contact_uuid uuid;
  first_message boolean := false;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501'; END IF;
  IF p_owner_id IS NULL OR p_token_hash IS NULL OR p_request_id IS NULL OR p_content IS NULL OR length(trim(p_content)) NOT BETWEEN 1 AND 5000 OR length(coalesce(p_name,'')) > 100 OR length(coalesce(p_email,'')) > 254 THEN
    RAISE EXCEPTION 'Invalid message' USING ERRCODE = '22023';
  END IF;
  SELECT * INTO s FROM public.web_chat_sessions
    WHERE user_id = p_owner_id AND token_hash = p_token_hash AND expires_at > now() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid chat session' USING ERRCODE = '42501'; END IF;
  IF s.conversation_id IS NULL THEN
    INSERT INTO public.contacts(user_id, name, email, source_channel, status, temperature, last_interaction_at)
      VALUES(p_owner_id, coalesce(nullif(trim(p_name),''), 'Web visitor'), nullif(trim(p_email),''), 'web_chat', 'new', 'warm', now()) RETURNING id INTO contact_uuid;
    INSERT INTO public.conversations(user_id, contact_id, channel_type, external_thread_id, status, is_ai_active, last_message_at)
      VALUES(p_owner_id, contact_uuid, 'web_chat', s.id::text, 'active', true, now()) RETURNING * INTO c;
    UPDATE public.web_chat_sessions SET conversation_id = c.id WHERE id = s.id AND user_id = p_owner_id;
    first_message := true;
  ELSE
    SELECT * INTO c FROM public.conversations WHERE id = s.conversation_id AND user_id = p_owner_id AND channel_type = 'web_chat' FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Invalid chat conversation' USING ERRCODE = '42501'; END IF;
  END IF;
  PERFORM 1 FROM public.contacts WHERE id=c.contact_id AND user_id=p_owner_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid chat contact' USING ERRCODE = '42501'; END IF;
  SELECT * INTO m FROM public.messages WHERE user_id = p_owner_id AND conversation_id = c.id AND external_message_id = 'visitor:' || p_request_id::text;
  IF FOUND THEN
    RETURN jsonb_build_object('message_id',m.id,'conversation_id',c.id,'contact_id',c.contact_id,'duplicate',true,'is_first_message',false,'is_ai_active',c.is_ai_active);
  END IF;
  INSERT INTO public.messages(user_id,conversation_id,contact_id,channel_type,direction,sender_type,content,content_type,external_message_id,created_at)
    VALUES(p_owner_id,c.id,c.contact_id,'web_chat','inbound','contact',trim(p_content),'text','visitor:' || p_request_id::text,clock_timestamp()) RETURNING * INTO m;
  UPDATE public.conversations SET last_message_at = m.created_at, status = 'active'
    WHERE id = c.id AND user_id = p_owner_id;
  UPDATE public.contacts SET last_interaction_at = m.created_at, temperature = CASE WHEN temperature = 'cold' THEN 'warm' ELSE temperature END
    WHERE id = c.contact_id AND user_id = p_owner_id;
  RETURN jsonb_build_object('message_id',m.id,'conversation_id',c.id,'contact_id',c.contact_id,'duplicate',false,'is_first_message',first_message,'is_ai_active',c.is_ai_active);
END $$;
REVOKE ALL ON FUNCTION public.receive_web_chat_message(uuid,text,uuid,text,text,text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.receive_web_chat_message(uuid,text,uuid,text,text,text) TO service_role;

-- Approval/rejection locks the same row. A competing action can never publish twice.
CREATE FUNCTION public.act_on_web_chat_approval(p_owner_id uuid, p_actor_id uuid, p_approval_id uuid, p_action text, p_content text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  a public.ai_approvals%ROWTYPE;
  c public.conversations%ROWTYPE;
  m public.messages%ROWTYPE;
  final_content text;
BEGIN
  IF p_owner_id IS NULL OR p_actor_id IS NULL OR p_approval_id IS NULL OR p_action IS NULL THEN RAISE EXCEPTION 'Invalid action' USING ERRCODE = '22023'; END IF;
  IF auth.role() IS DISTINCT FROM 'service_role' AND auth.uid() IS DISTINCT FROM p_actor_id THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501'; END IF;
  IF p_actor_id <> p_owner_id AND NOT EXISTS(SELECT 1 FROM public.team_members WHERE owner_id=p_owner_id AND member_user_id=p_actor_id AND role IN ('admin','member')) THEN
    RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501';
  END IF;
  IF p_action NOT IN ('approve','reject') THEN RAISE EXCEPTION 'Invalid action' USING ERRCODE = '22023'; END IF;
  SELECT * INTO a FROM public.ai_approvals WHERE id=p_approval_id AND user_id=p_owner_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','not_found'); END IF;
  IF a.status <> 'pending' THEN RETURN jsonb_build_object('error','already_processed'); END IF;
  IF p_action = 'reject' THEN
    UPDATE public.ai_approvals SET status='rejected', approved_by=p_actor_id, approved_at=now() WHERE id=a.id AND user_id=p_owner_id;
    RETURN jsonb_build_object('id',a.id,'status','rejected');
  END IF;
  SELECT * INTO c FROM public.conversations WHERE id=a.conversation_id AND contact_id=a.contact_id AND user_id=p_owner_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','conversation_not_found'); END IF;
  PERFORM 1 FROM public.contacts WHERE id=c.contact_id AND user_id=p_owner_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','conversation_not_found'); END IF;
  IF c.channel_type <> 'web_chat' THEN RETURN jsonb_build_object('error','unsupported_channel'); END IF;
  IF EXISTS(SELECT 1 FROM public.contacts WHERE id=c.contact_id AND user_id=p_owner_id AND opted_out=true) THEN RETURN jsonb_build_object('error','opted_out'); END IF;
  final_content := trim(coalesce(p_content,a.draft_content));
  IF final_content IS NULL OR length(final_content) NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'Invalid content' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.messages(user_id,conversation_id,contact_id,direction,sender_type,content,content_type,channel_type,external_message_id,metadata,created_at)
    VALUES(p_owner_id,c.id,c.contact_id,'outbound','ai',final_content,'text','web_chat','approval:'||a.id::text,
      jsonb_build_object('approved_from',a.id,'approved_by',p_actor_id,'delivery_status','available'),clock_timestamp()) RETURNING * INTO m;
  UPDATE public.ai_approvals SET status='approved',approved_by=p_actor_id,approved_at=now(),draft_content=final_content WHERE id=a.id AND user_id=p_owner_id;
  UPDATE public.conversations SET last_message_at=m.created_at,unread_count=0 WHERE id=c.id AND user_id=p_owner_id;
  UPDATE public.contacts SET last_interaction_at=m.created_at WHERE id=c.contact_id AND user_id=p_owner_id;
  RETURN jsonb_build_object('id',a.id,'status','approved','message_id',m.id);
END $$;
REVOKE ALL ON FUNCTION public.act_on_web_chat_approval(uuid,uuid,uuid,text,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.act_on_web_chat_approval(uuid,uuid,uuid,text,text) TO authenticated, service_role;

CREATE FUNCTION public.send_web_chat_reply(p_owner_id uuid,p_actor_id uuid,p_conversation_id uuid,p_request_id uuid,p_content text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.conversations%ROWTYPE; m public.messages%ROWTYPE;
BEGIN
  IF p_owner_id IS NULL OR p_actor_id IS NULL OR p_conversation_id IS NULL OR p_request_id IS NULL OR p_content IS NULL THEN RAISE EXCEPTION 'Invalid message' USING ERRCODE = '22023'; END IF;
  IF auth.role() IS DISTINCT FROM 'service_role' AND auth.uid() IS DISTINCT FROM p_actor_id THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501'; END IF;
  IF p_actor_id <> p_owner_id AND NOT EXISTS(SELECT 1 FROM public.team_members WHERE owner_id=p_owner_id AND member_user_id=p_actor_id AND role IN ('admin','member')) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501'; END IF;
  IF length(trim(p_content)) NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'Invalid content' USING ERRCODE = '22023'; END IF;
  SELECT * INTO c FROM public.conversations WHERE id=p_conversation_id AND user_id=p_owner_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','conversation_not_found'); END IF;
  PERFORM 1 FROM public.contacts WHERE id=c.contact_id AND user_id=p_owner_id FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('error','conversation_not_found'); END IF;
  IF c.channel_type <> 'web_chat' THEN RETURN jsonb_build_object('error','unsupported_channel'); END IF;
  SELECT * INTO m FROM public.messages WHERE user_id=p_owner_id AND conversation_id=c.id AND external_message_id='human:'||p_request_id::text;
  IF FOUND THEN RETURN jsonb_build_object('message',to_jsonb(m)); END IF;
  IF EXISTS(SELECT 1 FROM public.contacts WHERE id=c.contact_id AND user_id=p_owner_id AND opted_out=true) THEN RETURN jsonb_build_object('error','opted_out'); END IF;
  INSERT INTO public.messages(user_id,conversation_id,contact_id,direction,sender_type,content,content_type,channel_type,external_message_id,metadata,created_at)
    VALUES(p_owner_id,c.id,c.contact_id,'outbound','human',trim(p_content),'text','web_chat','human:'||p_request_id::text,jsonb_build_object('delivery_status','available'),clock_timestamp()) RETURNING * INTO m;
  UPDATE public.conversations SET last_message_at=m.created_at,unread_count=0,is_ai_active=false,status='active' WHERE id=c.id AND user_id=p_owner_id;
  UPDATE public.contacts SET last_interaction_at=m.created_at WHERE id=c.contact_id AND user_id=p_owner_id;
  RETURN jsonb_build_object('message',to_jsonb(m));
END $$;
REVOKE ALL ON FUNCTION public.send_web_chat_reply(uuid,uuid,uuid,uuid,text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_web_chat_reply(uuid,uuid,uuid,uuid,text) TO authenticated, service_role;

-- Don't publish a stale AI response after a human takes over or a newer reply arrives.
CREATE FUNCTION public.publish_web_chat_ai_reply(p_owner_id uuid,p_conversation_id uuid,p_inbound_id uuid,p_content text,p_is_opt_out boolean DEFAULT false)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE c public.conversations%ROWTYPE; latest_id uuid; m public.messages%ROWTYPE;
BEGIN
  IF auth.role() IS DISTINCT FROM 'service_role' THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE = '42501'; END IF;
  IF p_owner_id IS NULL OR p_conversation_id IS NULL OR p_inbound_id IS NULL OR p_content IS NULL OR length(trim(p_content)) NOT BETWEEN 1 AND 10000 THEN RAISE EXCEPTION 'Invalid content' USING ERRCODE = '22023'; END IF;
  p_is_opt_out := coalesce(p_is_opt_out, false);
  SELECT * INTO c FROM public.conversations WHERE id=p_conversation_id AND user_id=p_owner_id AND channel_type='web_chat' FOR UPDATE;
  IF NOT FOUND OR (NOT c.is_ai_active AND NOT p_is_opt_out) THEN RETURN false; END IF;
  PERFORM 1 FROM public.contacts WHERE id=c.contact_id AND user_id=p_owner_id FOR UPDATE;
  IF NOT FOUND THEN RETURN false; END IF;
  IF NOT p_is_opt_out AND EXISTS(SELECT 1 FROM public.contacts WHERE id=c.contact_id AND user_id=p_owner_id AND opted_out=true) THEN RETURN false; END IF;
  SELECT id INTO latest_id FROM public.messages WHERE conversation_id=c.id AND user_id=p_owner_id ORDER BY created_at DESC,id DESC LIMIT 1;
  IF latest_id IS DISTINCT FROM p_inbound_id THEN RETURN false; END IF;
  IF NOT EXISTS(SELECT 1 FROM public.messages WHERE id=p_inbound_id AND user_id=p_owner_id AND conversation_id=c.id AND direction='inbound') THEN RETURN false; END IF;
  INSERT INTO public.messages(user_id,conversation_id,contact_id,direction,sender_type,content,content_type,channel_type,external_message_id,metadata,created_at)
    VALUES(p_owner_id,c.id,c.contact_id,'outbound','ai',trim(p_content),'text','web_chat','ai:'||p_inbound_id::text,jsonb_build_object('delivery_status','available'),clock_timestamp()) RETURNING * INTO m;
  UPDATE public.conversations SET last_message_at=m.created_at,unread_count=0 WHERE id=c.id AND user_id=p_owner_id;
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.publish_web_chat_ai_reply(uuid,uuid,uuid,text,boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.publish_web_chat_ai_reply(uuid,uuid,uuid,text,boolean) TO service_role;

CREATE POLICY "Team can read owner approval queue" ON public.ai_approvals FOR SELECT TO authenticated
  USING (EXISTS(SELECT 1 FROM public.team_members WHERE owner_id=ai_approvals.user_id AND member_user_id=auth.uid()));
