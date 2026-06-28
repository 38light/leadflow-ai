# Lead to Customer — Product Requirements Document

> Last updated: 2026-04-18
> Version: 1.0
> Status: Active Development

---

## 1. Product Overview

### 1.1 What It Is

**Lead to Customer** is a multichannel AI-powered CRM and lead conversion platform built for service businesses. It unifies lead capture, AI-driven conversations, booking management, and revenue analytics into a single product.

The platform replaces fragmented tools (a WhatsApp inbox here, a booking app there, a spreadsheet for leads) with one system that handles the full customer journey — from first contact to booked and paid appointment.

### 1.2 Core Problem

Service businesses lose leads because:
- Inquiries arrive across WhatsApp, Instagram, SMS, and web chat simultaneously — no single inbox
- Manual follow-up is slow; leads go cold within minutes
- No visibility into which leads are worth pursuing
- Booking friction causes drop-off after initial interest
- Teams have no data on what's working

### 1.3 Solution

- **Unified inbox** across all channels with AI handling conversations 24/7
- **Intelligent lead scoring** so humans focus on hot leads
- **Embedded booking** so AI can schedule appointments mid-conversation
- **Revenue forecasting** and pipeline analytics
- **Automation** to re-engage stalled leads across channels

### 1.4 Target Users

| Persona | Description | Primary Pain |
|---------|-------------|--------------|
| **Owner/Solo Operator** | Runs a service business (driving school, celebrant, clinic) | Missing leads while serving current customers |
| **Sales Manager** | Manages a small team of 2–10 reps | No visibility into team performance or pipeline health |
| **Agency Owner** | Runs multiple client accounts | Switching between dashboards; no white-label option |
| **Super Admin** | Platform operator (us) | Managing accounts, flags, billing, support |

---

## 2. Business Model

### 2.1 Subscription Tiers

| Tier | Price | Messages/mo | AI Calls/mo | Team Members | API Keys | Webhooks |
|------|-------|-------------|-------------|--------------|----------|---------|
| **Free** | $0 | 100 | 50 | No | No | No |
| **Starter** | $99/mo | 1,000 | 200 | 2 | Yes | Yes |
| **Pro** | $499/mo | 10,000 | 1,000 | 10 | Yes | Yes |
| **Enterprise** | Custom | Unlimited | Unlimited | Unlimited | Yes | Yes |

### 2.2 Agency / White-Label

Agency subscribers can create **sub-accounts** — each with its own branding color, contact person, plan assignment, and monthly fee. This enables resellers to offer Lead to Customer under their own brand.

---

## 3. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router, Turbopack) |
| Language | TypeScript 5.7 (strict mode) |
| Database | Supabase (PostgreSQL + pgvector + Auth + Storage) |
| Styling | Tailwind CSS v4 |
| AI | Anthropic Claude (`@anthropic-ai/sdk` 0.39) |
| Embeddings | Voyage AI (voyage-2, 1536 dimensions) |
| Channels | Twilio (WhatsApp/SMS/Voice), Meta Graph API (Instagram), Vapi (Voice AI) |
| Payments | Stripe |
| Email | Resend |
| Rate Limiting | Upstash Redis + `@upstash/ratelimit` |
| State | Zustand (client), React Server Components (server) |
| Charts | Recharts |
| Deployment | Vercel |

---

## 4. Application Architecture

### 4.1 Route Groups

```
src/app/
├── (auth)/          — Login, register, forgot-password
├── (dashboard)/     — All authenticated pages + admin
├── (marketing)/     — Public marketing site
├── api/             — All API handlers
├── book/[slug]/     — Public booking page
└── chat-widget/     — Embeddable chat widget iframe
```

### 4.2 AI Orchestration Flow

Every inbound message (WhatsApp, SMS, Instagram, Web Chat, Voice) runs through the same orchestrator:

```
inbound message
  → isOptOutMessage()?  → mark opted_out, return opt-out response
  → runConcierge()      → classify: intent / sentiment / urgency / routing
  → route:
      "knowledge"        → vector search knowledge_chunks (pgvector cosine)
                           → RAG answer via knowledge agent
      "action"           → tool-use loop (up to 5 iterations):
                               check_calendar
                               book_appointment
                               generate_payment_link
                               update_contact
                               escalate
      "direct_response"  → static greeting / acknowledgement
      "human_handoff"    → set is_ai_active=false, notify team
  → composeResponse()   → add compliance footer
  → logAIInteraction()  → insert into ai_interaction_logs
```

### 4.3 Auth Model

```typescript
getAPIContext() → {
  user: User
  ownerId: string          // team owner's id if member, else self
  platformRole: 'super_admin' | 'user'
  teamRole: 'admin' | 'member' | 'viewer' | null
  isOwner: boolean
  isSuperAdmin: boolean
}
```

All DB queries filter by `ownerId` (not raw `user.id`) to prevent IDOR across team member scenarios.

---

## 5. Database Schema

### 5.1 Core Tables

#### `profiles`
Extends `auth.users` with all business configuration.
- Identity: `user_id` (UUID, UNIQUE → FK auth.users), `business_name`, `business_type`, `timezone` (default: Australia/Sydney)
- Plan: `subscription_tier` ('free'|'starter'|'pro'|'enterprise'), `role` ('super_admin'|'user')
- Integrations (all encrypted): `anthropic_api_key`, `twilio_account_sid`, `twilio_auth_token`, `twilio_phone_number`, `meta_page_id`, `meta_access_token`, `vapi_api_key`, `hubspot_portal_id`, `hubspot_access_token`, `sendgrid_api_key`, `stripe_secret_key`
- Calendar tokens: `google_calendar_token`, `outlook_calendar_token` (jsonb)
- Billing: `stripe_customer_id`, `stripe_subscription_id`
- **RLS**: Users view/update own profile; super_admins view/update all

