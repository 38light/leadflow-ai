# Lead to Customer - SaaS Platform

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

- [2026-06-28] **Built outbound webhooks with an SSRF guard (the requested "fix" — but the described `deliver.ts`/`webhook_endpoints`/`/api/settings/webhooks` did not exist; only inbound receivers + scaffolding, so the feature was built fresh with the guard baked in).** New SSRF guard `src/lib/webhooks/ssrf-guard.ts` (https-only, no creds, DNS-resolve + reject private/loopback/link-local/reserved v4+v6 incl. `169.254.169.254`, IPv4-mapped v6, fail-closed; optional `WEBHOOK_EGRESS_ALLOWLIST`; injectable `lookup` for hermetic tests). Validated at create/update AND re-validated right before each delivery (DNS-rebinding defense); `fetch(..., { redirect: "manual" })` + 5s timeout. Tenant CRUD at `src/app/api/settings/webhooks/route.ts` + `[id]/route.ts` (`getUser()` + `user_id`-scoped, no IDOR; secret returned once on create, masked on list). Delivery in `src/lib/webhooks/deliver.ts` — `dispatchWebhookEvent` loads active subscribed endpoints in-request then delivers via Next `after()` (API stays fast); HMAC-SHA256 `X-Webhook-Signature: t=,v1=` (Stripe-style); best-effort + logs every attempt to `webhook_deliveries`. New cookieless service-role client `src/lib/supabase/admin.ts` (needs `SUPABASE_SERVICE_ROLE_KEY`) for `after()` log writes. Migration `supabase/migrations/20260628_outbound_webhooks.sql` (`webhook_endpoints` + `webhook_deliveries`, RLS, `set_updated_at` trigger). Dispatch wired into `POST /api/contacts` (`contact.created`) + `POST /api/calendar/book` (`booking.created`). Types added to `src/types/index.ts`. Added Vitest (`npm test`) + `src/lib/webhooks/ssrf-guard.test.ts` (11 tests, network-free). tsc + build clean, 0 new lint warnings. Design: `docs/superpowers/specs/2026-06-28-outbound-webhooks-ssrf-design.md`. **Pending (user):** apply the migration (`npx supabase db push`) — until then dispatch no-ops gracefully (contact/booking creation unaffected).
