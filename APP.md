# Lead to Customer — Complete Application Documentation

> Auto-update: This file should be regenerated whenever structural changes are made.
> Last updated: 2026-04-18

---

## Project Overview

**Lead to Customer** is a Next.js-based SaaS platform for managing and converting leads into customers across multiple communication channels. It combines AI-powered conversation handling, booking management, analytics, and webhook integrations into a unified CRM-like experience.

**Stack**: Next.js 15 App Router · Supabase (PostgreSQL + pgvector + Auth) · TypeScript strict · Tailwind CSS v4 · Anthropic Claude API · Vercel

### Core Value Proposition
- **Multichannel Lead Capture**: WhatsApp, Instagram, SMS, Voice (Vapi), Web Chat
- **AI-Powered Responses**: Claude orchestrator with three-agent system (concierge → knowledge/action)
- **Intelligent Lead Scoring**: Signal-based 0–100 scoring (status, temperature, source, data completeness)
- **Booking Management**: Calendar, services, availability, blocked dates, public booking page
- **Broadcast Campaigns**: Segmented WhatsApp/SMS/Web Chat campaigns by status/temperature/source
- **Analytics & Revenue Forecasting**: KPI dashboards, pipeline forecasting by stage probability
- **Webhook Delivery**: Outbound events (contact.created, booking.completed) with HMAC-SHA256 signing
- **Team & Agency Model**: Team members with roles, sub-accounts for white-label, super-admin impersonation
- **Enterprise Ready**: Audit logs, feature flags, API keys, RLS security

---

## Database Schema (Supabase PostgreSQL)

### Core Tables

#### `profiles`
Extends `auth.users` with business config and integration credentials.
- `user_id` (uuid, UNIQUE) → FK auth.users
- `business_name`, `business_type`, `timezone` (default: Australia/Sydney)
- `subscription_tier` ('free'|'starter'|'pro'|'enterprise'), `role` ('super_admin'|'user')
- **Integration keys** (all stored encrypted): `anthropic_api_key`, `twilio_account_sid`, `twilio_auth_token`, `twilio_phone_number`, `meta_page_id`, `meta_access_token`, `vapi_api_key`, `hubspot_portal_id`, `hubspot_access_token`, `sendgrid_api_key`, `stripe_secret_key`
- `google_calendar_token`, `outlook_calendar_token` (jsonb)
- `stripe_customer_id`, `stripe_subscription_id`
- **RLS**: Users view/update own; super_admins view/update all

#### `contacts`
Unified contact entity across all channels.
- `user_id` (owner), `name`, `email`, `phone`, `company`
- `source_channel` ('whatsapp'|'instagram'|'facebook'|'sms'|'voice'|'web_chat'|'manual'|'hubspot')
- `status` ('new'|'contacted'|'qualified'|'proposal'|'negotiation'|'won'|'lost')
- `temperature` ('cold'|'warm'|'hot'), `score` (0–100 int)
- `last_interaction_at`, `opted_out` (boolean), `metadata` (jsonb — stores win/loss reasons), `tags` (text[])
- `assigned_to` (FK auth.users), `hubspot_contact_id`, `hubspot_deal_id`
- **RLS**: Owner full CRUD; team members (admin/member) view/insert/update; super_admins view all
- **Trigger**: `update_contact_on_message()` — sets temperature='hot' on inbound message

#### `conversations`
One contact × one channel = one conversation.
- `contact_id`, `channel_id`, `channel_type`, `status` ('active'|'paused'|'closed'|'archived')
- `is_ai_active` (boolean), `ai_handoff_reason`, `handoff_at`
- `external_thread_id`, `summary`, `sentiment`, `intent`, `last_message_at`, `unread_count`
- **RLS**: Owner full; team members view/insert/update

#### `messages`
Normalized messages across all channels.
- `conversation_id`, `contact_id`, `direction` ('inbound'|'outbound'), `sender_type` ('contact'|'ai'|'human')
- `content`, `content_type` ('text'|'image'|'audio'|'video'|'document'|'location'|'voice_transcript')
- `channel_type`, `ai_model`, `ai_confidence`, `ai_tokens_used`, `metadata` (jsonb)