#### `contacts`
Unified contact entity across all channels.
- `user_id`, `name`, `email`, `phone`, `company`
- `source_channel`: 'whatsapp'|'instagram'|'facebook'|'sms'|'voice'|'web_chat'|'manual'|'hubspot'
- `status`: 'new'|'contacted'|'qualified'|'proposal'|'negotiation'|'won'|'lost'
- `temperature`: 'cold'|'warm'|'hot'
- `score`: 0–100 integer (lead score)
- `last_interaction_at`, `opted_out` (GDPR), `metadata` (jsonb — stores win/loss reasons), `tags` (text[])
- `assigned_to` (FK auth.users), `hubspot_contact_id`, `hubspot_deal_id`
- **Trigger**: `update_contact_on_message()` — auto-sets temperature='hot' on any inbound message
- **RLS**: Owner full CRUD; team members (admin/member) view/insert/update; super_admins view all

#### `conversations`
One contact × one channel = one conversation.
- `contact_id`, `channel_id`, `channel_type`, `status`: 'active'|'paused'|'closed'|'archived'
- `is_ai_active` (boolean — toggleable per conversation)
- `ai_handoff_reason`, `handoff_at`
- `external_thread_id`, `summary`, `sentiment`, `intent`
- `last_message_at`, `unread_count`
- **RLS**: Owner full; team members view/insert/update

#### `messages`
Normalized message store across all channels.
- `conversation_id`, `contact_id`
- `direction`: 'inbound'|'outbound'
- `sender_type`: 'contact'|'ai'|'human'
- `content`, `content_type`: 'text'|'image'|'audio'|'video'|'document'|'location'|'voice_transcript'
- `channel_type`, `ai_model`, `ai_confidence`, `ai_tokens_used`, `metadata` (jsonb)

#### `channels`
Configured channel instances per user.
- `type`: 'whatsapp'|'instagram'|'sms'|'voice'|'web_chat'
- `name`, `is_active`, `config` (jsonb — channel credentials), `webhook_secret`

### 5.2 Knowledge & AI Tables

#### `knowledge_bases`
Top-level knowledge container per user.

#### `knowledge_documents`
Files uploaded to a knowledge base.

#### `knowledge_chunks`
- `embedding` — `vector(1536)` (Voyage AI voyage-2)
- **Function**: `match_knowledge_chunks(query_embedding, threshold=0.7, count=5)` — cosine similarity via pgvector
- **Index**: IVFFlat on embedding column

#### `ai_agent_configs`
User-customizable per-agent settings.
- `agent_type`: 'concierge'|'knowledge'|'action'
- `system_prompt`, `enabled`, `model`, `max_tokens`, `temperature`

#### `ai_interaction_logs`
Full audit trail of every AI decision.
- `agent_type`, `model`, `input_tokens`, `output_tokens`, `latency_ms`
- `tools_called` (jsonb[]), `reasoning`, `error`

### 5.3 Booking Tables

#### `services`
- `name`, `description`, `duration_minutes`, `price_cents`, `currency` ('AUD'), `is_active`, `color`
- **RLS**: Owner CRUD; public can SELECT active services

#### `availability_schedules`
- `day_of_week` (0=Sunday), `start_time`, `end_time`, `is_active`

#### `blocked_dates`
- `blocked_date`, `reason`, `all_day`, `start_time`, `end_time`

#### `booking_settings`
- `booking_url_slug` (UNIQUE — determines public URL)
- `min_notice_hours`, `max_advance_days`, `slot_duration_minutes`, `buffer_minutes`
- `require_payment`, `deposit_amount_cents`, `confirmation_message`
- **RLS**: Public can SELECT by slug (no auth required)

#### `bookings`
- `service_id`, `contact_id`, `client_name`, `client_email`, `client_phone`
- `booking_date`, `start_time`, `end_time`
- `status`: 'pending'|'confirmed'|'cancelled'|'completed'|'no_show'
- `payment_status`, `stripe_payment_intent_id`, `stripe_checkout_session_id`
- `metadata` (jsonb)

### 5.4 Broadcast Tables

#### `broadcasts`
- `name`, `message`, `channel_type`: 'whatsapp'|'sms'|'web_chat'
- Segment filters: `segment_status` (text[]), `segment_temperature`, `segment_source_channel`
- `recipient_count`, `sent_count`, `failed_count`
- `status`: 'draft'|'sending'|'sent'|'failed'
- Always excludes `opted_out = true`

### 5.5 Webhook & Notification Tables

#### `webhook_endpoints`
- `url`, `events` (text[]), `secret` (HMAC key), `is_active`
- `failure_count` — auto-disables endpoint at 5 consecutive failures

#### `notifications`
- `type`, `title`, `body`, `link`, `read` (boolean)
- **RLS**: Users view own; service role can insert

### 5.6 Subscription & Analytics Tables

#### `subscriptions`
- `plan`, `status`
- `message_count_this_period`, `message_limit`
- `ai_calls_this_period`, `ai_calls_limit`

#### `analytics_events`
- `event_type`, `contact_id`, `conversation_id`, `channel_type`, `metadata` (jsonb)

### 5.7 Team & Agency Tables

#### `team_members`
- `owner_id`, `member_user_id`, `role`: 'admin'|'member'|'viewer'
- **Function**: `get_owner_id(uid)` — returns owner_id if team member, else own uid

