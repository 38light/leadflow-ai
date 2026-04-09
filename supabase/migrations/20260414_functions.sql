-- Migration 5: Database functions and triggers

-- Generic updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON channels FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON knowledge_bases FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON knowledge_documents FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON ai_agent_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Update contact temperature to 'hot' on new inbound message
CREATE OR REPLACE FUNCTION update_contact_on_message()
RETURNS trigger AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_message_inserted
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_contact_on_message();

-- Vector similarity search for knowledge chunks
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
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    kc.id,
    kc.content,
    kc.document_id,
    kc.chunk_index,
    1 - (kc.embedding <=> query_embedding) AS similarity
  FROM knowledge_chunks kc
  WHERE
    (p_user_id IS NULL OR kc.user_id = p_user_id)
    AND (p_knowledge_base_id IS NULL OR kc.knowledge_base_id = p_knowledge_base_id)
    AND 1 - (kc.embedding <=> query_embedding) > match_threshold
  ORDER BY kc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment message count on subscription
CREATE OR REPLACE FUNCTION increment_message_count(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET message_count_this_period = message_count_this_period + 1
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment AI call count on subscription
CREATE OR REPLACE FUNCTION increment_ai_call_count(p_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE subscriptions
  SET ai_calls_this_period = ai_calls_this_period + 1
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
