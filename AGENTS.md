# LeadFlow AI / Lead to Customer

## Stack / Config
- Next.js 15 App Router, TypeScript, Tailwind CSS v4, Supabase Postgres/Auth/Storage, Claude, local Transformers.js embeddings.
- Local app: `npm run dev` on port 3004. Local Supabase API 54421, Postgres 54422, Studio 54423 (OrbStack).
- Run `npm run build`, `npm run type-check`, `npm run lint`, and `npm test` before committing. Stop the dev server before building; both use `.next`.
- For local integration QA, apply the migrations, build, start `SKIP_AUTH=false ./node_modules/.bin/next start --hostname 127.0.0.1 --port 3005`, then run `npm run test:integration`. It creates isolated local test accounts, signs in through Auth, verifies permissions/delivery, and removes its fixtures. It never calls external message/AI providers.
- Scope business data by `getAPIContext().ownerId`; viewers cannot perform mutations. Shared navigation receives the server-authenticated admin flag.
- Today lives at `/dashboard`; follow-ups live on contact records and in Today. Due timestamps are stored in UTC; Today uses the business timezone and contact forms identify the device timezone.
- Web-chat sessions use hashed 32-byte capabilities, have a 30-day expiry, and expose only their own persisted messages. The public polling endpoint accepts the token in a POST body.
- Private pilot: Vercel `38light/leadflow-ai`, Node 24, all functions in `syd1`; stable URL `https://leadflow-ai-green-alpha.vercel.app`. Clean Supabase `exghomavadwqhxtunzds` is in Sydney with all 29 migrations applied. Local data remains separate.
- Hosted signup is disabled in Supabase Auth; `NEXT_PUBLIC_PILOT_MODE=true` shows invitation-only screens. Never deploy `SKIP_AUTH=true` or unverified webhook bypasses. `npm run check:pilot` guards the Vercel build.
- Production rate limits default to the service-only database RPC; optional Redis requires both credentials. AI enquiry cap defaults to 100 per business per 24 hours. Set `ONNXRUNTIME_NODE_INSTALL=skip` before hosted dependency installation; embeddings cache under the server's temporary directory.
- `npm run test:migrations` validates all migrations and ownership/concurrency in a disposable local database. `npm run test:hosted` requires explicit cloud credentials and a matching `PILOT_QA_PROJECT_REF`; it creates and removes only synthetic fixtures. Optional `PILOT_QA_REALTIME=true` checks a real subscription receipt.

## What's Been Done
- [2026-11-07] Built the first daily-workflow release: Today action queues, assigned follow-ups with due dates and conflict protection, contact next-step summaries, transactional web-chat approvals and manual replies, persistent visitor transcripts, tenant/team access checks, and modal hydration repair. Added two local database migrations and automated verification.
- [2026-11-07] Release QA passed: production build (187 app route entries), TypeScript, zero-warning lint, 105 unit tests, 53 authenticated integration checks, and mobile/desktop browser checks for add/reschedule/snooze/complete. Removed disposable QA records and kept the local app on port 3004.
- [2026-11-07] Prepared the private pilot with real sign-in/invitation/password recovery, identity-bound password updates, activity-based onboarding, private storage policies, realtime publication, durable rate limits, deployment preflight and CI; provisioned a clean cloud database and retained the archived demo backend.
- [2026-11-07] Pilot release QA: 181 unit tests, zero-warning lint, production build, TypeScript, 53 authenticated local integration checks, and all 29 migrations including storage ownership and concurrent rate-limit checks passed.
- [2026-11-07] Published the private pilot and verified 30 hosted checks, including tenant isolation, visitor delivery, follow-ups, onboarding, private file access, and realtime receipt; removed synthetic fixtures. GitHub CI passed. Accepted the invitation for `talk@nazmc.com` and opened verified password setup in Codex; user must choose the password. Archived demo backend is paused.

## Known Quirks
- The local database was provisioned outside the Supabase migration ledger; `supabase_migrations.schema_migrations` is absent. New migrations were applied explicitly through transactional `psql`; do not replay the full migration chain against this database.
- `PROJECT-CONTEXT.md`, `APP.md`, and the June daily-retention plan describe earlier states. Check this log and current source before treating their TODOs or capability claims as current.
- Live reply delivery in this release is web chat. Other channels fail explicitly in the inbox/approval flow. AI calendar, booking, and payment tools hand off to a person instead of returning placeholder success.
- Overview queues are capped at 200 and display truncation notices. Contact follow-ups load pending and completed work separately so historical completions cannot hide next steps.
- The local `SKIP_AUTH=true` setup uses a service-role client. Authenticated integration checks must run with `SKIP_AUTH=false` and exercise real owner/member/viewer sessions.
- Local Auth accepts ES256 user tokens but rejects older HS256 admin JWTs. The integration harness reads current local keys through `supabase status`, creates disposable users directly in the local database, and uses the real password sign-in flow.
- In the Codex browser, automated `fill()` on `datetime-local` can update the visible value without firing React's change handler. Use the native date picker or keyboard date segments and verify the persisted date.
- The old local PostgreSQL image 17.6.1.104 can crash on denied function EXECUTE (upstream Supautils issue); migration QA checks denied privileges through catalogs. The new cloud pilot uses 17.11.0.018. Do not reset or upgrade unrelated containers.
- Default Supabase email templates use implicit invitation/recovery fragments; the reset page validates and clears them before SDK initialization. Custom SMTP is needed before inviting non-organisation members with the default free email service.
- The saved local Anthropic key failed authentication and was not deployed; pilot AI must remain disabled until a valid key and a synthetic end-to-end AI enquiry are verified.
- Hosted login uses a client-rendered Suspense shell: HTTP smoke tests verify the shell and Auth settings, while browser QA verifies the invitation copy. Realtime QA gives subscription and receipt separate bounded waits.

## Pending Tasks
- Connect and verify external channel ingestion/delivery, with provider receipts and durable retries.
- Connect AI appointment/payment actions to real booking/payment operations before enabling autonomous completion.
- Add opt-in daily briefs and follow-up automation with stop conditions after validating the Today workflow with real businesses.
- Complete the pilot owner's password setup and business profile, then install the widget on the selected business website (not yet supplied).
- Add a valid Anthropic key and verify AI responses before enabling AI; configure custom SMTP before inviting other businesses.
