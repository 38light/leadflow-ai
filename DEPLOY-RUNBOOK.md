# Production Provisioning Runbook

> Status: **NOT provisioned** (deliberate — local-only dev). This is the exact,
> de-risked sequence to stand up the cloud backend + deploy when you decide to.
> Estimated cost: **~$10/mo** for a Supabase project (org *Nazmul's Insights*,
> `zpewvydbvijarxpjlwuu`). Vercel hosting can be free tier.
>
> The migration chain has been **dry-run end-to-end against a fresh database**
> (all 24 migrations apply clean, in order, zero errors — 2026-06-28), so step 3
> is the only DB step and it is known-good.

## 1. Create the Supabase project
- Supabase dashboard → org *Nazmul's Insights* → New project.
- Pick a strong DB password (save it). Region: closest to users (e.g. Sydney).
- After it provisions, collect from Project Settings → API:
  - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
  - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`
  - Project ref (the `xxxx` in the URL) → used in step 2.

## 2. Link the CLI
```bash
supabase link --project-ref <PROJECT_REF>
# paste the DB password when prompted
```

## 3. Push migrations (known-good — verified clean)
```bash
supabase db push
```
This applies all 24 files in `supabase/migrations/` in order. The previous
version-collision blocker is fixed (unique 14-digit versions); a full-chain
dry-run on a fresh DB passed 24/24.

## 4. (Optional) seed demo data
Real signups auto-create a `profiles` row via the `handle_new_user` trigger, so
seeding is only for a demo. The local seed scripts (`scripts/seed.ts`,
`scripts/seed-demo-extras.ts`) point at env vars — repoint them at the prod
URL + service-role key first, and only run against an empty prod DB.

## 5. Set environment variables (Vercel → Project → Settings → Environment Variables)
**Required (app will not work without these):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ANTHROPIC_API_KEY` (AI features; users can also set their own in Settings)
- `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` (your prod domain)

**Do NOT set `SKIP_AUTH`.** It is a local-dev backdoor; `skipAuthEnabled()`
throws if it is ever present on a Vercel deploy. Leave it unset.

**Strongly recommended for a public deploy:**
- `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` — **without these the
  rate limits degrade to allow-all**, so the booking/contact/newsletter/chat
  abuse protections (M8, H2, etc.) won't actually limit anything. Set them to
  make those security controls real.

**Optional (per integration you enable):**
- Payments: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- Email: `RESEND_API_KEY`, `CONTACT_EMAIL`
- Telephony/WhatsApp: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_WHATSAPP_NUMBER`
- Meta: `META_APP_SECRET`, `META_VERIFY_TOKEN`
- HubSpot: `HUBSPOT_CLIENT_SECRET`
- Voice: `VAPI_WEBHOOK_SECRET`
- Embeddings: `VOYAGE_API_KEY`
- Webhook egress allowlist (optional SSRF tightening): `WEBHOOK_EGRESS_ALLOWLIST`
- `ALLOW_UNVERIFIED_WEBHOOKS` — leave UNSET in prod (only for local webhook testing; it disables Meta/Twilio signature enforcement).

## 6. Deploy
- Push to the branch Vercel tracks (or `vercel --prod`). Build is verified clean.

## 7. Post-deploy smoke check
- Register a new user → confirm a `profiles` row appears and you land in the dashboard.
- Open a booking page `/<slug>` → confirm services/availability render (RPC path).
- Trigger one AI chat message → confirm a reply + an `ai_interaction_logs` row.
- Confirm `SKIP_AUTH` is unset (the app would crash on boot if it were set).

## Security posture note
All hardening migrations (`20260628000001/02/03`) are in the chain, so RLS,
the role-escalation guard, booking-settings RPC, notifications lockdown, and the
billing-counter lockdown all ship automatically. The only security control that
needs an env var to be *active* is the rate limiting (needs Upstash — step 5).