#### `channels`
Configured channel instances per user.
- `type` ('whatsapp'|'instagram'|'sms'|'voice'|'web_chat'), `name`, `is_active`
- `config` (jsonb — channel-specific credentials), `webhook_secret`

### Knowledge & AI

#### `knowledge_bases` / `knowledge_documents` / `knowledge_chunks`
- `knowledge_chunks.embedding` — `vector(1536)` (Voyage AI, voyage-2 model)
- **Function**: `match_knowledge_chunks(query_embedding, threshold=0.7, count=5)` — cosine similarity via pgvector
- **Index**: IVFFlat on embedding column

#### `ai_agent_configs`
User-customizable agent settings.
- `agent_type` ('concierge'|'knowledge'|'action'), `system_prompt`, `enabled`, `model`, `max_tokens`, `temperature`

#### `ai_interaction_logs`
Full audit trail of every AI decision.
- `agent_type`, `model`, `input_tokens`, `output_tokens`, `latency_ms`, `tools_called` (jsonb[]), `reasoning`, `error`

### Bookings

#### `services`
- `name`, `description`, `duration_minutes`, `price_cents`, `currency` ('AUD'), `is_active`, `color`
- **RLS**: Owner CRUD; public can SELECT active services

#### `availability_schedules`
- `day_of_week` (0=Sunday), `start_time`, `end_time`, `is_active`

#### `blocked_dates`
- `blocked_date` (date), `reason`, `all_day`, `start_time`, `end_time`

#### `booking_settings`
- `booking_url_slug` (UNIQUE — public booking URL), `min_notice_hours`, `max_advance_days`, `slot_duration_minutes`, `buffer_minutes`
- `require_payment`, `deposit_amount_cents`, `confirmation_message`
- **RLS**: Public can SELECT by slug

#### `bookings`
- `service_id`, `contact_id`, `client_name`, `client_email`, `client_phone`
- `booking_date`, `start_time`, `end_time`
- `status` ('pending'|'confirmed'|'cancelled'|'completed'|'no_show')
- `payment_status`, `stripe_payment_intent_id`, `stripe_checkout_session_id`
- `metadata` (jsonb)

### Broadcasts

#### `broadcasts`
- `name`, `message`, `channel_type` ('whatsapp'|'sms'|'web_chat')
- `segment_status` (text[]), `segment_temperature`, `segment_source_channel` — multi-select filters
- `recipient_count`, `sent_count`, `failed_count`, `status` ('draft'|'sending'|'sent'|'failed')

### Webhooks & Notifications

#### `webhook_endpoints`
- `url`, `events` (text[]), `secret` (HMAC key), `is_active`, `failure_count` (auto-disables at 5)

#### `notifications`
- `type`, `title`, `body`, `link`, `read` (boolean)
- **RLS**: Users view own; service role can insert

### Subscriptions & Analytics

#### `subscriptions`
- `plan`, `status`, `message_count_this_period`, `message_limit`, `ai_calls_this_period`, `ai_calls_limit`

#### `analytics_events`
- `event_type`, `contact_id`, `conversation_id`, `channel_type`, `metadata` (jsonb)

### Team & Agency

#### `team_members`
- `owner_id`, `member_user_id`, `role` ('admin'|'member'|'viewer')
- **Function**: `get_owner_id(uid)` — returns owner_id if team member, else own id

#### `team_invitations`
- `email`, `role`, `token` (UNIQUE), `status` ('pending'|'accepted'|'declined'|'expired'), `expires_at` (7 days)

#### `sub_accounts`
- `business_name`, `contact_name`, `contact_email`, `branding_color`, `status` ('active'|'suspended'|'cancelled')
- `plan`, `monthly_fee_cents`

### API & Admin

#### `api_keys`
- `key_hash` (SHA-256), `key_prefix` (first 8 chars for display), `is_active`, `scopes` (text[])

#### `audit_logs`
- `actor_id`, `actor_email`, `action` (e.g., 'user.suspend'), `target_type`, `target_id`, `metadata` (jsonb)
- `ip_address`, `user_agent`
- **RLS**: No user SELECT; service role only

#### `feature_flags` / `feature_flag_overrides`
- `key` (UNIQUE), `enabled_globally`, `rollout_percentage` (0–100)
- Per-user overrides via `feature_flag_overrides`