#### `team_invitations`
- `email`, `role`, `token` (UNIQUE)
- `status`: 'pending'|'accepted'|'declined'|'expired'
- `expires_at` (7 days from creation)

#### `sub_accounts`
- `business_name`, `contact_name`, `contact_email`, `branding_color`
- `status`: 'active'|'suspended'|'cancelled'
- `plan`, `monthly_fee_cents`

### 5.8 API & Admin Tables

#### `api_keys`
- `key_hash` (SHA-256 — never store plaintext)
- `key_prefix` (first 8 chars for display)
- `is_active`, `scopes` (text[])

#### `audit_logs`
- `actor_id`, `actor_email`, `action` (e.g., 'user.suspend')
- `target_type`, `target_id`, `metadata` (jsonb)
- `ip_address`, `user_agent`, `timestamp`
- **RLS**: No user SELECT; service role only

#### `feature_flags` / `feature_flag_overrides`
- `key` (UNIQUE), `enabled_globally`, `rollout_percentage` (0–100)
- Per-user override table for controlled rollouts

#### `admin_notes` / `account_tags`
- Tags: 'enterprise'|'vip'|'at-risk'|'beta-user'
- Internal notes per account for super-admin use

### 5.9 Migration History

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
| `20260417_webhook_endpoints.sql` | webhook_endpoints with auto-disable |
| `20260418_anthropic_key.sql` | profiles.anthropic_api_key column |
| `20260418_audit_logs.sql` | audit_logs, feature_flags, admin_notes, account_tags |
| `20260418_feature_flags.sql` | Feature flag system |
| `20260419_support_tools.sql` | Support/admin tools |
| `20260420_sendgrid_stripe_keys.sql` | Integration API key columns |

---

## 6. Feature Specifications

### 6.1 Multichannel Inbox

**Channels supported:**
- WhatsApp (via Twilio)
- SMS (via Twilio)
- Instagram DMs (via Meta Graph API)
- Voice calls (via Vapi + Twilio)
- Web Chat (embedded widget)
- Manual (direct entry)
- HubSpot sync

**Channel Adapters** (`src/lib/channels/adapters/`) — each implements:
```typescript
interface ChannelAdapter {
  normalizeInbound(rawPayload): NormalizedMessage | null
  sendOutbound(message: OutboundMessage): Promise<SendResult>
  validateWebhookSignature(payload, signature, secret): boolean
}
```

**Inbound Webhooks:**
| Route | Service |
|-------|---------|
| `POST /api/webhooks/twilio` | WhatsApp/SMS inbound → orchestrator |
| `POST /api/webhooks/twilio/voice` | Voice call inbound |
| `POST /api/webhooks/twilio/status` | Delivery/read status |
| `POST /api/webhooks/meta` | Instagram/Messenger inbound |
| `POST /api/webhooks/hubspot` | Contact/deal sync |
| `POST /api/webhooks/stripe` | Subscription events |
| `POST /api/webhooks/vapi` | Voice agent events / transcripts |

### 6.2 AI Agent System

Three-agent architecture, all powered by Anthropic Claude:

**Concierge Agent** (`src/lib/ai/agents/concierge.ts`)
- First handler for every message
- Classifies: intent, sentiment, urgency, routing decision
- Outputs one of: 'knowledge' / 'action' / 'direct_response' / 'human_handoff'

**Knowledge Agent** (`src/lib/ai/agents/knowledge.ts`)
- RAG via pgvector cosine similarity search on `knowledge_chunks`
- Answers product/service questions from uploaded documents
- Threshold: 0.7 similarity; returns top 5 chunks

**Action Agent** (`src/lib/ai/agents/action.ts`)
- Tool-use loop (up to 5 iterations)
- Available tools: `check_calendar`, `book_appointment`, `generate_payment_link`, `update_contact`, `escalate`
- Can complete a full booking mid-conversation

**AI Deal Diagnosis** (`POST /api/ai/deal-diagnosis`)
- Analyzes stalled deal using contact data + conversation history
- Returns: diagnosis + 3 specific recommendations
- UI: Brain icon "Diagnose" button in contacts table → slide-over panel

**AI Meeting Prep** (`POST /api/ai/meeting-prep`)
- Generates meeting briefing for an upcoming booking
- Includes: contact history, key topics, suggested talking points

**User-configurable agent settings** (`/settings/ai`):
- Enable/disable each agent type
- Override system prompts
- Set model, max_tokens, temperature per agent

**Anthropic API key** can be set via UI (`/settings/integrations` → Anthropic card) and stored in `profiles.anthropic_api_key`. DB key overrides env var if present. Error message guides user to Settings if key missing.

### 6.3 Lead Management

#### Contacts (`/contacts`)
- Table view with pagination, search, filter by status/temperature/source
- **Lead Score pill**: colored progress bar (0–100) calculated by scoring engine
- **Win/Loss Modal**: intercepts save when status → 'won' or 'lost'; collects reason via quick-select chips + free-text; stores in `contacts.metadata.win_loss_reason`
- **AI Diagnose button**: triggers deal diagnosis for stalled contacts
- **Score recalculation**: `POST /api/contacts/[id]/score`

#### Lead Scoring Engine (`src/lib/scoring/lead-score.ts`)

| Signal | Points |
|--------|--------|
| Won (terminal) | 100 |
| Negotiation | 80 |
| Proposal | 60 |
| Qualified | 40 |
| Contacted | 20 |
| New | 5 |
| Lost (terminal) | 0 |
| Temperature: Hot | +30 |
| Temperature: Warm | +20 |
| Temperature: Cold | +5 |
| Source: HubSpot | +20 |
| Source: WhatsApp | +15 |
| Source: Instagram | +12 |
| Source: Facebook/SMS | +10 |
| Source: Web Chat | +8 |
| Source: Manual | +5 |
| Has email | +5 |
| Has phone | +5 |
| Has company | +3 |

