# Security Audit — Lead to Customer

> Generated 2026-06-28 by a multi-agent audit (7 parallel finders across auth/IDOR, admin authz,
> public-route controls, RLS, secret leakage, validation/SSRF — **each finding adversarially
> verified** by an independent skeptic agent). 32 raised → **23 confirmed, 9 refuted as false
> positives**. Surface: 104 API routes, 31 tables.

## Important context

The app currently runs **local-only with `SKIP_AUTH=true`** (cloud Supabase is dead; see CLAUDE.md).
Under that flag, auth is a no-op and the service-role client bypasses RLS, so **most findings below
are _latent_ — they bite the moment the app is deployed with real auth** (anon/SSR client + RLS as
the boundary). They should be fixed _before_ any production deploy. The migration set is authoritative
for what will deploy, so DB fixes are made as new migrations.

## Status legend
✅ fixed · 🛠 proposed (safe, isolated) · ⚠️ proposed (needs care — may affect behavior) · 🧩 needs product/infra decision

## Remediation status — 2026-06-28
**Fixed, pass 1 (build + lint clean):** C1 (critical role-escalation) · H1 (SSRF guard) · M1 (SKIP_AUTH fail-closed) · M7 (export secret-strip) · L1 (open-redirect) · L2 (webhook sig enforced unconditionally) · L3 (Slack URL masked) · L4 (broadcasts user_id) · L6 (match_knowledge_chunks now auth.uid()-scoped + EXECUTE revoked from PUBLIC) · L7 (team_invitations role guard) · L9 (increment_* billing-counter RPCs locked to service_role) · L10 (search_path pinned on remaining SECURITY DEFINER funcs).
**Fixed, pass 2 (build + 11 vitest + lint clean):** M2/M3/M4 (booking-RLS — services/availability/blocked_dates scoped to owners with a published slug via `has_published_booking()`) · M6 (notifications INSERT locked to `user_id=auth.uid() OR service_role`; broadcasts/bookings/automation inserts switched to the service client) · M8 + contact + newsletter (per-IP rate limits) · H2 rate-limit half (chat/message now per-IP capped, closing the rotating-sessionId AI-cost bypass). Also adopted a unit-tested SSRF guard (`ssrf-guard.ts`, 11 tests) replacing pass-1's `safe-url.ts`.
**Still open (need product/infra decisions, or low-value):** H2 chat full fix (signed widget token + `web_chat_enabled` flag — schema/product) · L5 chat/init business-name leak (needs the same `web_chat_enabled` flag) · M5 booking_settings full-row exposure (low) · L8 bulk verbatim-error sweep (49 files/99 sites, LOW/info, includes legit 4xx validation messages — skipped as disproportionate; the 3 highest-exposure routes were done).
**DB fixes live in** `20260628000001_security_hardening.sql` + `20260628000002_public_rls_hardening.sql` (not yet applied to local DB — OrbStack down; deploy with the rest. ⚠️ after deploy, verify the public `/book/[slug]` page still renders services/availability — the booking-RLS scoping is unverified against a live DB).

---

## 🔴 CRITICAL

### C1 — Self-promotion to `super_admin` via profiles RLS → full platform takeover ✅ FIXED
- **Where:** `supabase/migrations/20260410_core_tables.sql:36`
- **Issue:** `"Users can update own profile" FOR UPDATE USING (user_id = auth.uid())` has **no `WITH CHECK`** and no column guard. `role` (added 20260415, `CHECK (role IN ('super_admin','user'))`) is the sole source of `isSuperAdmin` (`src/lib/auth/get-user.ts`). Prod uses the RLS-enforced anon client, so this policy is the only backstop for direct PostgREST writes. Any authenticated user can `UPDATE profiles SET role='super_admin' WHERE user_id=<self>` via their own anon JWT → passes every `/api/admin/*` gate → impersonate, data/delete (wipe any user), data/export, mass email, etc.
- **Fix (applied):** `supabase/migrations/20260628000001_security_hardening.sql` — adds `WITH CHECK (user_id = auth.uid())` + a `BEFORE UPDATE` trigger that forbids non-service-role callers from changing `role`. Service-role (admin client / Stripe webhooks) is allowed through; no admin route writes `role` today, so nothing breaks.

---

## 🟠 HIGH

### H1 — SSRF: outbound webhook delivery fetches user-supplied URL with no guard 🛠
- **Where:** `src/lib/webhooks/deliver.ts:51` (`fetch(endpoint.url, …)`); only validation is `url.startsWith("https://")` at `src/app/api/settings/webhooks/route.ts:48`.
- **Issue:** A tenant registers `https://169.254.169.254/…` (cloud metadata), `https://localhost:<port>`, or internal `10/172.16/192.168` hosts; `contact.created` / `booking.completed` then POST from inside the trust boundary. Blind SSRF → internal service access / metadata credential reach.
- **Fix:** add `assertSafeFetchUrl()` — require https, DNS-resolve and reject private/loopback/link-local/CGNAT/metadata ranges, reject odd ports, disable/validate redirects. Call it BOTH at write time (settings/webhooks POST) and immediately before `fetch()` in deliver.ts.

