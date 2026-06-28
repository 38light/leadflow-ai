# Outbound Webhooks with SSRF Guard — Design

Date: 2026-06-28

## Problem

The repo had no outbound webhook delivery. A request to "fix the SSRF in
`src/lib/webhooks/deliver.ts`" pointed at files that did not exist — only inbound
webhook receivers (`/api/webhooks/{meta,hubspot,vapi,twilio,stripe}`), a
`webhook_logs` table, and marketing docs describing webhook events. Decision:
build the outbound delivery feature properly, with the SSRF guard baked in from
the start (never add the hole, then patch it).

## Goal

Let an authenticated tenant register outbound webhook endpoints that LeadFlow
POSTs to when `contact.created` and `booking.created` fire — without ever
allowing a URL that targets private/loopback/metadata addresses.

## Architecture

Each unit has one purpose and is independently testable.

| Unit | File | Responsibility |
|------|------|----------------|
| SSRF guard | `src/lib/webhooks/ssrf-guard.ts` | Classify IPs; validate a URL (https, no creds, DNS-resolve, reject private/reserved, optional allowlist). Pure `isPrivateOrReservedIp` + async `assertSafeWebhookUrl` with injectable `lookup`. |
| Event catalog | `src/lib/webhooks/events.ts` | `WEBHOOK_EVENTS` + `WebhookEvent` type (leaf module so validators don't pull in delivery machinery). |
| Admin client | `src/lib/supabase/admin.ts` | Cookieless service-role Supabase client for `after()` writes. |
| Delivery | `src/lib/webhooks/deliver.ts` | `dispatchWebhookEvent` (load endpoints in-request, deliver via `after()`), `deliverWebhookEvent` (re-validate → sign → fetch → log). |
| Validators | `src/lib/validators/webhooks.ts` | Zod create/update schemas. |
| CRUD API | `src/app/api/settings/webhooks/route.ts` + `[id]/route.ts` | GET/POST/PATCH/DELETE, `getUser()` + `user_id` scoped, SSRF guard on create/update. |

## SSRF Guard (the security core)

- Requires `https:`; rejects embedded credentials (`user:pass@`).
- Resolves the hostname via DNS (`dns.promises.lookup`, all records) and rejects
  if **any** resolved address is private/reserved. IP literals are classified
  directly (no DNS).
- Blocked v4: `0/8, 10/8, 100.64/10, 127/8, 169.254/16, 172.16/12, 192.0.0/24,
  192.168/16, 198.18/15, 224/4, 240/4` + TEST-NETs. Blocked v6: `::, ::1,
  fc00::/7, fe80::/10, ff00::/8`, and IPv4-mapped `::ffff:a.b.c.d` (reclassified).
- Un-parseable input fails **closed** (treated as blocked).
- Optional env allowlist `WEBHOOK_EGRESS_ALLOWLIST` (comma-separated hostnames).
- Called **twice**: at create/update time (reject early, 400) and again right
  before each delivery (defense in depth vs DNS rebinding).
- Error messages are tenant-safe and never reveal the resolved internal IP.

## Delivery

- `dispatchWebhookEvent` loads the user's `active` endpoints subscribed to the
  event (RLS-scoped client, while the request context is live), then schedules
  delivery with Next.js `after()` so the originating API call returns immediately.
- `deliverWebhookEvent` re-validates the URL, signs the body
  `X-Webhook-Signature: t=<unix>,v1=<hmac-sha256(`${t}.${body}`, secret)>`
  (Stripe-style) plus `X-Webhook-Event` / `X-Webhook-Id`, and fetches with
  `redirect: "manual"` (no redirect-to-private) and a 5s `AbortSignal.timeout`.
- Best-effort: every outcome (2xx, non-2xx, redirect, timeout, DNS, re-rejection)
  is recorded in `webhook_deliveries`. Delivery never throws into the request.

## Data model (`supabase/migrations/20260628_outbound_webhooks.sql`)

- `webhook_endpoints` — `url, secret, events text[], description, active`; RLS
  CRUD scoped to `auth.uid()`; `set_updated_at` trigger.
- `webhook_deliveries` — `endpoint_id, event_type, status, status_code, error`;
  user SELECT own, service_role ALL (writes happen from the admin client).

## Dispatch sites

- `POST /api/contacts` → `contact.created` (payload = inserted contact row).
- `POST /api/calendar/book` → `booking.created` (payload = booking event).

## Testing

`src/lib/webhooks/ssrf-guard.test.ts` (Vitest, hermetic — injected `lookup`,
no real network): asserts `169.254.169.254`, `localhost`, and a `10.x` host are
rejected, a normal public https URL passes, plus credentials/non-https/rebinding/
allowlist cases and an `isPrivateOrReservedIp` truth table. Added `vitest` devDep
+ `npm test` script.

## Scope guardrails (YAGNI)

No retry queue, no cron, no UI components, no receiver-side verification helper.
Delivery is best-effort + logged.

## Operational notes

- Requires `SUPABASE_SERVICE_ROLE_KEY` (already in `.env.example`) for the admin
  client used by `after()` delivery logging.
- The migration must be applied (`npx supabase db push`) before endpoints persist.
  Until then, `dispatchWebhookEvent` no-ops gracefully (the endpoint SELECT
  returns an error that is swallowed — contact/booking creation is unaffected).
- Known limitation: re-validation narrows but does not fully close the
  validate→connect TOCTOU window. Full closure would require pinning the
  connection to the validated IP (custom undici dispatcher) — deferred.