Result: `min(100, max(0, sum))` — Won/Lost are always terminal at 100/0.

#### Contact Detail (`/contacts/[id]`)
- Full contact profile
- Conversation history
- Message timeline
- Activity log

#### Leads Kanban (`/leads`)
- Pipeline board organized by status stages
- Drag-to-update status

#### Pipeline View (`/pipelines`)
- Stage-based pipeline management

### 6.4 Booking System

#### Public Booking Page (`/book/[slug]`)
- No auth required
- Flow: select service → select date → select time slot → fill form → payment → confirmation
- Slug is unique per user, set in booking settings

#### Booking Management (`/bookings`)
- Calendar + table view
- Create/edit/cancel bookings
- Status: 'pending'|'confirmed'|'cancelled'|'completed'|'no_show'

#### Booking Settings (`/bookings/settings`)
- **Services**: CRUD with name, description, duration, price, color
- **Availability**: day-of-week schedules with start/end times
- **Blocked Dates**: specific date blocks (all-day or time-ranged)
- **Config**: slug, min notice hours, max advance days, slot duration, buffer between appointments
- **Payment**: require deposit, deposit amount, Stripe integration

#### Post-Meeting Automation
- When booking status → 'completed' via `PUT /api/bookings/[id]`:
  - Fires `booking.completed` outbound webhook event
  - Inserts notification for the team

#### Availability Slots API
- `GET /api/bookings/availability` — computes available slots factoring schedule + blocked dates + existing bookings + buffer time
- `GET /api/public/booking/[slug]/slots` — public version for booking page

### 6.5 Broadcast Campaigns (`/broadcasts`)

WhatsApp/SMS/Web Chat mass messaging with contact segmentation.

**Create flow:**
1. Name + message body
2. Select channel type
3. Apply segment filters (status chips, temperature chips, source channel chips)
4. Live debounced preview (recipient count updates as filters change)
5. WhatsApp template notice (compliance)
6. Confirm-send modal with final recipient count

**Segmentation:**
- `segment_status` (text[]) — multi-select pipeline stages
- `segment_temperature` — cold/warm/hot filter
- `segment_source_channel` — channel origin filter
- Empty filter = all contacts (for that field)
- Always excludes `opted_out = true` contacts (GDPR/CCPA)

**API:**
- `GET/POST /api/broadcasts` — list / create draft
- `POST /api/broadcasts/preview` — count recipients
- `POST /api/broadcasts/[id]/send` — send to all matching contacts

### 6.6 Analytics

#### Main Dashboard (`/analytics`)
- KPI cards: total contacts, active conversations, bookings this month, revenue
- Revenue Forecast section (see below)
- Daily bar chart
- Channel breakdown table
- "Team Analytics →" quick-link in header

#### Revenue Forecasting
`GET /api/analytics/forecast`

Stage probability weights:
| Stage | Probability |
|-------|-------------|
| New | 0% |
| Contacted | 15% |
| Qualified | 35% |
| Proposal | 60% |
| Negotiation | 80% |
| Won | 100% |

Formula: `Σ (count_in_stage × P(stage) × avg_deal_value)` across all stages.

#### Team / Agent Performance (`/analytics/team`)
`GET /api/analytics/team`
- KPI cards: total AI calls, average response time, handoff rate, resolution rate
- Daily AI calls bar chart
- Channel distribution table
- Sources: `ai_interaction_logs` + `conversations`

### 6.7 Cross-Channel Follow-Up Waterfall (`/settings/automation`)

**Stalled contact criteria:**
- `last_interaction_at >= N days` (default 3 days)
- Status NOT IN ('won', 'lost', 'new')

**Waterfall sequence:**
1. WhatsApp (primary)
2. SMS (secondary)
3. Email (fallback)
4. Manual Call (last resort)

**API:**
- `GET /api/automation/waterfall` — returns stalled contacts
- `POST /api/automation/waterfall/trigger` — sends follow-up + inserts notification + updates contact

**Settings page:** Waterfall sequence display, stalled threshold config, inline send form per contact.

### 6.8 Outbound Webhooks (`/settings/webhooks`)

**Events fired:**
- `contact.created` — on `POST /api/contacts`
- `booking.completed` — on `PUT /api/bookings/[id]` when status → 'completed'

**Delivery** (`src/lib/webhooks/deliver.ts`):
- HMAC-SHA256 signing: `X-LeadFlow-Signature: sha256=<hex>`
- `X-LeadFlow-Event: <event-type>` header
- 5 second timeout per request via AbortController
- Auto-disables endpoint after 5 consecutive failures
- Non-blocking: `void deliverWebhookEvent(...)` — errors never bubble to callers

**Settings page:**
- Event reference table
- Add endpoint form with event checkboxes
- Endpoints table (URL, events, status, failure count)
- One-time secret display on creation

### 6.9 Knowledge Base (`/knowledge`)

- Upload documents → chunked → embedded via Voyage AI (voyage-2, 1536d)
- Chunks stored with pgvector in `knowledge_chunks`
- Cosine similarity search via `match_knowledge_chunks()` PostgreSQL function
- Knowledge agent uses RAG to answer contact questions
- Multiple knowledge bases per user

### 6.10 API Keys (`/settings/api-keys`)

