# LeadFlow private pilot

## Environments

- Production app: https://leadflow-ai-green-alpha.vercel.app (Vercel project `38light/leadflow-ai`).
- Pilot backend: `exghomavadwqhxtunzds`, **LeadFlow Pilot**, Sydney, PostgreSQL 17.11.0.018, in the existing free Supabase organisation `aianssjonfowvawphuel`.
- Pilot owner: `talk@nazmc.com`. Create through an admin invitation, with AI disabled and approval required initially. Never seed demo contacts or a demo super-admin into this database.
- Archived backend: `cujeuerrfermubhonfyf`. Restored for inspection, then returned to its paused state; demo data was retained.
- Local dev stays on port 3004 with its own local database. Its schema has no migration ledger: apply only newly added migrations explicitly, never replay the chain there.

## Release checks

1. Stop local Next.js servers before building because they share `.next`.
2. Run `npm test`, `npm run lint`, `npm run build`, `npm run type-check`, and `npm run test:migrations`.
3. For authenticated local end-to-end QA, start `SKIP_AUTH=false NEXT_PUBLIC_PILOT_MODE=true ./node_modules/.bin/next start --hostname 127.0.0.1 --port 3005`, then run `npm run test:integration`. All fixtures are disposable and no AI or external message providers are called.
4. Review the diff, update `AGENTS.md`, commit, and push. GitHub Actions checks tests, lint, build, and types on pushes and PRs.
5. Confirm the linked Supabase project before `supabase db push --dry-run`, review pending migrations, then apply them with `supabase db push`. Never reset production or repoint the destructive demo seed scripts at it.
6. Deploy with `vercel --prod`. The Vercel build runs `npm run check:pilot` before `npm run build`.
7. Run `npm run test:hosted` with the four app/Supabase environment values below and `PILOT_QA_PROJECT_REF=exghomavadwqhxtunzds`; add `PILOT_QA_REALTIME=true` to include subscription delivery. It verifies anonymous denial, owner login, tenant isolation, visitor enquiry, reply delivery, follow-up completion, onboarding, and private storage. It creates isolated QA accounts without email and deletes only its own fixtures. It deliberately does not load `.env.local`.

## Hosting and environment

Vercel uses Next.js, Node 24, and `syd1`. `vercel.json` sets the same region for all functions and a 60-second API duration. Production's stable domain serves the public visitor widget; workspace pages/API routes require app authentication. Preview and generated deployment URLs retain Vercel protection.

Required production and preview environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (sensitive server secret)
- `NEXT_PUBLIC_APP_URL=https://leadflow-ai-green-alpha.vercel.app`
- `NEXT_PUBLIC_PILOT_MODE=true`
- `ONNXRUNTIME_NODE_INSTALL=skip` (must exist before dependency installation; keeps the ONNX CPU runtime and avoids CUDA downloads)
- `CHAT_AI_DAILY_LIMIT=100`

Leave `SKIP_AUTH` and `ALLOW_UNVERIFIED_WEBHOOKS` unset. `.vercelignore` excludes all environment files, backups, local Vercel state, and seed scripts. Secrets are managed in Vercel; ignored local `.vercel` files are for provisioning/QA only and must never be committed or shared.

Production public-endpoint rate limits use the service-only `consume_public_rate_limit` RPC, backed by hashed counters in the private schema. RLS and privilege revocation prevent client access. Optional Upstash variables switch to Redis; configure both values together. Failure denies requests. AI quota exhaustion preserves the enquiry for human handling.

`ANTHROPIC_API_KEY` is optional for human-operated pilot chat. The existing local key failed provider authentication on 2026-11-07 and was not copied to production. Supply a valid key and verify a synthetic enquiry before enabling AI. Other provider/payment/calendar integrations are not enabled by this pilot setup.

## Invitation and recovery

Hosted Supabase Auth must have public signup **disabled** and email confirmation enabled. The public pilot flag changes UI only; it does not enforce membership.

Site URL: `https://leadflow-ai-green-alpha.vercel.app`.

Allow only these same-origin redirect destinations:

- `/reset-password`
- `/api/auth/callback`
- `/api/auth/callback?next=%2Fdashboard`
- `/api/auth/callback?next=%2Freset-password`

Default Supabase invitation links should redirect to `/reset-password`. The client validates the invite/recovery fragment, removes credentials from the URL, verifies the session identity, and asks the user to choose their password. PKCE confirmation/recovery callbacks are exchanged on the server. Tokens must never appear in logs, screenshots, commits, or release notes.

Free Supabase with its default email provider does not allow custom email templates. The default provider permits messages to organisation-member addresses; the pilot owner is a member. Configure custom SMTP before inviting other businesses or relying on broader password-recovery delivery. Generating an invitation link does not send email; do not send invitations without user authorization.

## Database and rollback

All 29 migrations were applied to the initially empty pilot database. The chain includes RLS hardening, follow-ups, web-chat capabilities, private knowledge storage, realtime publication, and durable rate limits. Migration verification uses a disposable local database and removes it afterward.

The installed local PostgreSQL image 17.6.1.104 has an upstream Supautils crash on denied function EXECUTE. The verifier checks those grants through privilege catalogs instead of exercising that engine bug; service-role behavior and concurrent limits are exercised normally. The pilot uses a newer engine. Do not upgrade or reset unrelated local containers as part of an app release.

Rollback the app to the previous verified Vercel deployment if sign-in, tenant isolation, message delivery, or follow-up writes fail. Retain the additive database migrations and customer data. Disable AI first if only provider calls fail. Do not drop tables or restore a database backup without a specific recovery plan and user authorization.