#### `admin_notes` / `account_tags`
- Internal notes and labels ('enterprise', 'vip', 'at-risk', 'beta-user') for super-admin use

### Migration Files
| File | Purpose |
|------|---------|
| `20260410_core_tables.sql` | profiles, contacts, conversations, messages, channels |
| `20260411_ai_and_knowledge.sql` | knowledge_bases, knowledge_documents, knowledge_chunks, ai_agent_configs, ai_interaction_logs |
| `20260412_subscriptions_and_analytics.sql` | subscriptions, analytics_events, webhook_logs |
| `20260413_indexes.sql` | Performance indexes |
| `20260414_functions.sql` | match_knowledge_chunks(), get_owner_id(), increment_message_count() |
| `20260415_roles_and_teams.sql` | team_members, team_invitations, RLS policies |
| `20260416_booking_system.sql` | services, availability_schedules, blocked_dates, booking_settings, bookings |
| `20260417_api_keys.sql` | api_keys with SHA-256 hash storage |
| `20260417_broadcasts.sql` | broadcasts with segment filters |
| `20260417_notifications.sql` | notifications table |
| `20260417_sub_accounts.sql` | sub_accounts for agency/white-label |
| `20260417_webhook_endpoints.sql` | webhook_endpoints with auto-disable at 5 failures |
| `20260418_anthropic_key.sql` | profiles.anthropic_api_key column |
| `20260418_audit_logs.sql` | audit_logs, feature_flags, admin_notes, account_tags |

---

## API Routes (Complete Reference)

### Contacts
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/contacts` | getAPIContext | List with pagination, filters (status/temperature/source/search) |
| POST | `/api/contacts` | getAPIContext | Create; fires `contact.created` webhook |
| GET | `/api/contacts/[id]` | getAPIContext | Fetch single |
| PUT | `/api/contacts/[id]` | getAPIContext | Update (status triggers win/loss modal) |
| DELETE | `/api/contacts/[id]` | getAPIContext | Delete |
| POST | `/api/contacts/[id]/score` | getAPIContext | Recalculate lead score via scoring lib |

### AI
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/ai/deal-diagnosis` | getAPIContext | Claude analyzes stalled deal + 3 recommendations |
| POST | `/api/ai/meeting-prep` | getAPIContext | Claude generates meeting prep notes |
| POST | `/api/ai/generate-suggestion` | getAPIContext | Context-aware AI suggestion |
| POST | `/api/ai/process-message` | getAPIContext | Internal: run message through orchestrator |

### Chat Widget (Public)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/chat/init` | None (rate: 10/IP/min) | Create session, return sessionId |
| POST | `/api/chat/message` | None (rate: 30/session/min) | Message → AI orchestrator → response |
| GET | `/api/widget/[businessId]` | None | Widget config (colors, greeting) |

### Conversations & Messages
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/conversations` | getAPIContext | List with filters |
| GET/PUT | `/api/conversations/[id]` | getAPIContext | Fetch/update single |
| GET | `/api/conversations/[id]/messages` | getAPIContext | Paginated messages |
| POST | `/api/conversations/[id]/messages` | getAPIContext | Human reply |

### Bookings
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET/PUT | `/api/bookings/settings` | getAPIContext | Booking page config |
| GET/POST | `/api/bookings/services` | getAPIContext | CRUD services |
| PUT/DELETE | `/api/bookings/services/[id]` | getAPIContext | Update/delete service |
| GET | `/api/bookings/availability` | getAPIContext | Compute available slots |
| GET/POST | `/api/bookings/blocked-dates` | getAPIContext | Manage blocked dates |
| GET | `/api/bookings` | getAPIContext | List bookings |
| GET/PUT/DELETE | `/api/bookings/[id]` | getAPIContext | Single booking; PUT fires `booking.completed` webhook |
| GET | `/api/public/booking/[slug]` | None | Public booking page info |
| POST | `/api/public/booking/[slug]/book` | None | Public booking submission |
| GET | `/api/public/booking/[slug]/slots` | None | Available time slots |

### Broadcasts
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET/POST | `/api/broadcasts` | getAPIContext | List / create draft |
| POST | `/api/broadcasts/preview` | getAPIContext | Count recipients matching segment |
| POST | `/api/broadcasts/[id]/send` | getAPIContext | Send to all matching contacts |

### Analytics
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/analytics` | getAPIContext | Dashboard KPIs |
| GET | `/api/analytics/forecast` | getAPIContext | Stage × probability × avg deal value |
| GET | `/api/analytics/team` | getAPIContext | Agent performance + daily chart |

