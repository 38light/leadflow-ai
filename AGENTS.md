# LeadFlow AI / Lead to Customer

## Stack / Config
- Next.js 15 App Router, TypeScript, Tailwind CSS v4, Supabase Postgres/Auth/Storage, Claude, local Transformers.js embeddings.
- Local app: `npm run dev` on port 3004. Local Supabase API 54421, Postgres 54422, Studio 54423 (OrbStack).
- Run `npm run build`, `npm run type-check`, `npm run lint`, and `npm test` before committing. Stop the dev server before building; both use `.next`.
- For local integration QA, apply the migrations, build, start `SKIP_AUTH=false ./node_modules/.bin/next start --hostname 127.0.0.1 --port 3005`, then run `npm run test:integration`. It creates isolated local test accounts, signs in through Auth, verifies permissions/delivery, and removes its fixtures. It never calls external message/AI providers.
- Scope business data by `getAPIContext().ownerId`; viewers cannot perform mutations. Shared navigation receives the server-authenticated admin flag.
- Today lives at `/dashboard`; follow-ups live on contact records and in Today. Due timestamps are stored in UTC; Today uses the business timezone and contact forms identify the device timezone.
- Web-chat sessions use hashed 32-byte capabilities, have a 30-day expiry, and expose only their own persisted messages. The public polling endpoint accepts the token in a POST body.

## What's Been Done
- [2026-11-07] Built the first daily-workflow release: Today action queues, assigned follow-ups with due dates and conflict protection, contact next-step summaries, transactional web-chat approvals and manual replies, persistent visitor transcripts, tenant/team access checks, and modal hydration repair. Added two local database migrations and automated verification.
- [2026-11-07] Release QA passed: production build (187 app route entries), TypeScript, zero-warning lint, 105 unit tests, 53 authenticated integration checks, and mobile/desktop browser checks for add/reschedule/snooze/complete. Removed disposable QA records and kept the local app on port 3004.

## Known Quirks
- The local database was provisioned outside the Supabase migration ledger; `supabase_migrations.schema_migrations` is absent. New migrations were applied explicitly through transactional `psql`; do not replay the full migration chain against this database.
- `PROJECT-CONTEXT.md`, `APP.md`, and the June daily-retention plan describe earlier states. Check this log and current source before treating their TODOs or capability claims as current.
- Live reply delivery in this release is web chat. Other channels fail explicitly in the inbox/approval flow. AI calendar, booking, and payment tools hand off to a person instead of returning placeholder success.
- Overview queues are capped at 200 and display truncation notices. Contact follow-ups load pending and completed work separately so historical completions cannot hide next steps.
- The local `SKIP_AUTH=true` setup uses a service-role client. Authenticated integration checks must run with `SKIP_AUTH=false` and exercise real owner/member/viewer sessions.
- Local Auth accepts ES256 user tokens but rejects older HS256 admin JWTs. The integration harness reads current local keys through `supabase status`, creates disposable users directly in the local database, and uses the real password sign-in flow.
- In the Codex browser, automated `fill()` on `datetime-local` can update the visible value without firing React's change handler. Use the native date picker or keyboard date segments and verify the persisted date.

## Pending Tasks
- Connect and verify external channel ingestion/delivery, with provider receipts and durable retries.
- Connect AI appointment/payment actions to real booking/payment operations before enabling autonomous completion.
- Add opt-in daily briefs and follow-up automation with stop conditions after validating the Today workflow with real businesses.
- Provision production backend/hosting and production rate limiting when a production launch is requested.
