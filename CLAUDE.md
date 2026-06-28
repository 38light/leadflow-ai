# Lead to Customer - SaaS Platform

> **📍 GET CONTEXT FAST:** When asked to "get context on this project," READ
> [`PROJECT-CONTEXT.md`](PROJECT-CONTEXT.md) — a full pre-built map of architecture, data model,
> conventions, integrations, and known risks. Do NOT re-scan the whole codebase; that file IS
> the context dump. Only re-sweep the source if explicitly asked to "regenerate PROJECT-CONTEXT.md"
> or if the file is clearly stale vs. the code.

## Project Overview
A SaaS platform for managing and converting leads into customers. Built with Next.js App Router, Supabase, TypeScript, and Tailwind CSS.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS v4
- **State Management**: React Server Components + Zustand (client state)
- **Payments**: Stripe
- **Email**: Resend
- **Deployment**: Vercel

## Project Structure
```
src/
  app/             # Next.js App Router pages and API routes
    (auth)/        # Auth pages (login, register, forgot-password)
    (dashboard)/   # Authenticated dashboard pages
    (marketing)/   # Public marketing pages
    api/           # API route handlers
  components/      # React components
    ui/            # Primitive UI components (Button, Input, Modal, etc.)
    layout/        # Layout components (Sidebar, Header, Footer)
    forms/         # Form components
    shared/        # Shared/composite components
  lib/             # Shared libraries and utilities
    supabase/      # Supabase client and server helpers
    auth/          # Auth helpers and middleware
    stripe/        # Stripe integration
    email/         # Email templates and sending
    utils/         # General utility functions
    validators/    # Zod schemas for validation
  hooks/           # Custom React hooks
  types/           # TypeScript type definitions
  constants/       # App-wide constants and config
  styles/          # Global styles
supabase/
  migrations/      # Database migrations (SQL)
  seed.sql         # Seed data
public/            # Static assets
```

## Commands
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript compiler check
- `npx supabase db push` - Push migrations to Supabase
- `npx supabase gen types typescript --local > src/types/supabase.ts` - Generate DB types

## Conventions

### Code Style
- Use `function` declarations for components, arrow functions for utilities
- Prefer named exports over default exports
- Use absolute imports via `@/` prefix (maps to `src/`)
- Colocate test files next to source files with `.test.ts` suffix

### Components
- Server Components by default; only add `"use client"` when needed
- Props interfaces named `{ComponentName}Props`
- One component per file, file named same as component

### API Routes
- Always authenticate with `getUser()` before any DB operation
- Always filter DB queries by `user_id` (prevent IDOR)
- Validate all inputs with Zod schemas from `lib/validators/`
- Return consistent JSON: `{ data }` on success, `{ error }` on failure

### Database
- All tables must have RLS enabled
- All tables must have `user_id` column with FK to `auth.users`
- All tables must have `created_at` and `updated_at` timestamps
- Migration files named: `YYYYMMDD_description.sql`

### Error Handling
- Use custom `AppError` class for application errors
- Log errors server-side, return safe messages client-side
- Never expose stack traces or internal details to the client

## What's Been Done