- Generate named API keys with scope selection
- SHA-256 hash stored in `api_keys.key_hash` — raw key never persisted
- First 8 chars stored as `key_prefix` for display
- Raw key shown **once** in creation modal; user must copy immediately
- Revoke any key at any time

### 6.11 Team Management (`/settings/team`)

- Invite team members by email
- Roles: 'admin' (full access) | 'member' (view/insert/update) | 'viewer' (read-only)
- Invitations expire in 7 days
- Accept via token link (`POST /api/team/invitations/accept`)
- All team member queries route through `get_owner_id()` to access owner's data

### 6.12 Agency / White-Label Mode (`/settings/agency`)

- Create sub-accounts with: business name, contact, branding color, plan, monthly fee
- Sub-account statuses: active | suspended | cancelled
- Stats row shows total sub-accounts, active count, total MRR
- Edit/delete modals per sub-account
- Enables resellers to offer platform under their own brand

### 6.13 Chat Widget

**Embed** (`/settings/widget`):
- Configure colors, greeting message
- Copy-paste embed code (iframe or JS snippet)
- Widget served at `/chat-widget/[businessId]`

**Public API (rate limited):**
- `POST /api/chat/init` — 10 inits per IP per minute
- `POST /api/chat/message` — 30 messages per sessionId per minute
- Backend: Upstash Redis sliding window; graceful allow-all if env vars absent

**Widget config:**
- `GET /api/widget/[businessId]` — returns colors, greeting (no auth)

### 6.14 Integrations (`/settings/integrations`)

All credentials stored in `profiles` table (encrypted):

| Integration | Purpose |
|-------------|---------|
| **Anthropic** | Claude AI for all agent reasoning |
| **Twilio** | WhatsApp, SMS, Voice |
| **Meta** | Instagram DMs, Messenger |
| **Vapi** | Outbound voice AI calls |
| **HubSpot** | Contact/deal CRM sync |
| **Stripe** | Booking payments, subscriptions |
| **SendGrid** | Transactional email |
| **Google Calendar** | Calendar sync (token stored as jsonb) |
| **Outlook** | Calendar sync (token stored as jsonb) |

Connect/disconnect each via modal on integrations page.

---

## 7. API Reference

### 7.1 Authentication Pattern

Every protected API route:
```typescript
const ctx = await getAPIContext();
if (!ctx) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// All queries use ctx.ownerId, not ctx.user.id
```

Public routes (booking, chat widget): no auth; rate limited as needed.

Admin routes: additionally check `ctx.isSuperAdmin`.

### 7.2 Contacts

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/contacts` | List with pagination, filters (status/temperature/source/search) |
| POST | `/api/contacts` | Create; fires `contact.created` webhook |
| GET | `/api/contacts/[id]` | Fetch single |
| PUT | `/api/contacts/[id]` | Update (status change triggers win/loss flow) |
| DELETE | `/api/contacts/[id]` | Delete |
| POST | `/api/contacts/[id]/score` | Recalculate lead score |

### 7.3 AI

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/ai/deal-diagnosis` | Claude analyzes stalled deal + 3 recommendations |
| POST | `/api/ai/meeting-prep` | Claude generates meeting briefing |
| POST | `/api/ai/generate-suggestion` | Context-aware AI reply suggestion |
| POST | `/api/ai/process-message` | Internal: run message through orchestrator |

### 7.4 Chat Widget (Public)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/chat/init` | None (10/IP/min) | Create session |
| POST | `/api/chat/message` | None (30/session/min) | Message → AI → response |
| GET | `/api/widget/[businessId]` | None | Widget config |

### 7.5 Conversations & Messages

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/conversations` | List / create |
| GET/PUT | `/api/conversations/[id]` | Fetch / update |
| GET | `/api/conversations/[id]/messages` | Paginated messages |
| POST | `/api/conversations/[id]/messages` | Human reply |

### 7.6 Bookings

| Method | Route | Description |
|--------|-------|-------------|
| GET/PUT | `/api/bookings/settings` | Booking page config |
| GET/POST | `/api/bookings/services` | CRUD services |
| PUT/DELETE | `/api/bookings/services/[id]` | Update/delete service |
| GET | `/api/bookings/availability` | Compute available slots |
| GET/POST | `/api/bookings/blocked-dates` | Manage blocked dates |
| GET/PUT/DELETE | `/api/bookings/blocked-dates/[id]` | Single blocked date |
| GET | `/api/bookings` | List bookings |
| GET/PUT/DELETE | `/api/bookings/[id]` | Single booking; PUT fires `booking.completed` webhook on completion |
| GET | `/api/public/booking/[slug]` | Public booking page info |
| POST | `/api/public/booking/[slug]/book` | Submit public booking |
| GET | `/api/public/booking/[slug]/slots` | Available time slots |

### 7.7 Broadcasts

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/broadcasts` | List / create draft |
| POST | `/api/broadcasts/preview` | Count recipients for segment |
| POST | `/api/broadcasts/[id]/send` | Send to all matching contacts |

### 7.8 Analytics

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/analytics` | Dashboard KPIs |
| GET | `/api/analytics/forecast` | Stage × probability × avg deal value |
| GET | `/api/analytics/team` | Agent performance + daily chart |

### 7.9 Automation

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/automation/waterfall` | Stalled contacts list |
| POST | `/api/automation/waterfall/trigger` | Send follow-up + notification |