### H2 — Public `chat/message` trusts attacker-supplied `businessId` on a service-role client 🧩
- **Where:** `src/app/api/chat/message/route.ts:52` (`createAdminClient()` → RLS bypassed).
- **Issue:** Only check is that `businessId` matches a `profiles.id` (public — emitted in the widget bootstrap). All writes (contact/message/conversation/AI reply) are scoped to that attacker-controlled id with no caller→tenant binding. Rate limit is keyed on attacker-chosen `sessionId` (rotatable; allow-all if Upstash unset). Impact: cross-tenant fake-record injection + AI-cost abuse (each forged msg runs Claude on the victim's account; may auto-send to attacker-supplied address).
- **Fix (needs decision):** gate on an explicit per-tenant "web-chat widget enabled" flag; key rate limit on IP + per-businessId cap; issue a signed widget token at `/chat/init` that `/chat/message` must present; bound the auto-send-to-arbitrary-email behavior. (Schema + product decision — see "Open decisions".)

---

## 🟡 MEDIUM

### M1 — `SKIP_AUTH=true` collapses auth **and** RLS across every route 🛠
- **Where:** `src/lib/auth/get-user.ts:30` + `src/lib/supabase/server.ts:35` + `src/lib/supabase/middleware.ts:8`.
- **Issue:** One env var makes every route authenticate as a fixed super-admin AND swaps in the service-role client (RLS bypassed). Latent: only in `.env.local` (gitignored, localhost) today, but one mis-deploy = total bypass.
- **Fix:** hard-fail at startup if `SKIP_AUTH==='true'` and `NODE_ENV==='production'` (or `VERCEL_ENV` set) / non-localhost Supabase URL. Add a CI check that no shipped env defines it.

### M2–M5 — Over-broad public RLS on the booking subsystem (cross-tenant enumeration) ⚠️
Anon role can hit raw PostgREST and dump **all tenants'** rows; the app routes scope by slug but PostgREST bypasses that.
- **M2** `services` — `USING (is_active = true)` → all tenants' service catalogs+prices. `20260416_booking_system.sql:26`
- **M3** `availability_schedules` — `USING (is_active = true)` → all tenants' working hours. `:51`
- **M4** `blocked_dates` — `USING (true)` → all tenants' blocked dates incl. free-text `reason`. `:71`
- **M5 (LOW)** `booking_settings` — `USING (booking_url_slug IS NOT NULL)` → full settings row incl. `user_id`. `:100`
- **Fix (needs care — must not break the public booking page):** scope each policy to the slug owner (subselect on `booking_settings.booking_url_slug`) OR drop the public policies and serve booking data exclusively through a `SECURITY DEFINER get_public_booking(slug)` RPC returning only safe columns. Verify `/book/[slug]` still renders after.

### M6 — `notifications` INSERT policy is `WITH CHECK (true)` for all roles ⚠️ (deferred)
- **Where:** `supabase/migrations/20260417000003_notifications.sql:25`
- **Issue:** Named "Service role can insert" but has no `TO service_role` / `auth.uid()` check → any anon/authenticated caller can POST a notification with arbitrary `user_id` + attacker-controlled `title/body/link` into any victim's feed (phishing). Service role bypasses RLS anyway, so the policy is unnecessary.
- **Fix:** drop the policy (let only the service client insert), or `WITH CHECK (auth.role() = 'service_role')`.

### M7 — Admin GDPR export dumps all third-party secrets in plaintext 🛠
- **Where:** `src/app/api/admin/data/export/route.ts:42` (`profiles.select("*")`).
- **Issue:** Exports `anthropic_api_key`, `stripe_secret_key`, `sendgrid_api_key`, twilio/meta/vapi/hubspot tokens, `slack_webhook_url` verbatim into a downloadable file. Super-admin-only (so not attacker-reachable), but a regression from the column-allowlists used by admin/accounts & admin/users.
- **Fix:** replace `select("*")` with an explicit non-secret column allowlist; emit `connected: !!value` booleans instead of raw secrets.

### M8 — No rate limit on public booking creation 🧩
- **Where:** `src/app/api/public/booking/[slug]/book/route.ts` (insert + flips matching contact to qualified/hot).
- **Issue:** Unauthenticated; an enumerated slug → unlimited junk bookings that block real slots + pollute CRM state.
- **Fix:** per-IP + per-slug rate limit (Upstash) ± CAPTCHA. (Infra decision — Upstash.)

### (also MEDIUM) — public contact form has no rate limit 🧩
`src/app/api/contact/route.ts` — unauthenticated Resend send per submission; inbox/quota DoS + content injection into staff mail. Same fix family as M8.

---

## ⚪ LOW / INFO

- **L1** `auth/callback` open redirect — `next` param concatenated unvalidated; `next=@evil.com` / `next=.evil.com` escape to attacker host. Validate `next` starts with single `/`, not `//` or `/\`. `src/app/api/auth/callback/route.ts:13` 🛠
- **L2** Meta + Twilio webhooks only enforce signature when `NODE_ENV==='production'` (else log+continue). Reject unconditionally; gate any dev bypass behind an explicit flag. (HubSpot/Stripe/Vapi verify correctly.) `webhooks/meta/route.ts:52`, `webhooks/twilio/route.ts:35` 🛠
- **L3** Slack webhook URL returned raw despite "masked" comment — a bearer secret echoed to the browser/team-members. Return `connected` + masked tail only. `src/app/api/settings/slack/route.ts:42` 🛠
- **L4** `broadcasts/[id]/send` UPDATEs filter by `id` only (not `user_id`) — not exploitable today (pre-checked same request) but breaks the codebase's defense-in-depth convention. Append `.eq("user_id", ctx.ownerId)`. 🛠
- **L5** `chat/init` leaks `business_name` for any profile id (service-role, no widget-enabled gate). Gate on a public-widget flag. 🛠
- **L6** `match_knowledge_chunks` (SECURITY DEFINER) defaults `p_user_id` to NULL → returns chunks across all tenants if omitted. Latent (no caller yet). `20260414_functions.sql:57` ✅ FIXED — `20260628000001` now scopes rows to `auth.uid()` (the `p_user_id IS NULL` escape hatch is gone; a supplied `p_user_id` is ignored for scoping and rejected if it isn't the caller's own id), pins `search_path`, and does `REVOKE ALL … FROM public` + `GRANT … TO authenticated, service_role`. **Note:** the first cut only did `REVOKE … FROM anon`, which is a no-op — anon inherits the default PUBLIC grant, so EXECUTE must be revoked from PUBLIC, not from anon.
- **L7** `team_invitations` "Invitees can accept" UPDATE has no `WITH CHECK` → an invitee can PATCH `role` on their own-email invite (within-tenant member→admin escalation via `accept` route copying `invitation.role`). Move acceptance to a SECURITY DEFINER RPC / service route ignoring client `role`. `20260415_roles_and_teams.sql:50` 🛠
- **L8** DB error messages forwarded verbatim (`{ error: error.message }`) across ~30 routes → internal schema disclosure; violates CLAUDE.md convention. Return generic 5xx, log server-side. 🛠
- **L9** `increment_message_count` / `increment_ai_call_count` (SECURITY DEFINER, `20260414_functions.sql:90,100`) — **missed by the first pass; same class as L6.** Trust a caller-supplied `p_user_id`, bypass RLS, and keep the default PUBLIC execute grant → any anon/authenticated caller can inflate **another tenant's** billing/quota counters (`message_count_this_period` / `ai_calls_this_period`) to force them over plan limits (cross-tenant quota-DoS). Latent (no caller). ✅ FIXED — `20260628000001` pins `search_path` and locks EXECUTE to `service_role` (REVOKE from PUBLIC). Billing increments must run on the service-role client.
- **L10** Remaining SECURITY DEFINER funcs (`handle_new_user`, `update_contact_on_message`, `get_owner_id`) had no pinned `search_path` (Supabase `function_search_path_mutable`). Not directly exploitable (triggers run only in trigger context; `get_owner_id` is an RLS helper). ✅ FIXED — `SET search_path = public` added in `20260628000001`; grants left unchanged (`get_owner_id` must stay callable by the roles whose RLS policies invoke it). Minor remaining nit: `update_updated_at` (a SECURITY INVOKER trigger fn) is still unpinned — low risk.
- **INFO** `messages` has no UPDATE/DELETE policy (default-deny — safe, coverage note). `feature_flags` `USING (true)` world-readable (roadmap/flag-name disclosure; no tenant column).

---

## Refuted (verified NOT exploitable — do not waste time on these)
Booking-family team-write RLS gap (fails closed, not escalation) · membership `.single()` "throws" (wrong — `.limit(1)` precedes it) · impersonation cookie "client-trusted" (auth resolver never reads it) · newsletter no-RL (inert no-op, no DB sink) · audit_logs/admin_notes/account_tags "no policy" (correct default-deny admin-only) · integrations GET "reflects secrets" (returns booleans only) · contacts `.or()` "filter injection" (AND-scoped to own tenant + RLS) · admin broadcast "stored XSS" (super-admin-authored, no boundary crossed) · "missing Zod" routes (tenant-scoped + RLS, integrity nit only).

---

## Open decisions (need your input before fixing)
1. **H2 chat/message + M8/contact rate limits** — these need an Upstash Redis instance (or in-memory fallback) and, for H2, a new `profiles.web_chat_enabled` flag + signed widget token. Product/infra decision.
2. **M2–M5 booking RLS** — rewrite risks the public `/book/[slug]` page; should be done with a render-verify check after.

## Coverage note
The tenant-B IDOR finder (settings/agency/team/referrals/analytics routes) crashed on output-retries during the first pass and was re-run separately; merge its findings here when available.