### Automation
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/automation/waterfall` | getAPIContext | Stalled contacts (last_interaction_at >= N days) |
| POST | `/api/automation/waterfall/trigger` | getAPIContext | Send follow-up, create notification |

### Knowledge Base
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET/POST | `/api/knowledge-bases` | getAPIContext | List / create |
| PUT/DELETE | `/api/knowledge-bases/[id]` | getAPIContext | Update / delete |
| POST | `/api/knowledge-bases/[id]/documents` | getAPIContext | Upload + chunk + embed via Voyage AI |
| GET/DELETE | `/api/knowledge-bases/[id]/documents/[docId]` | getAPIContext | List / delete documents |

### Settings
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET/PUT | `/api/settings/profile` | getUser | Business profile |
| GET/PUT | `/api/settings/integrations` | getUser | Integration keys (Anthropic, Twilio, Meta, etc.) |
| GET/POST | `/api/settings/api-keys` | getAPIContext | List / generate API key (SHA-256 hash stored) |
| DELETE | `/api/settings/api-keys/[id]` | getAPIContext | Revoke |
| GET/POST | `/api/settings/webhooks` | getAPIContext | List / create webhook endpoint |
| PATCH/DELETE | `/api/settings/webhooks/[id]` | getAPIContext | Update / delete endpoint |

### Team & Agency
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET/POST | `/api/team` | getAPIContext | List / invite team member |
| PUT/DELETE | `/api/team/[id]` | getAPIContext | Update role / remove |
| POST | `/api/team/invitations/accept` | None | Accept invite via token |
| GET/POST | `/api/agency/sub-accounts` | getAPIContext | List / create sub-account |
| PATCH/DELETE | `/api/agency/sub-accounts/[id]` | getAPIContext | Update / delete |

### Admin (super_admin only)
| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | `/api/admin/health` | super_admin | Anthropic + Supabase + Redis health check |
| GET | `/api/admin/health/errors` | super_admin | Recent errors from audit_logs |
| GET/POST | `/api/admin/audit-logs` | super_admin | View / export CSV |
| GET/POST/PUT/DELETE | `/api/admin/feature-flags` | super_admin | Feature flag management |
| GET/PUT/DELETE | `/api/admin/users/[id]` | super_admin | User management + notes + tags |
| POST | `/api/admin/impersonate` | super_admin | Impersonate user (creates audit entry) |
| GET | `/api/admin/stats` | super_admin | Platform-wide MRR, churn, signups |
| GET/POST | `/api/admin/accounts` | super_admin | Account management |
| POST | `/api/admin/communications/announcement` | super_admin | Platform-wide email/banner |

### Inbound Webhooks (External Services)
| Route | Service | Description |
|-------|---------|-------------|
| POST `/api/webhooks/twilio` | Twilio | WhatsApp/SMS inbound → AI orchestrator |
| POST `/api/webhooks/twilio/voice` | Twilio | Voice call inbound |
| POST `/api/webhooks/twilio/status` | Twilio | Delivery/read status |
| POST `/api/webhooks/meta` | Meta | Instagram/Messenger inbound |
| POST `/api/webhooks/hubspot` | HubSpot | Contact/deal sync |
| POST `/api/webhooks/stripe` | Stripe | Subscription events |
| POST `/api/webhooks/vapi` | Vapi | Voice agent events / transcripts |

---

## Frontend Pages

### Marketing (Public) — `src/app/(marketing)/`
`/` · `/pricing` · `/features` · `/solutions` · `/integrations` · `/api-docs` · `/docs` · `/blog` · `/case-studies` · `/about` · `/careers` · `/compare` · `/status` · `/contact` · `/privacy` · `/terms` · `/security` · `/changelog`

### Auth — `src/app/(auth)/`
`/login` · `/register` · `/forgot-password`

### Dashboard (Protected) — `src/app/(dashboard)/`

| Route | Description |
|-------|-------------|
| `/` (dashboard) | Overview KPIs, recent activity, today's bookings |
| `/contacts` | Contact table; lead score bar; Win/Loss modal on status change; AI Diagnose button |
| `/contacts/[id]` | Full contact detail: history, messages, timeline |
| `/leads` | Kanban board by pipeline status |
| `/conversations` | Real-time thread viewer with quick reply and handoff |
| `/broadcasts` | Campaign list; create with segment chips; live preview; confirm-send modal |
| `/bookings` | Calendar + table view; create/edit/cancel |
| `/bookings/settings` | Services CRUD, availability editor, blocked dates, slug/payment config |
| `/analytics` | KPI cards, Revenue Forecast section, daily bar chart, channel breakdown; "Team Analytics →" link |
| `/analytics/team` | Agent performance KPIs, daily AI calls chart, channel distribution |
| `/channels` | Configured channel instances |
| `/knowledge` | Knowledge base management, document upload |
| `/system-flow` | System architecture diagram |
| `/app-pages` | App page map/reference |

#### Settings — `/settings/*`
| Route | Description |
|-------|-------------|
| `/settings` | Settings index (grid of cards) |
| `/settings/profile` | Business name, type, timezone, website |
| `/settings/integrations` | Anthropic, Twilio, Meta, HubSpot, Stripe, Vapi — connect via modal |
| `/settings/api-keys` | Generate/revoke API keys; one-time secret display |
| `/settings/webhooks` | Webhook endpoints; event reference; HMAC secret |
| `/settings/automation` | Waterfall follow-up rules; stalled contacts; inline send |
| `/settings/team` | Invite, manage roles, remove members |
| `/settings/agency` | Sub-account management; branding color; monthly fee |
| `/settings/ai` | Agent enable/disable, system prompts, model config |
| `/settings/widget` | Chat widget styling + embed code generator |
| `/settings/billing` | Plan, usage meters, Stripe payment method |
| `/settings/compliance` | GDPR export, data deletion |

#### Admin — `/admin/*`
`/admin/audit-logs` · `/admin/accounts` · `/admin/users` · `/admin/feature-flags` · `/admin/communications` · `/admin/health` (system health)

#### Public
`/book/[slug]` — Public booking page (service select → date → time → form → payment → confirmation)

---

## Key Libraries & Business Logic

### AI Orchestrator (`src/lib/ai/orchestrator.ts`)

```
processInboundMessage(params)
  1. isOptOutMessage() → mark opted_out, return opt-out response
  2. runConcierge() → classify: intent, sentiment, urgency, routing
  3. Route:
     ├─ "knowledge"        → vector search knowledge_chunks → RAG answer
     ├─ "action"           → tool-use loop (check_calendar, book_appointment,
     │                        generate_payment_link, update_contact, escalate)
     ├─ "direct_response"  → static greeting/thanks
     └─ "human_handoff"    → set is_ai_active=false
  4. composeResponse() → add compliance footer
  5. logAIInteraction() → insert ai_interaction_logs
```

**Tool-use loop** (action agent): up to 5 iterations until no more tool calls.

### Lead Scoring (`src/lib/scoring/lead-score.ts`)

| Signal | Score |
|--------|-------|
| Won (terminal) | 100 |
| Negotiation | 80 |
| Proposal | 60 |
| Qualified | 40 |
| Contacted | 20 |
| New | 5 |
| Lost (terminal) | 0 |
| Temp: Hot | +30 |
| Temp: Warm | +20 |
| Temp: Cold | +5 |
| Source: HubSpot | +20 |
| Source: WhatsApp | +15 |
| Source: Instagram | +12 |
| Source: Facebook/SMS | +10 |
| Source: Web Chat | +8 |
| Source: Manual | +5 |
| Has email | +5 |
| Has phone | +5 |
| Has company | +3 |

**Result**: `min(100, max(0, sum))` — Won/Lost are always terminal at 100/0.

### Revenue Forecasting Stage Weights

| Stage | Probability |
|-------|-------------|
| New | 0% |
| Contacted | 15% |
| Qualified | 35% |
| Proposal | 60% |
| Negotiation | 80% |
| Won | 100% |

**Formula**: `count_in_stage × P(stage) × avg_deal_value` — summed across all stages.

### Waterfall Follow-Up Sequence
1. WhatsApp (primary)
2. SMS (secondary)
3. Email (fallback)
4. Manual Call (last resort)

**Stalled criteria**: `last_interaction_at >= N days` (default 3) AND status NOT IN ('won', 'lost', 'new').

### Broadcast Segmentation
- Filters: `segment_status`, `segment_temperature`, `segment_source_channel` (all optional, empty = all)
- Always excludes `opted_out = true` (GDPR/CCPA compliance)

### Webhook Delivery (`src/lib/webhooks/deliver.ts`)
- HMAC-SHA256 signing: `X-LeadFlow-Signature: sha256=<hex>`
- 5s timeout per request via AbortController
- Auto-disable endpoint at 5 consecutive failures
- Non-blocking: `void deliverWebhookEvent(...)` — errors never bubble up
- Events fired: `contact.created`, `booking.completed`

### Rate Limiting (`src/lib/rate-limit/chat.ts`)
- `/api/chat/init` → 10 inits per IP per minute (sliding window)
- `/api/chat/message` → 30 messages per sessionId per minute
- Upstash Redis backend; gracefully allows-all if env vars not configured

### Auth Model (`src/lib/auth/get-user.ts`)

```typescript
getAPIContext() → {
  user: User
  ownerId: string        // team owner's id if member, else self
  platformRole: 'super_admin' | 'user'
  teamRole: 'admin' | 'member' | 'viewer' | null
  isOwner: boolean
  isSuperAdmin: boolean
}
```

- `SKIP_AUTH=true` → returns hardcoded DEV_USER (dev only, **must remove in prod**)
- All DB queries filter by `ownerId` (not just `user.id`) to prevent IDOR

### Supabase Clients
- `createServerClient()` — cookie-based SSR client (API routes + Server Components)
- `createAdminClient()` — service role client (public endpoints, admin operations)
- Browser client in `src/lib/supabase/client.ts`

### Channel Adapters (`src/lib/channels/adapters/`)
Each adapter implements:
```typescript
interface ChannelAdapter {
  normalizeInbound(rawPayload): NormalizedMessage | null
  sendOutbound(message: OutboundMessage): Promise<SendResult>
  validateWebhookSignature(payload, signature, secret): boolean
}
```
Adapters: `whatsapp.ts` (Twilio) · `sms.ts` (Twilio) · `instagram.ts` (Meta Graph API) · `voice.ts` (Vapi) · `web-chat.ts` (internal)

---

## Integrations

| Service | SDK/Method | Auth | Usage |
|---------|-----------|------|-------|
| **Anthropic** | `@anthropic-ai/sdk` | `ANTHROPIC_API_KEY` or `profiles.anthropic_api_key` | All AI reasoning, tool use |
| **Twilio** | `twilio` npm | `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` | WhatsApp, SMS, Voice |
| **Meta** | Graph API via fetch | `META_PAGE_ID`, `META_ACCESS_TOKEN` | Instagram DMs, Messenger |
| **Stripe** | `stripe` npm | `STRIPE_SECRET_KEY` | Booking payments, subscriptions |
| **Resend** | `resend` npm | `RESEND_API_KEY` | Booking confirmations, invitations |
| **Vapi** | REST API | `VAPI_API_KEY` | Outbound voice calls, IVR |
| **Upstash** | `@upstash/redis`, `@upstash/ratelimit` | `UPSTASH_REDIS_REST_URL/TOKEN` | Rate limiting chat endpoints |
| **Voyage AI** | REST API | `VOYAGE_API_KEY` | Knowledge base embeddings (1536d) |
| **HubSpot** | REST API | `hubspot_access_token` in profiles | Contact/deal sync |

---

## Environment Variables

### Required
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### AI
```
ANTHROPIC_API_KEY          # or set via Settings → Integrations UI
VOYAGE_API_KEY             # knowledge base embeddings
```

### Channels
```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
META_VERIFY_TOKEN
META_APP_SECRET
VAPI_WEBHOOK_SECRET
```

### Payments & Email
```
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
```

### Rate Limiting
```
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

### App
```
NEXT_PUBLIC_APP_URL        # prod domain (NOT localhost in prod)
SKIP_AUTH                  # dev only — remove in prod!
```

---

## Security

### RLS Summary
- All tables: RLS enabled
- Pattern: `user_id = auth.uid()` for owners; subquery via `team_members` for team access
- Super-admin: `EXISTS (SELECT 1 FROM profiles WHERE role='super_admin')` policies
- Public tables: `services`, `availability_schedules`, `blocked_dates`, `booking_settings` allow public SELECT for booking page

### API Key Security
- SHA-256 hash stored (`key_hash`) — never store plaintext
- First 8 chars stored as `key_prefix` for display
- Raw key shown once in creation response; user must copy immediately

### HMAC Webhook Signing
```
X-LeadFlow-Signature: sha256=<hex>
X-LeadFlow-Event: contact.created
```

### Audit Logging
- All admin actions → `audit_logs` (actor, action, target, ip, user_agent, timestamp)
- Searchable, exportable as CSV

---

## Subscription Tiers

| Tier | Messages/mo | AI Calls/mo | Teams | API Keys | Webhooks |
|------|-------------|-------------|-------|----------|---------|
| Free ($0) | 100 | 50 | No | No | No |
| Starter ($99) | 1,000 | 200 | 2 | Yes | Yes |
| Pro ($499) | 10,000 | 1,000 | 10 | Yes | Yes |
| Enterprise | Unlimited | Unlimited | Unlimited | Yes | Yes |

---

## UI Component Library (`src/components/`)

### Primitives (`ui/`)
`button` · `input` · `textarea` · `select` · `modal` · `card` · `tabs` · `badge` · `avatar` · `dropdown` · `data-table` · `pagination` · `search-input` · `file-upload` · `toggle` · `skeleton` · `empty-state` · `toast`

### Layout (`layout/`)
`sidebar.tsx` — Dashboard nav (all routes, collapsed state, active highlighting)
`header.tsx` — Top bar with notifications, user menu
`dashboard-shell.tsx` — Sidebar + header + main content
`notification-panel.tsx` — Bell icon dropdown

### Feature Components
`kpi-cards.tsx` · `activity-feed.tsx` · `dashboard-charts.tsx` (Recharts)
`conversations-list.tsx` · `conversation-thread.tsx` (message bubbles)
`integration-card.tsx` · `profile-form.tsx` · `copy-embed-code.tsx`
`impersonation-banner.tsx` (admin) · `activity-timeline.tsx` · `user-notes.tsx`

---

## Development

### Commands
```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npx supabase db push # Push migrations to Supabase
npx supabase gen types typescript --local > src/types/supabase.ts
```

### Key Conventions
- Server Components by default; `"use client"` only when needed
- Absolute imports via `@/` prefix
- Zod validators in `src/lib/validators/` for all API inputs
- `getAPIContext()` on every API route before DB access
- Filter all queries by `ctx.ownerId` (not `user.id`) to prevent IDOR
- Non-blocking side effects: `void deliverWebhookEvent(...)`

### API Route Pattern
```typescript
export async function POST(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const input = mySchema.parse(body);

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("table")
    .insert({ ...input, user_id: ctx.ownerId });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  void deliverWebhookEvent(supabase, ctx.ownerId, { event: "x.created", data });
  return NextResponse.json({ data }, { status: 201 });
}
```

---

## Known Limitations & Pending

- Migrations not yet pushed to remote Supabase (`npx supabase db push` needed)
- `SKIP_AUTH=true` in .env.local — must remove before production deploy
- `NEXT_PUBLIC_APP_URL` still set to localhost:3000 — update to prod domain
- Rate limiting inactive until `UPSTASH_REDIS_REST_URL/TOKEN` configured in Vercel
- Voyage AI embeddings degrade silently to zero vectors without `VOYAGE_API_KEY`
- Voice (Vapi) integration partially implemented — call transcription only

---

*Total tables: 30+ · Total API routes: 80+ · Total UI pages: 50+*