### 7.10 Knowledge Base

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/knowledge-bases` | List / create |
| PUT/DELETE | `/api/knowledge-bases/[id]` | Update / delete |
| POST | `/api/knowledge-bases/[id]/documents` | Upload + chunk + embed |
| GET/DELETE | `/api/knowledge-bases/[id]/documents/[docId]` | Get / delete document |

### 7.11 Settings

| Method | Route | Description |
|--------|-------|-------------|
| GET/PUT | `/api/settings/profile` | Business profile |
| GET/PUT | `/api/settings/integrations` | Integration keys |
| GET/POST | `/api/settings/api-keys` | List / generate API key |
| DELETE | `/api/settings/api-keys/[id]` | Revoke key |
| GET/POST | `/api/settings/webhooks` | List / create webhook endpoint |
| PATCH/DELETE | `/api/settings/webhooks/[id]` | Update / delete endpoint |

### 7.12 Team & Agency

| Method | Route | Description |
|--------|-------|-------------|
| GET/POST | `/api/team` | List / invite |
| PUT/DELETE | `/api/team/[id]` | Update role / remove |
| POST | `/api/team/invitations/accept` | Accept invite via token |
| GET/POST | `/api/agency/sub-accounts` | List / create sub-account |
| PATCH/DELETE | `/api/agency/sub-accounts/[id]` | Update / delete |

### 7.13 Admin (super_admin only)

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/admin/health` | Anthropic + Supabase + Redis health |
| GET | `/api/admin/health/errors` | Recent errors from audit_logs |
| GET/POST | `/api/admin/audit-logs` | View / export CSV |
| GET/POST | `/api/admin/feature-flags` | Feature flag management |
| PUT/DELETE | `/api/admin/feature-flags/[id]` | Update / delete flag |
| POST | `/api/admin/feature-flags/[id]/overrides` | Per-user override |
| GET/POST | `/api/admin/users` | List users |
| GET/PUT/DELETE | `/api/admin/users/[id]` | User management |
| POST | `/api/admin/users/[id]/notes` | Add admin note |
| POST | `/api/admin/users/[id]/tags` | Tag account |
| POST | `/api/admin/impersonate` | Impersonate user (creates audit entry) |
| GET | `/api/admin/stats` | Platform MRR, churn, signups |
| GET/POST | `/api/admin/accounts` | Account management |
| GET/PUT | `/api/admin/accounts/[id]` | Account detail |
| POST | `/api/admin/communications/announcement` | Platform-wide announcement |
| POST | `/api/admin/communications/email` | Direct email to user |
| POST | `/api/admin/data/export` | Export user data |
| POST | `/api/admin/data/delete` | Delete user data |
| POST | `/api/admin/data/bulk` | Bulk operations |
| GET | `/api/admin/analytics` | Admin-level platform analytics |

---

## 8. Frontend Pages

