-- Migration 4: Indexes for performance

-- Contacts indexes
CREATE INDEX idx_contacts_user_status ON contacts(user_id, status);
CREATE INDEX idx_contacts_user_temperature ON contacts(user_id, temperature);
CREATE INDEX idx_contacts_user_last_interaction ON contacts(user_id, last_interaction_at DESC);
CREATE INDEX idx_contacts_user_source ON contacts(user_id, source_channel);
CREATE INDEX idx_contacts_email ON contacts(user_id, email);
CREATE INDEX idx_contacts_phone ON contacts(user_id, phone);

-- Conversations indexes
CREATE INDEX idx_conversations_user_contact ON conversations(user_id, contact_id);
CREATE INDEX idx_conversations_user_last_message ON conversations(user_id, last_message_at DESC);
CREATE INDEX idx_conversations_user_status ON conversations(user_id, status);
CREATE INDEX idx_conversations_external_thread ON conversations(external_thread_id);

-- Messages indexes
CREATE INDEX idx_messages_conversation_created ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_user_created ON messages(user_id, created_at DESC);
CREATE INDEX idx_messages_external_id ON messages(external_message_id);

-- Channels indexes
CREATE INDEX idx_channels_user_type ON channels(user_id, type);

-- Knowledge indexes
CREATE INDEX idx_knowledge_chunks_base ON knowledge_chunks(knowledge_base_id);
CREATE INDEX idx_knowledge_chunks_document ON knowledge_chunks(document_id);
CREATE INDEX idx_knowledge_docs_base ON knowledge_documents(knowledge_base_id);

-- Vector similarity index (IVFFlat)
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Analytics indexes
CREATE INDEX idx_analytics_user_type_created ON analytics_events(user_id, event_type, created_at);
CREATE INDEX idx_analytics_user_created ON analytics_events(user_id, created_at DESC);

-- Webhook logs indexes
CREATE INDEX idx_webhook_logs_source_created ON webhook_logs(source, created_at DESC);

-- AI interaction logs indexes
CREATE INDEX idx_ai_logs_user_created ON ai_interaction_logs(user_id, created_at DESC);
CREATE INDEX idx_ai_logs_conversation ON ai_interaction_logs(conversation_id);