- [2026-04-16] Feature 1: Win/Loss Reason Capture — modal intercepts save when status → won/lost, quick-select chips + free-text, stores in `metadata.win_loss_reason` via PUT
- [2026-04-16] Feature 2: Predictive Lead Score — `src/lib/scoring/lead-score.ts` (signal-based 0–100 scorer), `POST /api/contacts/[id]/score` API, colored progress bar pill in contacts table
- [2026-04-16] Feature 3: AI Deal Diagnosis — `POST /api/ai/deal-diagnosis` calls Claude with contact + conversation context, Brain icon Diagnose button in contacts table, slide-over result panel
- [2026-04-16] Feature: Agent Performance Dashboard — `GET /api/analytics/team` (ai_interaction_logs + conversations stats), page at `/analytics/team` with KPI cards, daily bar chart, channel breakdown table
- [2026-04-16] Feature: Cross-Channel Follow-Up Waterfall — `GET /api/automation/waterfall` (stalled contacts by last_interaction_at), `POST /api/automation/waterfall/trigger` (inserts notification + updates contact), settings page at `/settings/automation` with waterfall sequence display and inline send form
- [2026-04-16] Feature 1: Revenue Forecasting — `GET /api/analytics/forecast` (stage probability weights × avg deal value), Revenue Forecast section added to `/analytics` page with KPI cards and pipeline bar breakdown
- [2026-04-16] Feature 2: Open API Keys — migration `20260417_api_keys.sql`, `GET/POST /api/settings/api-keys`, `DELETE /api/settings/api-keys/[id]`, page at `/settings/api-keys` with create form, one-time key modal, and revoke confirmation
- [2026-04-16] Feature 3: Post-Meeting Automation — `PUT /api/bookings/[id]` fires notification insert when status→completed; uses existing notifications table columns (read not is_read, no metadata column)
- [2026-04-17] Feature: WhatsApp Broadcast Campaigns — migration `20260417_broadcasts.sql`, validator `src/lib/validators/broadcasts.ts`, `GET/POST /api/broadcasts`, `POST /api/broadcasts/[id]/send`, `POST /api/broadcasts/preview`, dashboard page at `/broadcasts` with create form, segment chip filters (status/temperature/source), live debounced preview, WhatsApp template notice, confirm-send modal
- [2026-04-17] Feature: Outbound Webhook Delivery — migration `20260417_webhook_endpoints.sql`, `src/lib/webhooks/deliver.ts` (HMAC-SHA256 signing, 5s timeout, failure tracking + auto-disable at 5 failures), `GET/POST /api/settings/webhooks`, `PATCH/DELETE /api/settings/webhooks/[id]`, settings page at `/settings/webhooks` (event reference, add form with checkboxes, endpoints table, one-time secret modal); wired into `POST /api/contacts` (contact.created) and `PUT /api/bookings/[id]` (booking.completed)
- [2026-04-17] Feature: Agency / White-Label Mode — migration `20260417_sub_accounts.sql`, `GET/POST /api/agency/sub-accounts`, `PATCH/DELETE /api/agency/sub-accounts/[id]`, settings page at `/settings/agency` (info box, stats row, sub-accounts table with brand color dot, add/edit/delete modals); both settings links added to `/settings` index
- [2026-04-16] Navigation: Added Broadcasts to sidebar nav (Megaphone icon, between Channels and Analytics); added Chat Widget + Automation links to `/settings` index page; added "Team Analytics →" quick-link in analytics page header
- [2026-04-18] Security hardening: SHA-256 hash API keys before DB persist (was plaintext); rate limit `/api/chat/init` (10/IP/min) and `/api/chat/message` (30/session/min) via `@upstash/ratelimit` with graceful fallback when env vars absent; fixed health check route to reference ANTHROPIC_API_KEY not OPENAI_API_KEY (both API route and admin health page)
- [2026-04-18] Anthropic key via UI: migration `20260418_anthropic_key.sql` adds `profiles.anthropic_api_key`; added Anthropic card to Settings → Integrations; `claude-client.ts` now accepts optional `apiKey` param (DB key overrides env var); error message guides user to Settings if key missing
- [2026-04-18] Feature: Live Activity Stream on dashboard — `GET /api/dashboard/activity?limit=20` merges contacts/inbound messages/bookings/AI handoffs from last-N; rewrote `ActivityFeed` as realtime client component that subscribes via Supabase realtime to INSERT on contacts/messages/bookings (filtered by `user_id=eq.<ownerId>`), dedupes by id, caps at 20, animates new events with double-rAF opacity+translate; dashboard page switched from `getUser()` to `getAuthContext()` so KPI counts and feed both use `ctx.ownerId`
- [2026-04-18] Feature: Conversion Funnel page — `GET /api/analytics/funnel` (Zod-validated `days`+`source_channel`); page at `/analytics/funnel` with horizontal stepped bars per stage (new→contacted→qualified→proposal→negotiation→won), drop-off % from previous stage in red, overall conversion rate + total lost KPIs, click stage → `/contacts?status=<stage>`
- [2026-04-18] Feature: Contact Journey Timeline — `GET /api/contacts/[id]/journey` merges contact_created/status changes/messages (in/out/AI/human)/bookings (created+completed)/AI handoffs + ai_interaction_logs; `src/components/contacts/journey-timeline.tsx` renders vertical timeline with lucide icons in colored circles, relative timestamps, filter chips per event type, load-more pagination; embedded below Extracted Data on `/contacts/[id]`
- [2026-04-18] Feature: Channel Flow Sankey — `GET /api/analytics/channel-flow` groups contacts by (source_channel, status); `src/components/analytics/channel-flow-sankey.tsx` renders Recharts Sankey with channel colors (whatsapp #25D366 / sms #3B82F6 / instagram #E4405F / voice #8B5CF6 / web_chat #10B981 etc) and status colors (new gray → won green, lost red); inserted on `/analytics` above existing Funnel card; also added "Funnel →" header link next to "Team Analytics →"
- [2026-04-18] Feature: Onboarding Checklist on dashboard — `GET /api/dashboard/onboarding` derives 7 items from real DB state (profiles.business_name, channels.is_active OR integration keys, knowledge_documents, services, availability_schedules, team_members/invitations, contacts); `src/components/dashboard/onboarding-checklist.tsx` renders progress bar + N/7 + per-row check/circle/strike-through with arrow link; auto-hides when user has any contact, dismissible via localStorage key `onboarding_checklist_dismissed`; `allDone` shows celebration card
- [2026-04-18] Feature: AI Handled Stats badge on dashboard — `src/components/dashboard/ai-handled-stats.tsx` server component queries `ai_interaction_logs` count for last 7 days (+ tools_called breakdown); empty state links to `/settings/ai`, populated state links to `/analytics/team`
- [2026-04-18] Feature: Global Error Boundary — `src/app/error.tsx` Next.js error handler ("use client") with AlertTriangle icon, error.digest display, "Try again" (calls reset) + "Go to dashboard" buttons
- [2026-04-18] Feature: Changelog popup on login — `src/constants/changelog.ts` (versioned entries, newest first); `src/components/layout/changelog-popup.tsx` checks localStorage `changelog_seen_version`, shows Modal with feature links until dismissed; rendered in `dashboard-shell.tsx`; current version `v0.4` lists Funnel/Journey/Sankey/Activity Stream
- [2026-04-19] Feature: AI Quality bundle — migration `20260419_ai_quality.sql` adds `profiles.ai_confidence_threshold/require_approval/ai_memory_depth/training_data_opt_out/default_language`, `conversations.metadata jsonb`, and `ai_approvals` table (RLS, pending/approved/rejected). Orchestrator now (1) loads profile gates and queues drafts to `ai_approvals` with `shouldSend=false` when confidence < threshold or `require_approval=true`, (2) builds a "prior context" block from up to N most recent prior conversations of the contact and injects it into the concierge system prompt, (3) concierge tool now returns `language` (ISO) + `confidence` and instructs the AI to reply in the contact's language. New routes: `GET /api/ai/approvals`, `POST /api/ai/approvals/[id]` (approve sends message + marks approved; reject just marks), `POST /api/ai/score-conversation` (Claude rubric → `conversations.metadata.quality_rubric`). New pages: `/approvals` (queue UI with edit textarea + Approve/Reject), `/settings/ai-quality` (slider + toggles + memory depth + language). Score conversation button added to `/conversations/[id]` header.
- [2026-04-19] Feature: Slack Notifications — migration `20260419_slack_digest.sql` adds `profiles.slack_webhook_url`, `slack_notify_hot_leads`, `slack_notify_bookings`, `stale_lead_hours`; `src/lib/integrations/slack.ts` (`sendSlackNotification` with 5s AbortController timeout, never throws); `GET/PUT /api/settings/slack` (Zod, optional `test:true` ping); page at `/settings/slack` with webhook input + 2 toggles + Send Test button; wired into `POST /api/contacts` (hot leads only, non-blocking) and `POST/PUT /api/bookings/[id]` (created/confirmed/completed)
- [2026-04-19] Feature: Weekly Digest Email — `src/lib/email/weekly-digest.ts` `buildDigest(ownerId)` queries last 7d contacts/bookings/ai_interaction_logs and returns `{subject, html, text, stats}`; `GET /api/digest/preview` + `POST /api/digest/send` (Resend, requires user.email + RESEND_API_KEY); page at `/digest` with stat cards, top-channel + avg-latency rows, sandboxed iframe HTML preview, "Send to my email" button
- [2026-04-19] Feature: Stale Hot Leads Alert — `GET /api/alerts/stale-hot-leads` returns hot contacts with `last_interaction_at < now() - profile.stale_lead_hours` (default 2h), excludes won/lost; bonus Slack ping if integration enabled; `src/components/dashboard/stale-leads-alert.tsx` client component renders red banner linking to `/contacts?filter=stale_hot` (auto-hides at count=0). Parent must add `<StaleLeadsAlert />` to `/dashboard/page.tsx`
- [2026-04-19] Feature: Zapier docs section — added "Connect via Zapier" section to `/api-docs` page between Webhooks and SDKs; covers triggers (webhook endpoints), actions (API keys), event table (`contact.created`, `booking.completed`), example Zaps; sidebar nav updated
- [2026-04-19] Feature: Pricing Annual Toggle — `/pricing` is now a client component with Monthly/Yearly pill toggle; yearly shows 20% off (Starter $49→$39, Pro $149→$119) plus "$X billed yearly" + "Save $Y/year" labels; `getPriceDisplay()` derives both from a single `monthlyPriceCents` source
- [2026-04-19] Feature: Referral Program — migration `20260419_referrals.sql` adds `profiles.referral_code` (UNIQUE, auto-generated via `generate_referral_code()` + `assign_referral_code()` trigger, backfilled), `profiles.referred_by_code`, and `referral_credits` table (RLS: SELECT own only). `GET /api/referrals` returns code + share link + total credits + referred users; `GET /api/referrals/lookup?code=` (public, validates ref code on register page); `POST /api/referrals/apply` (idempotent, used by register page). `/referrals` dashboard page with code/link copy buttons, 3 stat cards, referred-users table. `/register` rewritten as functional Supabase signup form with `?ref=` query param support — looks up & shows "Invited by: X" banner, calls apply endpoint after signup
- [2026-04-19] Feature: "Powered by LeadFlow" Branding Toggle — adds `profiles.hide_branding` (in `20260419_referrals.sql`, paid plans only). `/book/[slug]` footer now hides branding when `settings.hide_branding=true`; otherwise shows linked footer pointing to leadflow.ai. `GET /api/public/booking/[slug]` joins `profiles.hide_branding`+`subscription_tier` (free tier always sees branding, server-side gate). `GET/PUT /api/bookings/settings` reads/writes `hide_branding` on profiles (split off from booking_settings). Booking Settings page Settings tab adds Branding section with toggle + tooltip + amber upgrade pill when on free tier
- [2026-04-19] Feature: Training Data Privacy Toggle — `profiles.training_data_opt_out` defensively re-added in `20260419_referrals.sql` with `IF NOT EXISTS` (canonical column lives in `20260419_ai_quality.sql`); `claude-client.ts` accepts `trainingDataOptOut` flag → forwards as `metadata.training_opt_out` (TODO header link to docs.anthropic.com pending official mechanism); `/settings/compliance` rewritten with shield header + first-class opt-out toggle (uses existing `PUT /api/settings/ai-quality`)
- [2026-04-19] Feature: Settings → Integrations multi-key UI — migration `20260420_sendgrid_stripe_keys.sql` adds `profiles.sendgrid_api_key` + `profiles.stripe_secret_key`; `/settings/integrations` rewritten as client component with `IntegrationCard` + configure modal for Anthropic/VAPI/Twilio/SendGrid/Stripe/Meta/WhatsApp; `GET/PUT /api/settings/integrations` return full connected map (`hubspot/twilio/meta/whatsapp/vapi/anthropic/sendgrid/stripe`); validator accepts `sendgrid_api_key`, `stripe_secret_key`, `anthropic_api_key`; page fetches status on mount to init card state; `src/types/supabase.ts` ProfileRow backfilled with anthropic/sendgrid/stripe + referral/hide_branding columns
- [2026-06-04] Local dev backend stood up. Cloud Supabase `cujeuerrfermubhonfyf` is **dead (NXDOMAIN)** — dashboard/all DB pages hung ~15s then rendered empty against it. Switched dev to a **local Supabase stack** (`supabase start`, Docker). Ports remapped +100 in `supabase/config.toml` to coexist with another local stack ("Thumb_designer_V2"): API 54421 / DB 54422 / Studio 54423 (backup `config.toml.bak`). `.env.local` repointed at local URL + demo JWTs (old cloud keys → `.env.local.cloud.bak`, Anthropic key kept). Created dev auth user `784e8466…` (FK target; seed.ts doesn't). Seeded via `scripts/seed.ts` + `seed-demo-extras.ts` → ~58 contacts / 6 bookings / 5 conversations / 247 AI logs. Dashboard now loads <1s with live data. **Known bug:** migration filenames use date-only versions (`20260417/18/19_*` repeat) → `supabase start`/`db push` collide on `schema_migrations` PK; applied SQL directly via `docker exec psql` as workaround — needs unique 14-digit timestamps before any prod `db push`. To restart dev: ensure the container runtime is up → `supabase start` → `npm run dev` (port 3004).
- [2026-06-04] Container runtime switched to **OrbStack** (Docker Desktop daemon kept dropping under load). `docker context` is now `orbstack`; the local Supabase stack runs on it, same ports, data intact. Docker Desktop no longer used.
- [2026-06-04] Fixed **RLS infinite recursion (42P17)** on `profiles`. The super-admin policies in `20260415_roles_and_teams.sql` did `EXISTS (SELECT 1 FROM profiles …)` inside a policy ON profiles → recursion → every anon/authenticated query to profiles (and any table whose policy selects profiles) 500'd. Masked under `SKIP_AUTH` (service-role bypasses RLS) but would break real auth/prod. Fix: new migration `20260604000001_fix_profiles_rls_recursion.sql` adds `public.is_super_admin()` (SECURITY DEFINER, reads profiles outside RLS) and rewrites the two profiles policies to call it. Applied live + verified anon REST on contacts/profiles returns 200 (was 500).
- [2026-06-28] **Fixed migration version collision** (was blocking any `supabase db push` to prod). Date-only filenames made 12 migrations share 3 version prefixes (`20260417` ×5, `20260418` ×3, `20260419` ×4) → `schema_migrations_pkey` duplicate-key error. Renamed all 12 + `20260420_sendgrid_stripe_keys` to unique 14-digit versions (`YYYYMMDD0000NN_*.sql`), preserving order — verified no intra-day FK deps (all refs → `auth.users`/`conversations`/`contacts`/`profiles` from base migrations 10–16). Base migrations `20260410`–`20260416` kept as 8-digit (already unique; sort before the 14-digit block numerically). Bumped sendgrid → `20260420000001_*` so it sorts after the 14-digit group. Updated stale filename in `src/app/api/referrals/route.ts:21` comment. Verified zero duplicate version prefixes. Migration files were not in git index → plain `mv` (will show as adds/deletes at commit). `db push` to a fresh prod DB now safe. **Prod backend NOT provisioned** — user chose local-only; old cloud project `cujeuerrfermubhonfyf` was deleted (not paused); a new project costs $10/mo in org Nazmul's Insights (`zpewvydbvijarxpjlwuu`).
- [2026-06-28] **Security audit (multi-agent, adversarially verified) + remediation of the safe/isolated tier.** Audited 104 API routes + 31 tables → 32 raised, **23 confirmed / 9 refuted**. Full report in [`SECURITY-AUDIT.md`](SECURITY-AUDIT.md). **Critical:** profiles UPDATE policy had no `WITH CHECK` + unguarded `role` column → any user could `UPDATE profiles SET role='super_admin'` via anon JWT = full takeover. **Fixed this pass (build+lint clean):** new `20260628000001_security_hardening.sql` (role-change trigger + `WITH CHECK` on profiles self-update; `match_knowledge_chunks` tenant scoping now mandatory + anon EXECUTE revoked; `team_invitations` role-change guard trigger); SSRF guard `src/lib/security/safe-url.ts` (DNS-resolve + private/metadata IP block) wired into `webhooks/deliver.ts` + `settings/webhooks` POST; `src/lib/security/skip-auth.ts` fail-closed guard (throws if `SKIP_AUTH=true` on Vercel or non-localhost Supabase) replacing raw `SKIP_AUTH` checks in get-user/server/middleware; admin GDPR export strips third-party secret columns; `auth/callback` open-redirect guard on `next`; Meta+Twilio webhooks now reject bad signatures unconditionally (was `NODE_ENV==='production'` only; bypass moved to explicit `ALLOW_UNVERIFIED_WEBHOOKS`); Slack webhook URL masked on GET; broadcasts/[id]/send UPDATEs scoped by `user_id`; generic 500s in slack/webhooks/broadcasts. **Deferred (need care/decisions):** M6 notifications INSERT policy (ripples into broadcasts/automation anon inserts), M2–M5 public-booking RLS (could break `/book/[slug]`), H2 chat + rate-limits (Upstash + product), L5 chat/init flag, L8 remaining ~25 verbatim-error routes. Migration NOT applied to local DB (OrbStack was down; RLS bypassed in dev under SKIP_AUTH anyway) — deploys with the rest. NOT committed.