### 8.1 Marketing Site (Public)

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/pricing` | Tier comparison + CTA |
| `/features` | Feature showcase |
| `/solutions` | Solutions index |
| `/solutions/driving-instructors` | Vertical landing page |
| `/solutions/marriage-celebrants` | Vertical landing page |
| `/integrations` | Integration showcase |
| `/api-docs` | Public API documentation |
| `/docs` | Getting started docs |
| `/docs/getting-started` | Step-by-step setup guide |
| `/blog` | Blog listing |
| `/blog/[slug]` | Blog post |
| `/case-studies` | Customer stories |
| `/about` | Company page |
| `/careers` | Jobs page |
| `/compare` | Competitor comparison |
| `/status` | Platform status |
| `/contact` | Contact form |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |
| `/cookies` | Cookie policy |
| `/security` | Security overview |
| `/changelog` | Feature changelog |

### 8.2 Auth Pages

| Route | Description |
|-------|-------------|
| `/login` | Email/password login |
| `/register` | Account creation |
| `/forgot-password` | Password reset |

### 8.3 Dashboard Pages (Protected)

| Route | Description |
|-------|-------------|
| `/dashboard` | Overview KPIs, recent activity, today's bookings |
| `/contacts` | Contact table with lead scores, AI diagnose, win/loss modal |
| `/contacts/[id]` | Full contact detail: history, messages, timeline |
| `/leads` | Kanban board by pipeline status |
| `/pipelines` | Pipeline management view |
| `/conversations` | Real-time thread viewer with quick reply and handoff |
| `/conversations/[id]` | Single conversation thread |
| `/customers` | Customers list |
| `/broadcasts` | Campaign list; create with segment chips; live preview; confirm-send modal |
| `/bookings` | Calendar + table; create/edit/cancel |
| `/bookings/settings` | Services, availability, blocked dates, slug, payment |
| `/analytics` | KPI cards, Revenue Forecast, daily bar chart, channel breakdown |
| `/analytics/team` | Agent performance KPIs, daily AI chart, channel distribution |
| `/channels` | Configured channel instances |
| `/knowledge` | Knowledge base management |
| `/knowledge/[id]` | Knowledge base detail + documents |
| `/system-flow` | System architecture diagram |
| `/app-pages` | App page reference map |

### 8.4 Settings Pages

| Route | Description |
|-------|-------------|
| `/settings` | Settings index (card grid) |
| `/settings/profile` | Business name, type, timezone, website |
| `/settings/integrations` | Anthropic, Twilio, Meta, HubSpot, Stripe, Vapi |
| `/settings/api-keys` | Generate/revoke API keys; one-time secret |
| `/settings/webhooks` | Webhook endpoints; event reference; HMAC secret |
| `/settings/automation` | Waterfall follow-up rules; stalled contacts; inline send |
| `/settings/team` | Invite, manage roles, remove |
| `/settings/agency` | Sub-account management; branding; monthly fee |
| `/settings/ai` | Agent enable/disable, system prompts, model config |
| `/settings/widget` | Chat widget styling + embed code |
| `/settings/billing` | Plan, usage meters, Stripe payment method |
| `/settings/compliance` | GDPR export, data deletion |

### 8.5 Admin Pages (super_admin only)

| Route | Description |
|-------|-------------|
| `/admin` | Admin dashboard |
| `/admin/accounts` | Account list management |
| `/admin/accounts/[id]` | Account detail |
| `/admin/users/[id]` | User detail + notes + tags |
| `/admin/analytics` | Platform-level analytics |
| `/admin/audit-logs` | Audit log viewer + CSV export |
| `/admin/feature-flags` | Feature flag management |
| `/admin/communications` | Announcements + direct emails |
| `/admin/data` | Data management tools |
| `/admin/health` | System health: Anthropic, Supabase, Redis |
| `/admin/support` | Support tools |

### 8.6 Public Pages

| Route | Description |
|-------|-------------|
| `/book/[slug]` | Public booking page |
| `/book/preview` | Booking preview |
| `/chat-widget/[businessId]` | Embeddable chat widget |

---

## 9. Component Library

### 9.1 UI Primitives (`src/components/ui/`)

`Button` · `Input` · `Textarea` · `Select` · `Modal` · `Card` · `Tabs` · `Badge` · `Avatar` · `Dropdown` · `DataTable` · `Pagination` · `SearchInput` · `FileUpload` · `Toggle` · `Skeleton` · `EmptyState` · `Toast`

All exported via `src/components/ui/index.ts` barrel.

### 9.2 Layout Components (`src/components/layout/`)

| Component | Description |
|-----------|-------------|
| `sidebar.tsx` | Dashboard nav (all routes, collapsed state, active highlighting) |
| `header.tsx` | Top bar: notifications bell, user menu |
| `mobile-nav.tsx` | Mobile navigation |
| `mobile-more-menu.tsx` | Mobile expanded menu |
| `dashboard-shell.tsx` | Sidebar + header + main content wrapper |
| `notification-panel.tsx` | Bell icon notification dropdown |

**Sidebar nav items (in order):**
Dashboard → Contacts → Leads → Pipelines → Conversations → Customers → Broadcasts → Bookings → Knowledge → Channels → Analytics → Settings

### 9.3 Dashboard Components

- `kpi-cards.tsx` — KPI metric cards
- `dashboard-charts.tsx` — Recharts visualizations
- `activity-feed.tsx` — Activity timeline feed

### 9.4 Conversation Components

- `conversations-list.tsx` — List with unread counts + status
- `conversation-thread.tsx` — Message bubbles (inbound/outbound/AI/human differentiated)

### 9.5 Admin Components

- `user-notes.tsx` — Admin notes per user
- `activity-timeline.tsx` — User activity timeline
- `account-tags.tsx` — Tag display + editing
- `impersonation-banner.tsx` — Persistent banner when impersonating

### 9.6 Settings Components

- `profile-form.tsx` — Business profile edit form
- `copy-embed-code.tsx` — Embed code with copy button
- `integration-card.tsx` — Connect/disconnect card per integration

### 9.7 Marketing Components

- `header.tsx` — Marketing site navigation
- `footer.tsx` — Marketing site footer
- `contact-form.tsx` — Contact page form
- `newsletter-form.tsx` — Newsletter signup

### 9.8 Chat Widget

- `chat-widget.tsx` — Full embeddable chat UI (iframe target)

---

## 10. State Management

### 10.1 Zustand Stores (`src/stores/`)

| Store | Contents |
|-------|---------|
| `ui-store.ts` | Sidebar collapsed, modal open states |
| `conversation-store.ts` | Active conversation, messages, typing indicator |
| `notification-store.ts` | Notification list, unread count |

### 10.2 Custom Hooks (`src/hooks/`)

| Hook | Purpose |
|------|---------|
| `use-user.ts` | Current authenticated user |
| `use-debounce.ts` | Debounced value (used in broadcast preview) |
| `use-realtime.ts` | Generic Supabase realtime subscription |
| `use-realtime-messages.ts` | Live message updates per conversation |
| `use-realtime-notifications.ts` | Live notification push |

---

## 11. Security

### 11.1 Row-Level Security (RLS)

All 30+ tables have RLS enabled. Patterns:
- **Owner**: `user_id = auth.uid()`
- **Team member**: subquery via `team_members` table
- **Super-admin**: `EXISTS (SELECT 1 FROM profiles WHERE role='super_admin' AND user_id=auth.uid())`
- **Public tables**: `services`, `availability_schedules`, `blocked_dates`, `booking_settings` — public SELECT for booking page

### 11.2 API Key Security

- SHA-256 hash stored (`key_hash`) — plaintext never persisted
- First 8 chars as `key_prefix` for UI display
- Raw key shown once at creation; not retrievable after

### 11.3 Webhook Signing

```
X-LeadFlow-Signature: sha256=<hmac-hex>
X-LeadFlow-Event: contact.created
```

### 11.4 Rate Limiting

- `POST /api/chat/init` — 10 per IP per minute (sliding window)
- `POST /api/chat/message` — 30 per sessionId per minute
- Backend: Upstash Redis; graceful allow-all if `UPSTASH_REDIS_REST_URL/TOKEN` not configured

### 11.5 Audit Logging

All admin actions logged to `audit_logs`: actor, action, target, IP, user agent, timestamp.
Searchable via `/admin/audit-logs`; exportable as CSV.

### 11.6 Impersonation

Super-admin can impersonate any user. Every impersonation creates an audit log entry.
`impersonation-banner.tsx` displays persistently while impersonating.

---

## 12. Environment Variables

### Required (all environments)

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
```

### AI

```bash
ANTHROPIC_API_KEY          # or set per-account via Settings → Integrations
VOYAGE_API_KEY             # knowledge base embeddings (degrades silently without it)
```

### Channels

```bash
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
META_VERIFY_TOKEN
META_APP_SECRET
VAPI_WEBHOOK_SECRET
```

### Payments & Email

```bash
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
RESEND_API_KEY
```

### Rate Limiting

```bash
UPSTASH_REDIS_REST_URL
UPSTASH_REDIS_REST_TOKEN
```

### App

```bash
NEXT_PUBLIC_APP_URL        # production domain (NOT localhost in prod)
SKIP_AUTH                  # dev only — REMOVE before production deploy
```

---

## 13. Development

### 13.1 Commands

```bash
npm run dev              # Start dev server (Turbopack) — runs on port 3004
npm run build            # Production build
npm run lint             # ESLint
npm run type-check       # tsc --noEmit
npx supabase db push     # Push migrations to Supabase
npx supabase gen types typescript --local > src/types/supabase.ts
```

### 13.2 Code Conventions

- Server Components by default; `"use client"` only when hooks/events required
- Absolute imports via `@/` prefix (maps to `src/`)
- Named exports preferred over default exports
- One component per file; file named same as component
- Props interfaces: `{ComponentName}Props`
- API route pattern: `getAPIContext()` → validate input (Zod) → DB query with `ctx.ownerId` → return `{ data }` or `{ error }`
- Non-blocking side effects: `void deliverWebhookEvent(...)`

### 13.3 File Organization

```
src/
  app/             # Next.js App Router pages and API routes
  components/      # React components (ui, layout, dashboard, etc.)
  lib/             # Core business logic (ai, channels, scoring, webhooks, etc.)
  hooks/           # Custom React hooks
  stores/          # Zustand state stores
  types/           # TypeScript type definitions
  constants/       # App-wide constants
  styles/          # Global styles
supabase/
  migrations/      # SQL migration files
  seed.sql         # Seed data
```

---

## 14. Known Limitations & Pending Work

- Migrations not yet pushed to remote Supabase (`npx supabase db push` needed before prod)
- `SKIP_AUTH=true` in `.env.local` — must remove before production deploy
- `NEXT_PUBLIC_APP_URL` still points to `localhost:3000` — update to prod domain before deploy
- Rate limiting inactive until `UPSTASH_REDIS_REST_URL/TOKEN` configured in Vercel
- Voyage AI embeddings degrade silently to zero vectors without `VOYAGE_API_KEY`
- Voice (Vapi) integration partially implemented — call transcription only, full IVR flow pending
- HubSpot sync is one-way (inbound webhook); outbound push to HubSpot not yet implemented
- Google Calendar and Outlook Calendar tokens stored but sync logic not fully wired

---

## 15. Changelog

| Date | Change |
|------|--------|
| 2026-04-16 | Win/Loss Reason Capture — modal on status→won/lost, chips + free-text, stored in metadata |
| 2026-04-16 | Predictive Lead Score — signal-based 0–100 engine, API, colored progress bar in contacts table |
| 2026-04-16 | AI Deal Diagnosis — Claude analyzes stalled deals, Brain icon button, slide-over panel |
| 2026-04-16 | Agent Performance Dashboard — `/analytics/team` with KPI cards, bar chart, channel table |
| 2026-04-16 | Cross-Channel Follow-Up Waterfall — stalled contacts API, trigger API, `/settings/automation` page |
| 2026-04-16 | Revenue Forecasting — stage probability weights, forecast API, Forecast section in analytics |
| 2026-04-16 | Open API Keys — SHA-256 hashed, create/revoke UI, one-time secret display |
| 2026-04-16 | Post-Meeting Automation — booking.completed fires webhook + notification |
| 2026-04-17 | WhatsApp Broadcast Campaigns — segment chips, live preview, confirm-send modal |
| 2026-04-17 | Outbound Webhook Delivery — HMAC-SHA256, 5s timeout, auto-disable at 5 failures |
| 2026-04-17 | Agency / White-Label Mode — sub-accounts with branding color, plan, monthly fee |
| 2026-04-18 | Security hardening — SHA-256 API key hashing, chat rate limiting via Upstash |
| 2026-04-18 | Anthropic key via UI — profiles.anthropic_api_key, DB key overrides env var |
| 2026-04-18 | Visualization suite — `/analytics/funnel` conversion funnel, contact journey timeline, channel flow Sankey, live activity stream on dashboard |
| 2026-04-19 | Dashboard UX — onboarding checklist (7 items, auto-hides after first contact), "AI handled N conversations" stats badge, global error boundary, changelog popup on login |
| 2026-04-19 | AI quality — confidence threshold gate + approval queue at `/approvals`, per-contact memory (last N convos injected), multilingual auto-detect, conversation quality rubric API |
| 2026-04-19 | Growth / revenue — annual billing toggle on `/pricing` (20% off), referral program (codes, credits, `/referrals` page, register accepts `?ref=`), "Powered by" branding toggle on booking page, training data opt-out |
| 2026-04-19 | Integrations — Slack webhooks (hot leads + bookings, test button at `/settings/slack`), weekly digest email (`/digest` preview + send via Resend), stale hot-lead alert banner, Zapier docs on `/api-docs` |
| 2026-04-19 | Migrations — `20260419_ai_quality.sql` (ai_approvals table + profile config), `20260419_referrals.sql` (referral codes + hide_branding), `20260419_slack_digest.sql` (slack config + stale threshold) — NOT yet pushed to remote |
