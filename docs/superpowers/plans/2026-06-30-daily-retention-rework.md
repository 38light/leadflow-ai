# Daily-Retention Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the dashboard into a daily-return habit loop: a "Today" command center (tasks, not stats), a daily brief email with one-tap approve links, urgency alerts (hot-lead email, missed-call auto-text-back), a follow-up task queue, and a consolidated analytics/nav structure.

**Architecture:** All features build on existing primitives — `getAPIContext()`/`createServerClient()` for authed routes, `createAdminClient()` for webhook/cron paths (no session), the existing `notifications` table + realtime panel for in-app pings, `getResend()` for email, and the existing `ai_approvals` race-guarded approve flow (mirrored for email one-tap). One new migration adds a `follow_ups` table, four `profiles` columns, and an `ai_approvals.action_token`. The Twilio voice webhook (currently a stub) becomes the missed-call → auto-SMS entry point; every inbound call is treated as missed (the app cannot answer calls — honest v1 semantics).

**Tech Stack:** Next.js 15.3 App Router (dev port 3004), TypeScript strict, Supabase (local, port 54421/54422), Zod, Vitest (`npm test`), Resend, Twilio SDK, Tailwind v4, lucide-react.

---

## Ground-truth facts (verified against source 2026-06-30 — do not re-derive)

- **Auth:** `getAPIContext(): Promise<AuthContext | null>` in API routes (401 on null); `getAuthContext()` in Server Components (redirects). Scope every query by `ctx.ownerId`. File: `src/lib/auth/get-user.ts`.
- **DB clients:** `await createServerClient()` (session/RLS), `createAdminClient()` (service-role, webhooks/cron). File: `src/lib/supabase/server.ts`.
- **Latest migration:** `20260629000001_local_embeddings_384.sql`. Next: `20260630000001_*`. Local DB container: `supabase_db_Lead_to_Customer` (postgres in Docker/OrbStack, port 54422).
- **notifications table** (`20260417000003_notifications.sql`): `id, user_id, type TEXT (no CHECK), title, body, link, read, created_at`. INSERT policy = service-role only → **always insert notifications with the admin client**. Realtime panel already exists (`src/components/layout/notification-panel.tsx`); unknown types fall through to the `system` icon. We reuse type `"new_message"` for missed calls (no schema/TS change needed).
- **ai_approvals** (`20260419000001_ai_quality.sql`): `id, user_id, conversation_id, contact_id, draft_content, confidence, reasoning, status ('pending'|'approved'|'rejected'), approved_by, approved_at, created_at`. The approve flow (`src/app/api/ai/approvals/[id]/route.ts`) does a **conditional update `.eq("status","pending")`** (race guard), then inserts a `messages` row (`direction:"outbound", sender_type:"ai", ai_model:"claude-sonnet-4-20250514"`), and rolls the status back to `pending` if the insert fails. **The email one-tap route must mirror this exactly.** Approving only records the message in the DB — external channel dispatch is not wired anywhere (same for the normal path), so email-approve is at parity.
- **Email:** `getResend()` singleton (`src/lib/email/resend.ts`, env `RESEND_API_KEY`), from-address `"LeadFlow AI <noreply@leadflow.ai>"`. Weekly digest builder pattern: `src/lib/email/weekly-digest.ts` (`buildDigest(ownerId)` → `{subject, html, text, stats}`).
- **Slack:** `sendSlackNotification(webhookUrl, {text})` (`src/lib/integrations/slack.ts`), never throws, callers use `void (async () => {...})()`.
- **Hot-lead Slack hook lives in** `src/app/api/contacts/route.ts` (~lines 89–107): `if (data.temperature === "hot") { void (async () => { ...profiles select slack_webhook_url, slack_notify_hot_leads... eq("user_id", user.id) ... })(); }`.
- **Stale-hot logic** (`src/app/api/alerts/stale-hot-leads/route.ts`): `temperature='hot'`, `status NOT IN (won,lost)`, `last_interaction_at < now() - (profiles.stale_lead_hours ?? 2)h`.
- **Twilio voice webhook** (`src/app/api/webhooks/twilio/voice/route.ts`): validates signature via `validateRequest` from `twilio/lib/webhooks/webhooks` (env `TWILIO_AUTH_TOKEN`, header `x-twilio-signature`, skip when `NODE_ENV !== "production" && !authToken`), then returns stub TwiML. Keep the validation block verbatim.
- **SMS adapter** (`src/lib/channels/adapters/sms.ts`): `OutboundMessage` has NO `from` field (adapter derives it internally) → for missed-call text-back we call the Twilio SDK directly (`client.messages.create({ to, from, body })`) so the reply always comes from the number that was called.
- **findOrCreateContact** (`src/lib/contacts/find-or-create.ts`): `findOrCreateContact({ userId, supabase, name?, email?, phone?, sourceChannel, externalId? }): Promise<{ contactId, isNew }>` — dedupes by phone then email. `sourceChannel` values must be one of the contacts CHECK enum: `whatsapp|instagram|facebook|sms|voice|web_chat|manual|hubspot`.
- **conversations** columns include `channel_type text NOT NULL` (no CHECK), `external_thread_id`, `status ('active'|'paused'|'closed'|'archived')`, `is_ai_active`, `unread_count integer DEFAULT 0`, `last_message_at`. **messages** columns include `direction ('inbound'|'outbound')`, `sender_type ('contact'|'ai'|'human')`, `content_type` CHECK includes `'text'`, `channel_type text NOT NULL` (no CHECK), `metadata jsonb DEFAULT '{}'`.
- **bookings**: `booking_date date`, `start_time time`, `end_time time`, `status ('pending'|'confirmed'|'cancelled'|'completed'|'no_show')`, `client_name`. Query by `.eq("booking_date", "YYYY-MM-DD")`.
- **profiles** already has: `timezone text DEFAULT 'Australia/Sydney'`, `stale_lead_hours integer DEFAULT 2`, `slack_webhook_url`, `slack_notify_hot_leads`, `slack_notify_bookings`, `twilio_phone_number`. Types file `src/types/supabase.ts` is **hand-maintained** — every schema change must be mirrored there.
- **Sidebar** (`src/components/layout/sidebar.tsx`): 12-item `navItems` array (exact current contents in Task 13). There is **no Approvals link today** (the `/approvals` page is unreachable from nav) and no Pipelines link. `MobileNav` exists at `src/components/layout/mobile-nav.tsx`.
- **Dashboard page** (`src/app/(dashboard)/dashboard/page.tsx`): Server Component rendering `StaleLeadsAlert`, `OnboardingChecklist`, `AIHandledStats`, `KpiCards`, `DashboardCharts`, `ActivityFeed`.
- **Analytics pages:** `/analytics` (client, KPIs + funnel + sankey + forecast), `/analytics/team`, `/analytics/funnel`. No `analytics/layout.tsx` exists yet.
- **UI primitives** in `src/components/ui/`: `Card/CardHeader/CardTitle/CardContent`, `Button` (`variant: primary|secondary|outline|ghost|danger`, `size: sm|md|lg`, `loading`), `Toggle` (`toggle.tsx`), `Skeleton`, `Input`, `Textarea`, `Badge`. Import from `@/components/ui`.
- **Rate limiting:** `rateLimitByIp(req, bucket, limit, windowSeconds)` from `@/lib/rate-limit/chat` — degrades to allow-all without Upstash env.
- **Vitest:** `npm test` runs `src/**/*.test.ts`, node environment, hermetic (no DB/network). 59 tests currently green.
- **Cron infra: does not exist.** No vercel.json, no /api/cron/*, no CRON_SECRET. This plan creates all three.
- **Dev quirks:** `SKIP_AUTH=1` in `.env.local` → all auth returns dev user `784e8466-82e2-4f57-a68b-1e289b62b54a` and `createServerClient()` returns the service-role client (RLS bypassed locally — RLS still must be written correctly for prod). Never run `npm run build` while `next dev` is running (corrupts `.next`).
- **Commit convention:** conventional commits on `main`, e.g. `feat(today): ...`. Run `npm run type-check` before each commit.

---

## File Structure (what gets created/modified)

**Created:**
- `supabase/migrations/20260630000001_daily_retention.sql` — follow_ups table, profiles columns, ai_approvals.action_token
- `src/lib/validators/follow-ups.ts` + `follow-ups.test.ts`
- `src/app/api/follow-ups/route.ts` (GET/POST) + `src/app/api/follow-ups/[id]/route.ts` (PATCH/DELETE)
- `src/lib/dashboard/today.ts` + `today.test.ts` — timezone-aware day bounds (pure)
- `src/app/api/dashboard/today/route.ts` — Today aggregation
- `src/components/dashboard/today-command-center.tsx` — the Today UI
- `src/lib/email/daily-brief.ts` + `daily-brief.test.ts` — brief builder + pure HTML renderer
- `src/app/api/ai/approvals/[id]/act/route.ts` — one-tap email approve/reject (GET confirm page + POST execute)
- `src/app/api/cron/daily-brief/route.ts` — cron-triggered send-to-all
- `src/app/api/digest/daily/send/route.ts` — authenticated "send me my brief now"
- `src/lib/validators/notifications.ts` — settings validator
- `src/app/api/settings/notifications/route.ts` (GET/PUT)
- `src/app/(dashboard)/settings/notifications/page.tsx` — settings UI
- `src/lib/webhooks/missed-call.ts` + `missed-call.test.ts` — pure text-back decision
- `src/app/(dashboard)/analytics/layout.tsx` — tab bar
- `vercel.json` — cron schedule (forward-prep; harmless locally)

**Modified:**
- `src/types/supabase.ts` — FollowUpRow, profiles columns, ai_approvals.action_token
- `src/types/index.ts` — FollowUp interface
- `src/app/(dashboard)/dashboard/page.tsx` — TodayCommandCenter replaces StaleLeadsAlert
- `src/app/api/contacts/route.ts` — hot-lead email alert alongside Slack
- `src/app/api/webhooks/twilio/voice/route.ts` — missed-call handling
- `src/components/layout/sidebar.tsx` — nav rework
- `src/components/layout/mobile-nav.tsx` — matching nav rework (if items overlap)
- `.env.example` — CRON_SECRET
- `CLAUDE.md`, `DEPLOY-RUNBOOK.md` — docs

**Explicitly out of scope (per design discussion):** PWA/push notifications, streak gamification, deleting the `/digest`, `/system-flow`, `/app-pages` pages (only their nav links move/go — pages stay URL-reachable), any external Twilio/Resend account setup, tunnel setup for live webhook testing.

---

### Task 1: Migration + hand-maintained types

**Files:**
- Create: `supabase/migrations/20260630000001_daily_retention.sql`
- Modify: `src/types/supabase.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Write the migration**

```sql
-- Daily-retention rework: follow_ups table, notification/missed-call settings,
-- one-tap approval action tokens.

-- 1) profiles: notification + missed-call settings
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_brief_enabled boolean NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS notify_hot_lead_email boolean NOT NULL DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS missed_call_text_back_enabled boolean NOT NULL DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS missed_call_message text NOT NULL DEFAULT 'Sorry we missed your call! Reply here and we''ll help you right away.';

-- 2) ai_approvals: opaque token for one-tap email actions.
-- Backfills existing rows automatically via the default.
ALTER TABLE ai_approvals ADD COLUMN IF NOT EXISTS action_token uuid NOT NULL DEFAULT gen_random_uuid();

-- 3) follow_ups: personal "chase this lead" task queue.
CREATE TABLE IF NOT EXISTS follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id uuid REFERENCES contacts(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_at timestamptz NOT NULL,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_user_due
  ON follow_ups (user_id, due_at)
  WHERE completed_at IS NULL;

ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;

-- Single owner-scoped policy, WITH CHECK included (audit lesson: UPDATE
-- policies without WITH CHECK allow cross-tenant writes).
DROP POLICY IF EXISTS "Users manage own follow_ups" ON follow_ups;
CREATE POLICY "Users manage own follow_ups" ON follow_ups
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
```

- [ ] **Step 2: Apply to the local DB and verify**

OrbStack must be running (`docker ps` should list `supabase_db_Lead_to_Customer`).

Run:
```bash
docker exec -i supabase_db_Lead_to_Customer psql -U postgres -d postgres \
  < "supabase/migrations/20260630000001_daily_retention.sql"
docker exec -i supabase_db_Lead_to_Customer psql -U postgres -d postgres -c \
  "SELECT column_name FROM information_schema.columns WHERE table_name='follow_ups' ORDER BY ordinal_position;
   SELECT column_name FROM information_schema.columns WHERE table_name='profiles' AND column_name LIKE '%brief%' OR table_name='profiles' AND column_name LIKE 'missed%' OR (table_name='profiles' AND column_name='notify_hot_lead_email');
   SELECT column_name FROM information_schema.columns WHERE table_name='ai_approvals' AND column_name='action_token';"
```
Expected: follow_ups shows 8 columns; profiles shows `daily_brief_enabled`, `notify_hot_lead_email`, `missed_call_text_back_enabled`, `missed_call_message`; ai_approvals shows `action_token`. Zero errors.

- [ ] **Step 3: Mirror in `src/types/supabase.ts`**

Add to the `ProfileRow` interface (after `hide_branding: boolean | null;`):
```typescript
  daily_brief_enabled: boolean;
  notify_hot_lead_email: boolean;
  missed_call_text_back_enabled: boolean;
  missed_call_message: string;
```

Add a new row interface next to the other `*Row` interfaces:
```typescript
interface FollowUpRow {
  id: string;
  user_id: string;
  contact_id: string | null;
  title: string;
  due_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

Add to the `Database.public.Tables` map (alongside the other table entries, matching their exact generic shape):
```typescript
      follow_ups: {
        Row: FollowUpRow;
        Insert: Partial<FollowUpRow> & { user_id: string; title: string; due_at: string };
        Update: Partial<FollowUpRow>;
        Relationships: [];
      };
```

If an `AiApprovalRow`-style interface exists in this file, add `action_token: string;` to it. If ai_approvals is not typed in this file, skip (routes select columns explicitly).

- [ ] **Step 4: Add the business type to `src/types/index.ts`**

Near the other entity interfaces:
```typescript
export interface FollowUp {
  id: string;
  user_id: string;
  contact_id: string | null;
  title: string;
  due_at: string;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  contact?: { id: string; name: string | null } | null;
}
```

- [ ] **Step 5: Type-check and commit**

```bash
npm run type-check
git add supabase/migrations/20260630000001_daily_retention.sql src/types/supabase.ts src/types/index.ts
git commit -m "feat(db): follow_ups table, notification settings, approval action tokens"
```
Expected: tsc zero errors.

---

### Task 2: Follow-ups validator (TDD)

**Files:**
- Create: `src/lib/validators/follow-ups.ts`
- Test: `src/lib/validators/follow-ups.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/validators/follow-ups.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { createFollowUpSchema, updateFollowUpSchema } from "./follow-ups";

describe("createFollowUpSchema", () => {
  it("accepts a minimal valid follow-up", () => {
    const out = createFollowUpSchema.parse({
      title: "Chase Sarah about the proposal",
      due_at: "2026-07-01T07:00:00.000Z",
    });
    expect(out.title).toBe("Chase Sarah about the proposal");
    expect(out.contact_id).toBeNull();
  });

  it("accepts an optional contact_id uuid", () => {
    const out = createFollowUpSchema.parse({
      title: "Call back",
      due_at: "2026-07-01T07:00:00.000Z",
      contact_id: "3f2504e0-4f89-41d3-9a0c-0305e82c3301",
    });
    expect(out.contact_id).toBe("3f2504e0-4f89-41d3-9a0c-0305e82c3301");
  });

  it("rejects empty title, overlong title, bad date, bad uuid", () => {
    expect(() => createFollowUpSchema.parse({ title: "", due_at: "2026-07-01T07:00:00.000Z" })).toThrow();
    expect(() => createFollowUpSchema.parse({ title: "x".repeat(301), due_at: "2026-07-01T07:00:00.000Z" })).toThrow();
    expect(() => createFollowUpSchema.parse({ title: "ok", due_at: "not-a-date" })).toThrow();
    expect(() => createFollowUpSchema.parse({ title: "ok", due_at: "2026-07-01T07:00:00.000Z", contact_id: "nope" })).toThrow();
  });
});

describe("updateFollowUpSchema", () => {
  it("accepts completed toggle alone", () => {
    expect(updateFollowUpSchema.parse({ completed: true })).toEqual({ completed: true });
  });

  it("rejects empty object", () => {
    expect(() => updateFollowUpSchema.parse({})).toThrow();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/lib/validators/follow-ups.test.ts`
Expected: FAIL — cannot resolve `./follow-ups`.

- [ ] **Step 3: Implement the validator**

`src/lib/validators/follow-ups.ts`:
```typescript
import { z } from "zod";

export const createFollowUpSchema = z.object({
  title: z.string().min(1).max(300),
  due_at: z.string().datetime(),
  contact_id: z.string().uuid().optional().nullable().default(null),
});

export const updateFollowUpSchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    due_at: z.string().datetime().optional(),
    contact_id: z.string().uuid().nullable().optional(),
    completed: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export type CreateFollowUpInput = z.infer<typeof createFollowUpSchema>;
export type UpdateFollowUpInput = z.infer<typeof updateFollowUpSchema>;
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- src/lib/validators/follow-ups.test.ts`
Expected: 5 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/validators/follow-ups.ts src/lib/validators/follow-ups.test.ts
git commit -m "feat(follow-ups): zod validators with tests"
```

---

### Task 3: Follow-ups API routes

**Files:**
- Create: `src/app/api/follow-ups/route.ts`
- Create: `src/app/api/follow-ups/[id]/route.ts`

- [ ] **Step 1: List/create route**

`src/app/api/follow-ups/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { createFollowUpSchema } from "@/lib/validators/follow-ups";

export async function GET(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerClient();
  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get("status") ?? "open"; // open | done | all
  const dueBefore = searchParams.get("due_before"); // ISO timestamp

  let query = supabase
    .from("follow_ups")
    .select("*, contact:contacts(id, name)")
    .eq("user_id", ctx.ownerId)
    .order("due_at", { ascending: true })
    .limit(100);

  if (status === "open") query = query.is("completed_at", null);
  if (status === "done") query = query.not("completed_at", "is", null);
  if (dueBefore) query = query.lte("due_at", dueBefore);

  const { data, error } = await query;

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = createFollowUpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const supabase = await createServerClient();

  // If a contact is referenced, it must belong to this owner (no cross-tenant FK).
  if (parsed.data.contact_id) {
    const { data: contact } = await supabase
      .from("contacts")
      .select("id")
      .eq("id", parsed.data.contact_id)
      .eq("user_id", ctx.ownerId)
      .maybeSingle();
    if (!contact) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
    }
  }

  const { data, error } = await supabase
    .from("follow_ups")
    .insert({
      user_id: ctx.ownerId,
      title: parsed.data.title,
      due_at: parsed.data.due_at,
      contact_id: parsed.data.contact_id,
    })
    .select("*, contact:contacts(id, name)")
    .single();

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data }, { status: 201 });
}
```

- [ ] **Step 2: Update/delete route**

`src/app/api/follow-ups/[id]/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { updateFollowUpSchema } from "@/lib/validators/follow-ups";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateFollowUpSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const { completed, ...rest } = parsed.data;
  const update: Record<string, unknown> = { ...rest, updated_at: new Date().toISOString() };
  if (completed !== undefined) {
    update.completed_at = completed ? new Date().toISOString() : null;
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("follow_ups")
    .update(update)
    .eq("id", id)
    .eq("user_id", ctx.ownerId)
    .select("*, contact:contacts(id, name)")
    .maybeSingle();

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!UUID_RE.test(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const supabase = await createServerClient();
  const { error } = await supabase
    .from("follow_ups")
    .delete()
    .eq("id", id)
    .eq("user_id", ctx.ownerId);

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data: { id } });
}
```

Note: `params` is a Promise in Next 15 — match how `src/app/api/ai/approvals/[id]/route.ts` destructures it; if that file uses non-Promise params, copy its exact signature instead.

- [ ] **Step 3: Smoke against the dev server**

Dev server must be running (`npm run dev`, port 3004, SKIP_AUTH dev user active).

```bash
curl -s -X POST http://localhost:3004/api/follow-ups \
  -H 'Content-Type: application/json' \
  -d '{"title":"Test follow-up","due_at":"2026-07-01T07:00:00.000Z"}' | head -c 400
curl -s "http://localhost:3004/api/follow-ups?status=open" | head -c 400
```
Expected: 201 with row (id, title), then a list containing it. Then PATCH `{"completed":true}` on its id → completed_at set; DELETE → `{ data: { id } }`.

- [ ] **Step 4: Type-check and commit**

```bash
npm run type-check
git add src/app/api/follow-ups
git commit -m "feat(follow-ups): CRUD API routes"
```

---

### Task 4: Timezone-aware day bounds helper (TDD)

**Files:**
- Create: `src/lib/dashboard/today.ts`
- Test: `src/lib/dashboard/today.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/dashboard/today.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { dayBoundsUtc } from "./today";

describe("dayBoundsUtc", () => {
  it("computes Sydney 'today' across the UTC date line", () => {
    // 2026-06-30 15:00 UTC = 2026-07-01 01:00 in Sydney (AEST, UTC+10)
    const b = dayBoundsUtc(new Date("2026-06-30T15:00:00.000Z"), "Australia/Sydney");
    expect(b.dateStr).toBe("2026-07-01");
    expect(b.startIso).toBe("2026-06-30T14:00:00.000Z"); // Jul 1 00:00 AEST
    expect(b.endIso).toBe("2026-07-01T14:00:00.000Z");
  });

  it("computes UTC bounds", () => {
    const b = dayBoundsUtc(new Date("2026-06-30T10:00:00.000Z"), "UTC");
    expect(b.dateStr).toBe("2026-06-30");
    expect(b.startIso).toBe("2026-06-30T00:00:00.000Z");
    expect(b.endIso).toBe("2026-07-01T00:00:00.000Z");
  });

  it("falls back to UTC on an invalid timezone", () => {
    const b = dayBoundsUtc(new Date("2026-06-30T10:00:00.000Z"), "Not/AZone");
    expect(b.dateStr).toBe("2026-06-30");
    expect(b.startIso).toBe("2026-06-30T00:00:00.000Z");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/lib/dashboard/today.test.ts`
Expected: FAIL — cannot resolve `./today`.

- [ ] **Step 3: Implement**

`src/lib/dashboard/today.ts`:
```typescript
// Timezone-aware "today" boundaries for the Today command center and daily brief.
// Pure — no DB, no environment. Uses Intl so no date library is needed.

export interface DayBounds {
  startIso: string; // UTC instant of local midnight (start of local today)
  endIso: string;   // UTC instant of the next local midnight
  dateStr: string;  // local calendar date as YYYY-MM-DD (matches bookings.booking_date)
}

function tzOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts: Record<string, string> = {};
  for (const p of dtf.formatToParts(date)) parts[p.type] = p.value;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour) % 24, // Intl can emit "24" at midnight
    Number(parts.minute),
    Number(parts.second)
  );
  return asUtc - date.getTime();
}

export function dayBoundsUtc(now: Date, timeZone: string): DayBounds {
  let offset = 0;
  try {
    offset = tzOffsetMs(now, timeZone);
  } catch {
    offset = 0; // unknown timezone → UTC
  }
  const local = new Date(now.getTime() + offset);
  const y = local.getUTCFullYear();
  const m = local.getUTCMonth();
  const d = local.getUTCDate();
  const dateStr = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  // Offset at `now` is close enough at midnight for daily aggregation
  // (DST shifts introduce at most a 1h skew twice a year — acceptable here).
  const startMs = Date.UTC(y, m, d) - offset;
  return {
    startIso: new Date(startMs).toISOString(),
    endIso: new Date(startMs + 86_400_000).toISOString(),
    dateStr,
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- src/lib/dashboard/today.test.ts`
Expected: 3 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/dashboard/today.ts src/lib/dashboard/today.test.ts
git commit -m "feat(today): timezone-aware day-bounds helper with tests"
```

---

### Task 5: Today aggregation API

**Files:**
- Create: `src/app/api/dashboard/today/route.ts`

- [ ] **Step 1: Implement the route**

```typescript
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { dayBoundsUtc } from "@/lib/dashboard/today";

export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("timezone, stale_lead_hours")
    .eq("user_id", ctx.ownerId)
    .single();

  const bounds = dayBoundsUtc(new Date(), profile?.timezone ?? "Australia/Sydney");
  const staleHours = profile?.stale_lead_hours ?? 2;
  const staleCutoff = new Date(Date.now() - staleHours * 60 * 60 * 1000).toISOString();

  const [approvals, needsReply, staleHot, bookings, followUps, newLeads] = await Promise.all([
    supabase
      .from("ai_approvals")
      .select("id, draft_content, confidence, created_at, contact:contacts(id, name)", { count: "exact" })
      .eq("user_id", ctx.ownerId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("conversations")
      .select("id, channel_type, last_message_at, unread_count, contact:contacts(id, name)", { count: "exact" })
      .eq("user_id", ctx.ownerId)
      .eq("status", "active")
      .gt("unread_count", 0)
      .order("last_message_at", { ascending: false })
      .limit(5),
    supabase
      .from("contacts")
      .select("id, name, phone, source_channel, last_interaction_at", { count: "exact" })
      .eq("user_id", ctx.ownerId)
      .eq("temperature", "hot")
      .not("status", "in", "(won,lost)")
      .lt("last_interaction_at", staleCutoff)
      .order("last_interaction_at", { ascending: true })
      .limit(5),
    supabase
      .from("bookings")
      .select("id, client_name, start_time, end_time, status, service:services(name)")
      .eq("user_id", ctx.ownerId)
      .eq("booking_date", bounds.dateStr)
      .in("status", ["pending", "confirmed"])
      .order("start_time", { ascending: true })
      .limit(10),
    supabase
      .from("follow_ups")
      .select("id, title, due_at, contact:contacts(id, name)", { count: "exact" })
      .eq("user_id", ctx.ownerId)
      .is("completed_at", null)
      .lte("due_at", bounds.endIso)
      .order("due_at", { ascending: true })
      .limit(10),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ctx.ownerId)
      .gte("created_at", bounds.startIso),
  ]);

  const firstError =
    approvals.error ?? needsReply.error ?? staleHot.error ?? bookings.error ?? followUps.error ?? newLeads.error;
  if (firstError) {
    console.error("[API]", firstError);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      date: bounds.dateStr,
      staleThresholdHours: staleHours,
      approvals: { count: approvals.count ?? 0, items: approvals.data ?? [] },
      needsReply: { count: needsReply.count ?? 0, items: needsReply.data ?? [] },
      staleHot: { count: staleHot.count ?? 0, items: staleHot.data ?? [] },
      bookingsToday: bookings.data ?? [],
      followUpsDue: { count: followUps.count ?? 0, items: followUps.data ?? [] },
      newLeadsToday: newLeads.count ?? 0,
    },
  });
}
```

- [ ] **Step 2: Smoke it**

```bash
curl -s http://localhost:3004/api/dashboard/today | python3 -m json.tool | head -50
```
Expected: 200 JSON with all seven keys; counts reflect seeded demo data (~58 contacts seeded, so `staleHot`/`needsReply` likely non-zero).

- [ ] **Step 3: Type-check and commit**

```bash
npm run type-check
git add src/app/api/dashboard/today
git commit -m "feat(today): aggregation API for the command center"
```

---

### Task 6: Today command-center UI + dashboard rework

**Files:**
- Create: `src/components/dashboard/today-command-center.tsx`
- Modify: `src/app/(dashboard)/dashboard/page.tsx`

- [ ] **Step 1: Build the component**

`src/components/dashboard/today-command-center.tsx`:
```tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  Flame,
  MessageSquare,
  Plus,
  UserPlus,
} from "lucide-react";
import { Card } from "@/components/ui";

interface TodayData {
  date: string;
  staleThresholdHours: number;
  approvals: { count: number; items: { id: string; draft_content: string; confidence: number | null; contact: { id: string; name: string | null } | null }[] };
  needsReply: { count: number; items: { id: string; channel_type: string; last_message_at: string | null; unread_count: number; contact: { id: string; name: string | null } | null }[] };
  staleHot: { count: number; items: { id: string; name: string | null; last_interaction_at: string | null }[] };
  bookingsToday: { id: string; client_name: string; start_time: string; end_time: string; status: string; service: { name: string } | null }[];
  followUpsDue: { count: number; items: { id: string; title: string; due_at: string; contact: { id: string; name: string | null } | null }[] };
  newLeadsToday: number;
}

function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function TodayCommandCenter() {
  const [data, setData] = useState<TodayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/today", { cache: "no-store" });
      const json = await res.json();
      if (res.ok) setData(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function completeFollowUp(id: string) {
    await fetch(`/api/follow-ups/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: true }),
    });
    void load();
  }

  async function addFollowUp(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title || saving) return;
    setSaving(true);
    try {
      const due = new Date();
      due.setHours(17, 0, 0, 0); // default: today 5pm local
      if (due.getTime() < Date.now()) due.setDate(due.getDate() + 1);
      await fetch("/api/follow-ups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, due_at: due.toISOString() }),
      });
      setNewTitle("");
      void load();
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Card className="mb-6 animate-pulse p-6">
        <div className="h-5 w-40 rounded bg-gray-200" />
        <div className="mt-4 h-24 rounded bg-gray-100" />
      </Card>
    );
  }
  if (!data) return null;

  const needsYou =
    data.approvals.count + data.needsReply.count + data.staleHot.count + data.followUpsDue.count;

  return (
    <Card className="mb-6 p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Today</h2>
          <p className="text-sm text-gray-500">
            {needsYou === 0
              ? "All clear — nothing needs you right now."
              : `${needsYou} thing${needsYou === 1 ? "" : "s"} need${needsYou === 1 ? "s" : ""} you`}
            {data.newLeadsToday > 0 && ` · ${data.newLeadsToday} new lead${data.newLeadsToday === 1 ? "" : "s"} today`}
          </p>
        </div>
        {needsYou === 0 && <CheckCircle2 className="h-8 w-8 text-green-500" />}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Needs reply */}
        <section className="rounded-lg border border-gray-200 p-4">
          <Link href="/conversations" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-blue-600">
            <MessageSquare className="h-4 w-4 text-blue-500" />
            Needs your reply
            <span className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">{data.needsReply.count}</span>
          </Link>
          {data.needsReply.items.length === 0 ? (
            <p className="text-sm text-gray-400">Inbox is clear.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.needsReply.items.map((c) => (
                <li key={c.id}>
                  <Link href={`/conversations/${c.id}`} className="flex items-center justify-between text-sm text-gray-700 hover:text-blue-600">
                    <span className="truncate">{c.contact?.name ?? "Unknown"} · {c.channel_type}</span>
                    <span className="ml-2 shrink-0 text-xs text-gray-400">{timeAgo(c.last_message_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Approvals */}
        <section className="rounded-lg border border-gray-200 p-4">
          <Link href="/approvals" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-blue-600">
            <ClipboardCheck className="h-4 w-4 text-purple-500" />
            AI drafts waiting
            <span className="ml-auto rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-700">{data.approvals.count}</span>
          </Link>
          {data.approvals.items.length === 0 ? (
            <p className="text-sm text-gray-400">No drafts waiting.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.approvals.items.map((a) => (
                <li key={a.id} className="text-sm text-gray-700">
                  <span className="font-medium">{a.contact?.name ?? "Unknown"}:</span>{" "}
                  <span className="text-gray-500">{a.draft_content.slice(0, 60)}{a.draft_content.length > 60 ? "…" : ""}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Going cold */}
        <section className="rounded-lg border border-gray-200 p-4">
          <Link href="/contacts?filter=stale_hot" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-blue-600">
            <Flame className="h-4 w-4 text-red-500" />
            Hot leads going cold
            <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">{data.staleHot.count}</span>
          </Link>
          {data.staleHot.items.length === 0 ? (
            <p className="text-sm text-gray-400">No hot lead has waited over {data.staleThresholdHours}h.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.staleHot.items.map((c) => (
                <li key={c.id}>
                  <Link href={`/contacts/${c.id}`} className="flex items-center justify-between text-sm text-gray-700 hover:text-blue-600">
                    <span className="flex items-center gap-1 truncate">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-400" />
                      {c.name ?? "Unknown"}
                    </span>
                    <span className="ml-2 shrink-0 text-xs text-red-500">{timeAgo(c.last_interaction_at)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Today's meetings */}
        <section className="rounded-lg border border-gray-200 p-4">
          <Link href="/bookings" className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900 hover:text-blue-600">
            <CalendarCheck className="h-4 w-4 text-emerald-500" />
            Today&apos;s meetings
            <span className="ml-auto rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">{data.bookingsToday.length}</span>
          </Link>
          {data.bookingsToday.length === 0 ? (
            <p className="text-sm text-gray-400">No meetings booked today.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.bookingsToday.map((b) => (
                <li key={b.id} className="flex items-center justify-between text-sm text-gray-700">
                  <span className="truncate">{b.client_name}{b.service?.name ? ` · ${b.service.name}` : ""}</span>
                  <span className="ml-2 shrink-0 text-xs text-gray-400">{b.start_time.slice(0, 5)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Follow-ups due */}
        <section className="rounded-lg border border-gray-200 p-4 md:col-span-2 xl:col-span-2">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-900">
            <UserPlus className="h-4 w-4 text-amber-500" />
            Follow-ups due
            <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">{data.followUpsDue.count}</span>
          </div>
          {data.followUpsDue.items.length === 0 ? (
            <p className="text-sm text-gray-400">Nothing due. Add one below so it&apos;s here tomorrow.</p>
          ) : (
            <ul className="space-y-1.5">
              {data.followUpsDue.items.map((f) => (
                <li key={f.id} className="flex items-center gap-2 text-sm text-gray-700">
                  <button
                    onClick={() => void completeFollowUp(f.id)}
                    className="h-4 w-4 shrink-0 rounded-full border border-gray-300 hover:border-green-500 hover:bg-green-50"
                    aria-label={`Mark "${f.title}" done`}
                  />
                  <span className="truncate">
                    {f.title}
                    {f.contact?.name ? <span className="text-gray-400"> · {f.contact.name}</span> : null}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <form onSubmit={addFollowUp} className="mt-3 flex gap-2">
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a follow-up (due today 5pm)…"
              className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
              maxLength={300}
            />
            <button
              type="submit"
              disabled={saving || !newTitle.trim()}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Add
            </button>
          </form>
        </section>
      </div>
    </Card>
  );
}
```

If `@/components/ui` does not re-export `Card`, import from `@/components/ui/card` (check `src/components/ui/index.ts`).

- [ ] **Step 2: Rework the dashboard page**

In `src/app/(dashboard)/dashboard/page.tsx`:
1. Remove the `StaleLeadsAlert` import and its JSX usage (the stale section now lives inside the Today card).
2. Add `import { TodayCommandCenter } from "@/components/dashboard/today-command-center";`.
3. Render `<TodayCommandCenter />` as the FIRST element inside the page's returned container (above `OnboardingChecklist`). Leave `OnboardingChecklist`, `AIHandledStats`, `KpiCards`, `DashboardCharts`, `ActivityFeed` in place below it.
4. If the page has an `<h1>`/heading saying "Dashboard", change the text to "Today".

- [ ] **Step 3: Verify in the browser**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3004/dashboard
```
Expected: 200. Then open http://localhost:3004/dashboard — Today card renders at top with five sections; add a follow-up, tick it done; confirm the stale alert banner is gone (its data now shows in "Hot leads going cold").

- [ ] **Step 4: Type-check and commit**

```bash
npm run type-check
git add src/components/dashboard/today-command-center.tsx "src/app/(dashboard)/dashboard/page.tsx"
git commit -m "feat(today): command-center dashboard — tasks over stats"
```

---

### Task 7: Daily brief builder (TDD on the pure renderer)

**Files:**
- Create: `src/lib/email/daily-brief.ts`
- Test: `src/lib/email/daily-brief.test.ts`

- [ ] **Step 1: Write the failing test**

`src/lib/email/daily-brief.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { renderDailyBriefHtml, renderDailyBriefText, type DailyBriefStats } from "./daily-brief";

const stats: DailyBriefStats = {
  dateStr: "2026-07-01",
  newLeads24h: 3,
  aiConversations24h: 7,
  bookingsToday: [{ client_name: "Sarah Chen", start_time: "10:00:00" }],
  staleHotCount: 2,
  followUpsDueToday: 1,
  pendingApprovalsCount: 2,
  approvalItems: [
    {
      id: "11111111-1111-4111-8111-111111111111",
      action_token: "22222222-2222-4222-8222-222222222222",
      draft_content: "Hi <b>there</b> — happy to help!",
      contactName: "Sarah Chen",
    },
  ],
};

describe("renderDailyBriefHtml", () => {
  const html = renderDailyBriefHtml(stats, "http://localhost:3004");

  it("includes the headline counts and deep links", () => {
    expect(html).toContain("3");
    expect(html).toContain("http://localhost:3004/dashboard");
    expect(html).toContain("http://localhost:3004/approvals");
    expect(html).toContain("Sarah Chen");
  });

  it("includes one-tap approve/reject links with the action token", () => {
    expect(html).toContain(
      "http://localhost:3004/api/ai/approvals/11111111-1111-4111-8111-111111111111/act?token=22222222-2222-4222-8222-222222222222&action=approve"
    );
    expect(html).toContain("&action=reject");
  });

  it("escapes HTML in AI draft content", () => {
    expect(html).not.toContain("<b>there</b>");
    expect(html).toContain("&lt;b&gt;there&lt;/b&gt;");
  });
});

describe("renderDailyBriefText", () => {
  it("renders a plain-text fallback with counts", () => {
    const text = renderDailyBriefText(stats, "http://localhost:3004");
    expect(text).toContain("New leads (24h): 3");
    expect(text).toContain("/approvals");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/lib/email/daily-brief.test.ts`
Expected: FAIL — cannot resolve `./daily-brief`.

- [ ] **Step 3: Implement**

`src/lib/email/daily-brief.ts`:
```typescript
// Daily brief email: what happened in the last 24h + what needs the owner today.
// buildDailyBrief() queries; renderDailyBriefHtml()/Text() are pure (unit-tested).

import type { SupabaseClient } from "@supabase/supabase-js";
import { dayBoundsUtc } from "@/lib/dashboard/today";

export interface DailyBriefApprovalItem {
  id: string;
  action_token: string;
  draft_content: string;
  contactName: string;
}

export interface DailyBriefStats {
  dateStr: string;
  newLeads24h: number;
  aiConversations24h: number;
  bookingsToday: { client_name: string; start_time: string }[];
  staleHotCount: number;
  followUpsDueToday: number;
  pendingApprovalsCount: number;
  approvalItems: DailyBriefApprovalItem[];
}

export interface DailyBriefPayload {
  subject: string;
  html: string;
  text: string;
  stats: DailyBriefStats;
  needsYou: number;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function buildDailyBrief(
  supabase: SupabaseClient,
  ownerId: string,
  timeZone: string,
  appUrl: string
): Promise<DailyBriefPayload> {
  const now = new Date();
  const bounds = dayBoundsUtc(now, timeZone);
  const dayAgoIso = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

  const { data: profile } = await supabase
    .from("profiles")
    .select("stale_lead_hours")
    .eq("user_id", ownerId)
    .single();
  const staleHours = profile?.stale_lead_hours ?? 2;
  const staleCutoff = new Date(now.getTime() - staleHours * 60 * 60 * 1000).toISOString();

  const [newLeads, aiLogs, bookings, staleHot, followUps, approvals] = await Promise.all([
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ownerId)
      .gte("created_at", dayAgoIso),
    supabase
      .from("ai_interaction_logs")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ownerId)
      .gte("created_at", dayAgoIso),
    supabase
      .from("bookings")
      .select("client_name, start_time")
      .eq("user_id", ownerId)
      .eq("booking_date", bounds.dateStr)
      .in("status", ["pending", "confirmed"])
      .order("start_time", { ascending: true })
      .limit(10),
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ownerId)
      .eq("temperature", "hot")
      .not("status", "in", "(won,lost)")
      .lt("last_interaction_at", staleCutoff),
    supabase
      .from("follow_ups")
      .select("id", { count: "exact", head: true })
      .eq("user_id", ownerId)
      .is("completed_at", null)
      .lte("due_at", bounds.endIso),
    supabase
      .from("ai_approvals")
      .select("id, action_token, draft_content, contact:contacts(name)", { count: "exact" })
      .eq("user_id", ownerId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const approvalItems: DailyBriefApprovalItem[] = (approvals.data ?? []).map((a) => {
    const contact = a.contact as { name: string | null } | { name: string | null }[] | null;
    const name = Array.isArray(contact) ? contact[0]?.name : contact?.name;
    return {
      id: a.id as string,
      action_token: a.action_token as string,
      draft_content: (a.draft_content as string) ?? "",
      contactName: name ?? "Unknown contact",
    };
  });

  const stats: DailyBriefStats = {
    dateStr: bounds.dateStr,
    newLeads24h: newLeads.count ?? 0,
    aiConversations24h: aiLogs.count ?? 0,
    bookingsToday: bookings.data ?? [],
    staleHotCount: staleHot.count ?? 0,
    followUpsDueToday: followUps.count ?? 0,
    pendingApprovalsCount: approvals.count ?? 0,
    approvalItems,
  };

  const needsYou = stats.pendingApprovalsCount + stats.staleHotCount + stats.followUpsDueToday;
  const subject =
    needsYou > 0
      ? `Your ${stats.dateStr} brief — ${stats.newLeads24h} new lead${stats.newLeads24h === 1 ? "" : "s"}, ${needsYou} need${needsYou === 1 ? "s" : ""} you`
      : `Your ${stats.dateStr} brief — ${stats.newLeads24h} new lead${stats.newLeads24h === 1 ? "" : "s"}, all clear`;

  return {
    subject,
    html: renderDailyBriefHtml(stats, appUrl),
    text: renderDailyBriefText(stats, appUrl),
    stats,
    needsYou,
  };
}

export function renderDailyBriefHtml(stats: DailyBriefStats, appUrl: string): string {
  const statCell = (label: string, value: number | string) => `
    <td style="padding:12px;text-align:center;background:#f9fafb;border-radius:8px;">
      <div style="font-size:22px;font-weight:700;color:#111827;">${value}</div>
      <div style="font-size:12px;color:#6b7280;">${label}</div>
    </td>`;

  const bookingsRows = stats.bookingsToday.length
    ? stats.bookingsToday
        .map(
          (b) =>
            `<li style="margin:4px 0;color:#374151;font-size:14px;">${b.start_time.slice(0, 5)} — ${escapeHtml(b.client_name)}</li>`
        )
        .join("")
    : `<li style="margin:4px 0;color:#9ca3af;font-size:14px;">No meetings today</li>`;

  const approvalBlocks = stats.approvalItems
    .map((a) => {
      const base = `${appUrl}/api/ai/approvals/${a.id}/act?token=${a.action_token}`;
      return `
      <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin:8px 0;">
        <div style="font-size:13px;color:#6b7280;margin-bottom:4px;">Draft for <strong>${escapeHtml(a.contactName)}</strong></div>
        <div style="font-size:14px;color:#111827;margin-bottom:10px;">${escapeHtml(a.draft_content.slice(0, 280))}${a.draft_content.length > 280 ? "…" : ""}</div>
        <a href="${base}&action=approve" style="display:inline-block;background:#2563eb;color:#ffffff;font-size:13px;font-weight:600;padding:8px 14px;border-radius:6px;text-decoration:none;margin-right:8px;">Approve &amp; send</a>
        <a href="${base}&action=reject" style="display:inline-block;background:#f3f4f6;color:#374151;font-size:13px;font-weight:600;padding:8px 14px;border-radius:6px;text-decoration:none;">Reject</a>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr><td align="center" style="padding:24px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr><td style="background:#1d4ed8;padding:20px 24px;">
            <div style="color:#ffffff;font-size:18px;font-weight:700;">Your daily brief — ${stats.dateStr}</div>
          </td></tr>
          <tr><td style="padding:20px 24px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="8">
              <tr>
                ${statCell("New leads (24h)", stats.newLeads24h)}
                ${statCell("AI conversations", stats.aiConversations24h)}
                ${statCell("Going cold", stats.staleHotCount)}
                ${statCell("Follow-ups due", stats.followUpsDueToday)}
              </tr>
            </table>

            <h3 style="font-size:14px;color:#111827;margin:20px 0 6px;">Today's meetings</h3>
            <ul style="margin:0;padding-left:18px;">${bookingsRows}</ul>

            ${
              stats.pendingApprovalsCount > 0
                ? `<h3 style="font-size:14px;color:#111827;margin:20px 0 6px;">${stats.pendingApprovalsCount} AI draft${stats.pendingApprovalsCount === 1 ? "" : "s"} waiting for approval</h3>
                   ${approvalBlocks}
                   <div style="font-size:13px;margin-top:6px;"><a href="${appUrl}/approvals" style="color:#2563eb;">See all in the approvals queue →</a></div>`
                : ""
            }

            <div style="margin-top:24px;">
              <a href="${appUrl}/dashboard" style="display:inline-block;background:#111827;color:#ffffff;font-size:14px;font-weight:600;padding:10px 18px;border-radius:8px;text-decoration:none;">Open your Today view</a>
            </div>
          </td></tr>
          <tr><td style="padding:14px 24px;background:#f9fafb;">
            <div style="font-size:12px;color:#9ca3af;">You get this because your daily brief is on. Turn it off in Settings → Notifications.</div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function renderDailyBriefText(stats: DailyBriefStats, appUrl: string): string {
  const lines = [
    `Your daily brief — ${stats.dateStr}`,
    ``,
    `New leads (24h): ${stats.newLeads24h}`,
    `AI conversations (24h): ${stats.aiConversations24h}`,
    `Hot leads going cold: ${stats.staleHotCount}`,
    `Follow-ups due today: ${stats.followUpsDueToday}`,
    `AI drafts waiting: ${stats.pendingApprovalsCount}`,
    ``,
    `Today's meetings: ${stats.bookingsToday.length ? stats.bookingsToday.map((b) => `${b.start_time.slice(0, 5)} ${b.client_name}`).join(", ") : "none"}`,
    ``,
    `Open your Today view: ${appUrl}/dashboard`,
    `Approvals queue: ${appUrl}/approvals`,
  ];
  return lines.join("\n");
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- src/lib/email/daily-brief.test.ts`
Expected: 4 passed.

- [ ] **Step 5: Commit**

```bash
git add src/lib/email/daily-brief.ts src/lib/email/daily-brief.test.ts
git commit -m "feat(brief): daily brief builder with tested HTML/text renderers"
```

---

### Task 8: One-tap approval action route (email links)

**Files:**
- Create: `src/app/api/ai/approvals/[id]/act/route.ts`

**Design note:** Email scanners prefetch GET links, which would auto-approve drafts. Therefore **GET renders a confirmation page** (no side effect) whose button submits a **POST form** that performs the action. Two safe taps from the email. Token = `ai_approvals.action_token` (uuid, per-row). Uses the admin client (no session on an email click) — every mutation still hard-scopes by the row's own `user_id`, and the approve path mirrors the session route's race guard exactly.

- [ ] **Step 1: Implement the route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { rateLimitByIp } from "@/lib/rate-limit/chat";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function page(title: string, body: string, status = 200): NextResponse {
  const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f3f4f6;margin:0;padding:40px 16px;">
<div style="max-width:420px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;text-align:center;">
<h1 style="font-size:18px;color:#111827;margin:0 0 12px;">${title}</h1>
<div style="font-size:14px;color:#4b5563;">${body}</div>
</div></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function validate(id: string, token: string | null, action: string | null) {
  if (!UUID_RE.test(id)) return "Invalid link.";
  if (!token || !UUID_RE.test(token)) return "Invalid or missing token.";
  if (action !== "approve" && action !== "reject") return "Invalid action.";
  return null;
}

// GET = confirmation page only. No side effects (email scanners prefetch GETs).
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = request.nextUrl.searchParams.get("token");
  const action = request.nextUrl.searchParams.get("action");
  const invalid = validate(id, token, action);
  if (invalid) return page("Link problem", invalid, 400);

  const verb = action === "approve" ? "Approve & send" : "Reject";
  return page(
    `${verb} this AI draft?`,
    `<form method="POST" action="/api/ai/approvals/${id}/act?token=${token}&action=${action}" style="margin-top:8px;">
       <button type="submit" style="background:${action === "approve" ? "#2563eb" : "#dc2626"};color:#fff;border:0;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:600;cursor:pointer;">${verb}</button>
     </form>
     <p style="font-size:12px;color:#9ca3af;margin-top:14px;">One tap and you're done — no login needed.</p>`
  );
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const limit = await rateLimitByIp(request, "approval:act", 20, 60);
  if (!limit.allowed) return page("Slow down", "Too many attempts. Try again in a minute.", 429);

  const { id } = await params;
  const token = request.nextUrl.searchParams.get("token");
  const action = request.nextUrl.searchParams.get("action");
  const invalid = validate(id, token, action);
  if (invalid) return page("Link problem", invalid, 400);

  const admin = createAdminClient();

  const { data: approval } = await admin
    .from("ai_approvals")
    .select("id, user_id, conversation_id, contact_id, draft_content, status, action_token")
    .eq("id", id)
    .maybeSingle();

  // Same response for missing row and wrong token — don't leak row existence.
  if (!approval || approval.action_token !== token) {
    return page("Link problem", "This link is invalid or has expired.", 404);
  }
  if (approval.status !== "pending") {
    return page("Already handled", `This draft was already ${approval.status}.`);
  }

  const nowIso = new Date().toISOString();

  if (action === "reject") {
    const { data: updated } = await admin
      .from("ai_approvals")
      .update({ status: "rejected", approved_by: approval.user_id, approved_at: nowIso })
      .eq("id", id)
      .eq("status", "pending")
      .select("id");
    if (!updated || updated.length === 0) {
      return page("Already handled", "This draft was already processed.");
    }
    return page("Draft rejected", "The AI draft was rejected. Nothing was sent.");
  }

  // Approve: mirror the session route — conditional update first (race guard),
  // then message insert, rollback on failure.
  const { data: conversation } = await admin
    .from("conversations")
    .select("id, channel_type")
    .eq("id", approval.conversation_id)
    .eq("user_id", approval.user_id)
    .maybeSingle();
  if (!conversation) {
    return page("Link problem", "The conversation for this draft no longer exists.", 404);
  }

  const { data: updated } = await admin
    .from("ai_approvals")
    .update({ status: "approved", approved_by: approval.user_id, approved_at: nowIso })
    .eq("id", id)
    .eq("status", "pending")
    .select("id");
  if (!updated || updated.length === 0) {
    return page("Already handled", "This draft was already processed.");
  }

  const { error: insertError } = await admin.from("messages").insert({
    user_id: approval.user_id,
    conversation_id: approval.conversation_id,
    contact_id: approval.contact_id,
    direction: "outbound",
    sender_type: "ai",
    content: approval.draft_content,
    content_type: "text",
    channel_type: conversation.channel_type,
    ai_model: "claude-sonnet-4-20250514",
    metadata: { approved_from: id, approved_by: approval.user_id, via: "email" },
  });

  if (insertError) {
    console.error("[API]", insertError);
    await admin
      .from("ai_approvals")
      .update({ status: "pending", approved_by: null, approved_at: null })
      .eq("id", id);
    return page("Something went wrong", "The message could not be recorded. The draft is back in your approvals queue.", 500);
  }

  return page("Approved ✓", "The AI reply was approved and recorded in the conversation.");
}
```

- [ ] **Step 2: Smoke it end-to-end against local data**

Seed one pending approval directly, then exercise the route:
```bash
docker exec -i supabase_db_Lead_to_Customer psql -U postgres -d postgres -c "
INSERT INTO ai_approvals (user_id, conversation_id, contact_id, draft_content, confidence, status)
SELECT c.user_id, c.id, c.contact_id, 'Test draft for one-tap approval', 0.4, 'pending'
FROM conversations c LIMIT 1
RETURNING id, action_token;"
```
Take the returned `id` + `action_token`, then:
```bash
curl -s "http://localhost:3004/api/ai/approvals/<ID>/act?token=<TOKEN>&action=approve" | grep -o "Approve & send this AI draft?"
curl -s -X POST "http://localhost:3004/api/ai/approvals/<ID>/act?token=<TOKEN>&action=approve" | grep -o "Approved ✓"
curl -s -X POST "http://localhost:3004/api/ai/approvals/<ID>/act?token=<TOKEN>&action=approve" | grep -o "Already handled"
curl -s -X POST "http://localhost:3004/api/ai/approvals/<ID>/act?token=00000000-0000-4000-8000-000000000000&action=approve" -o /dev/null -w "%{http_code}"
```
Expected in order: confirm page text; "Approved ✓"; "Already handled" (idempotent); `404` (wrong token). Verify a `messages` row appeared:
```bash
docker exec -i supabase_db_Lead_to_Customer psql -U postgres -d postgres -c \
  "SELECT direction, sender_type, metadata->>'via' FROM messages ORDER BY created_at DESC LIMIT 1;"
```
Expected: `outbound | ai | email`.

- [ ] **Step 3: Type-check and commit**

```bash
npm run type-check
git add "src/app/api/ai/approvals/[id]/act"
git commit -m "feat(approvals): one-tap email approve/reject with confirm page + race guard"
```

---

### Task 9: Daily brief send routes (cron + send-now) + vercel.json

**Files:**
- Create: `src/app/api/cron/daily-brief/route.ts`
- Create: `src/app/api/digest/daily/send/route.ts`
- Create: `vercel.json`
- Modify: `.env.example`, `.env.local`

- [ ] **Step 1: Cron route (secret-gated, no session)**

`src/app/api/cron/daily-brief/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { buildDailyBrief } from "@/lib/email/daily-brief";
import { getResend } from "@/lib/email/resend";

export const maxDuration = 300;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false; // fail closed when unconfigured
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

async function run(request: NextRequest): Promise<NextResponse> {
  if (!authorized(request)) {
    return NextResponse.json(
      { error: process.env.CRON_SECRET ? "Unauthorized" : "CRON_SECRET not configured" },
      { status: process.env.CRON_SECRET ? 401 : 503 }
    );
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 503 });
  }

  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3004";

  const { data: profiles, error } = await admin
    .from("profiles")
    .select("user_id, timezone, daily_brief_enabled")
    .eq("daily_brief_enabled", true);

  if (error) {
    console.error("[Cron daily-brief]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  const resend = getResend();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const p of profiles ?? []) {
    try {
      const { data: userRes } = await admin.auth.admin.getUserById(p.user_id);
      const email = userRes?.user?.email;
      if (!email) {
        skipped++;
        continue;
      }
      const brief = await buildDailyBrief(admin, p.user_id, p.timezone ?? "Australia/Sydney", appUrl);
      await resend.emails.send({
        from: "LeadFlow AI <noreply@leadflow.ai>",
        to: email,
        subject: brief.subject,
        html: brief.html,
        text: brief.text,
      });
      sent++;
    } catch (e) {
      console.error("[Cron daily-brief] send failed for", p.user_id, e);
      failed++;
    }
  }

  return NextResponse.json({ data: { sent, skipped, failed } });
}

// Vercel Cron invokes with GET + Authorization: Bearer $CRON_SECRET.
export async function GET(request: NextRequest) {
  return run(request);
}
export async function POST(request: NextRequest) {
  return run(request);
}
```

- [ ] **Step 2: Authenticated "send now" route**

`src/app/api/digest/daily/send/route.ts`:
```typescript
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { buildDailyBrief } from "@/lib/email/daily-brief";
import { getResend } from "@/lib/email/resend";

export async function POST() {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "Email is not configured (RESEND_API_KEY missing)" }, { status: 503 });
  }
  const recipient = ctx.user.email;
  if (!recipient) {
    return NextResponse.json({ error: "Your account has no email address" }, { status: 400 });
  }

  const admin = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3004";

  const { data: profile } = await admin
    .from("profiles")
    .select("timezone")
    .eq("user_id", ctx.ownerId)
    .single();

  try {
    const brief = await buildDailyBrief(admin, ctx.ownerId, profile?.timezone ?? "Australia/Sydney", appUrl);
    await getResend().emails.send({
      from: "LeadFlow AI <noreply@leadflow.ai>",
      to: recipient,
      subject: brief.subject,
      html: brief.html,
      text: brief.text,
    });
    return NextResponse.json({ data: { recipient } });
  } catch (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
```

- [ ] **Step 3: vercel.json + env**

`vercel.json` (new file, project root):
```json
{
  "crons": [
    {
      "path": "/api/cron/daily-brief",
      "schedule": "0 21 * * *"
    }
  ]
}
```
(21:00 UTC = 7:00am Sydney during AEST. Vercel sends `Authorization: Bearer $CRON_SECRET` automatically when the env var exists. Locally the route is exercised with curl.)

Append to `.env.example`:
```
# Secret for /api/cron/* routes (generate: openssl rand -hex 32)
CRON_SECRET=
```
Generate a real value into `.env.local`:
```bash
echo "CRON_SECRET=$(openssl rand -hex 32)" >> .env.local
```
Restart the dev server so the env var loads.

- [ ] **Step 4: Smoke the cron route**

```bash
SECRET=$(grep '^CRON_SECRET=' .env.local | cut -d= -f2)
curl -s -X POST http://localhost:3004/api/cron/daily-brief -H "Authorization: Bearer $SECRET"
curl -s -o /dev/null -w "%{http_code}" -X POST http://localhost:3004/api/cron/daily-brief
```
Expected: first returns `{"data":{"sent":N,"skipped":M,"failed":K}}` — if `RESEND_API_KEY` is absent locally it returns 503 `RESEND_API_KEY not configured` (that is the correct fail-closed behavior; note it and move on). Second (no header) returns 401.

- [ ] **Step 5: Type-check and commit**

```bash
npm run type-check
git add src/app/api/cron src/app/api/digest/daily vercel.json .env.example
git commit -m "feat(brief): daily-brief cron + send-now routes, vercel cron schedule"
```

---

### Task 10: Notification settings (API + page)

**Files:**
- Create: `src/lib/validators/notifications.ts`
- Create: `src/app/api/settings/notifications/route.ts`
- Create: `src/app/(dashboard)/settings/notifications/page.tsx`
- Modify: `src/app/(dashboard)/settings/page.tsx` (add link)

- [ ] **Step 1: Validator**

`src/lib/validators/notifications.ts`:
```typescript
import { z } from "zod";

export const updateNotificationSettingsSchema = z
  .object({
    daily_brief_enabled: z.boolean().optional(),
    notify_hot_lead_email: z.boolean().optional(),
    missed_call_text_back_enabled: z.boolean().optional(),
    missed_call_message: z.string().min(1).max(320).optional(),
    stale_lead_hours: z.number().int().min(1).max(168).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "No fields to update" });

export type UpdateNotificationSettingsInput = z.infer<typeof updateNotificationSettingsSchema>;
```

- [ ] **Step 2: API route**

`src/app/api/settings/notifications/route.ts`:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getAPIContext } from "@/lib/auth/get-user";
import { updateNotificationSettingsSchema } from "@/lib/validators/notifications";

const COLUMNS =
  "daily_brief_enabled, notify_hot_lead_email, missed_call_text_back_enabled, missed_call_message, stale_lead_hours";

export async function GET() {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(COLUMNS)
    .eq("user_id", ctx.ownerId)
    .single();

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function PUT(request: NextRequest) {
  const ctx = await getAPIContext();
  if (!ctx) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateNotificationSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Validation failed" }, { status: 400 });
  }

  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("profiles")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("user_id", ctx.ownerId)
    .select(COLUMNS)
    .single();

  if (error) {
    console.error("[API]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ data });
}
```

- [ ] **Step 3: Settings page**

`src/app/(dashboard)/settings/notifications/page.tsx`:
```tsx
"use client";

import { useEffect, useState } from "react";
import { Bell, PhoneMissed, Send } from "lucide-react";
import { Button, Card } from "@/components/ui";

interface Settings {
  daily_brief_enabled: boolean;
  notify_hot_lead_email: boolean;
  missed_call_text_back_enabled: boolean;
  missed_call_message: string;
  stale_lead_hours: number | null;
}

function Row({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div>
        <div className="text-sm font-medium text-gray-900">{label}</div>
        <div className="text-sm text-gray-500">{description}</div>
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? "bg-blue-600" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : "translate-x-0.5"}`}
        />
      </button>
    </div>
  );
}

export default function NotificationSettingsPage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/settings/notifications");
      const json = await res.json();
      if (res.ok) setSettings(json.data);
    })();
  }, []);

  async function save(partial: Partial<Settings>) {
    if (!settings) return;
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(partial),
      });
      const json = await res.json();
      if (res.ok) {
        setSettings(json.data);
        setMessage("Saved.");
      } else {
        setMessage(json.error ?? "Save failed");
      }
    } finally {
      setSaving(false);
    }
  }

  async function sendTestBrief() {
    setSendingTest(true);
    setMessage(null);
    try {
      const res = await fetch("/api/digest/daily/send", { method: "POST" });
      const json = await res.json();
      setMessage(res.ok ? `Brief sent to ${json.data.recipient}` : (json.error ?? "Send failed"));
    } finally {
      setSendingTest(false);
    }
  }

  if (!settings) {
    return <div className="p-6 text-sm text-gray-500">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <p className="text-sm text-gray-500">Daily brief, urgent alerts, and missed-call auto-text.</p>
      </div>

      <Card className="p-6">
        <div className="mb-2 flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-gray-900">Email</h2>
        </div>
        <div className="divide-y divide-gray-100">
          <Row
            label="Daily brief"
            description="One morning email: new leads, drafts waiting, leads going cold, today's meetings."
            checked={settings.daily_brief_enabled}
            onChange={(v) => void save({ daily_brief_enabled: v })}
          />
          <Row
            label="Instant hot-lead alerts"
            description="Email the moment a hot lead is created."
            checked={settings.notify_hot_lead_email}
            onChange={(v) => void save({ notify_hot_lead_email: v })}
          />
        </div>
        <div className="mt-4">
          <Button variant="outline" size="sm" onClick={() => void sendTestBrief()} loading={sendingTest}>
            <Send className="mr-1.5 h-4 w-4" /> Send me today&apos;s brief now
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-2 flex items-center gap-2">
          <PhoneMissed className="h-5 w-5 text-red-600" />
          <h2 className="text-base font-semibold text-gray-900">Missed-call text-back</h2>
        </div>
        <Row
          label="Auto-text callers you miss"
          description="When someone calls your business number and you can't answer, they instantly get a text. Requires a connected Twilio number."
          checked={settings.missed_call_text_back_enabled}
          onChange={(v) => void save({ missed_call_text_back_enabled: v })}
        />
        <label className="mt-2 block text-sm font-medium text-gray-900">Text message</label>
        <textarea
          defaultValue={settings.missed_call_message}
          maxLength={320}
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
          onBlur={(e) => {
            const v = e.target.value.trim();
            if (v && v !== settings.missed_call_message) void save({ missed_call_message: v });
          }}
        />
        <p className="mt-1 text-xs text-gray-400">Max 320 characters (2 SMS segments). Saved when you click away.</p>
      </Card>

      {message && <p className="text-sm text-gray-600">{message}</p>}
      {saving && <p className="text-sm text-gray-400">Saving…</p>}
    </div>
  );
}
```

- [ ] **Step 4: Link it from the settings index**

Open `src/app/(dashboard)/settings/page.tsx`. Locate the list/grid of settings links (existing entries include Slack, Webhooks, API Keys, Automation, Agency…). Append one more entry following the exact same JSX/object shape used by its siblings, with:
- href: `/settings/notifications`
- title: `Notifications`
- description: `Daily brief, hot-lead alerts, missed-call text-back`
- icon (if siblings have one): `Bell` from lucide-react (add to the existing lucide import)

- [ ] **Step 5: Verify + commit**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3004/settings/notifications
curl -s http://localhost:3004/api/settings/notifications
```
Expected: 200 + JSON with 5 fields. In the browser: toggle daily brief off → refresh → stays off; toggle back on.

```bash
npm run type-check
git add src/lib/validators/notifications.ts src/app/api/settings/notifications "src/app/(dashboard)/settings/notifications" "src/app/(dashboard)/settings/page.tsx"
git commit -m "feat(settings): notifications page — brief, alerts, missed-call config"
```

---

### Task 11: Instant hot-lead email alert

**Files:**
- Modify: `src/app/api/contacts/route.ts`

- [ ] **Step 1: Extend the existing hot-lead side-effect block**

In `src/app/api/contacts/route.ts`, find the existing block (~lines 89–107):
```typescript
if (data.temperature === "hot") {
  void (async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("slack_webhook_url, slack_notify_hot_leads")
        .eq("user_id", user.id)
        .single();
      if (profile?.slack_webhook_url && profile.slack_notify_hot_leads) {
        await sendSlackNotification(profile.slack_webhook_url, {
          text: `New hot lead: *${data.name ?? "Unknown"}* via ${data.source_channel ?? "manual"}`,
        });
      }
    } catch {
      // swallow
    }
  })();
}
```
Replace it with (same non-blocking pattern, now Slack + email):
```typescript
if (data.temperature === "hot") {
  void (async () => {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("slack_webhook_url, slack_notify_hot_leads, notify_hot_lead_email")
        .eq("user_id", user.id)
        .single();
      if (profile?.slack_webhook_url && profile.slack_notify_hot_leads) {
        await sendSlackNotification(profile.slack_webhook_url, {
          text: `New hot lead: *${data.name ?? "Unknown"}* via ${data.source_channel ?? "manual"}`,
        });
      }
      if (profile?.notify_hot_lead_email && process.env.RESEND_API_KEY) {
        const admin = createAdminClient();
        const { data: userRes } = await admin.auth.admin.getUserById(user.id);
        const email = userRes?.user?.email;
        if (email) {
          const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3004";
          await getResend().emails.send({
            from: "LeadFlow AI <noreply@leadflow.ai>",
            to: email,
            subject: `🔥 Hot lead: ${data.name ?? "Unknown"}`,
            html: `<p><strong>${data.name ?? "Unknown"}</strong> just came in as a hot lead via ${data.source_channel ?? "manual"}.</p><p><a href="${appUrl}/contacts/${data.id}">Open the lead →</a></p><p style="color:#9ca3af;font-size:12px;">Turn these off in Settings → Notifications.</p>`,
            text: `Hot lead: ${data.name ?? "Unknown"} via ${data.source_channel ?? "manual"} — ${appUrl}/contacts/${data.id}`,
          });
        }
      }
    } catch {
      // swallow — alerts must never fail contact creation
    }
  })();
}
```
Add the imports at the top of the file (keep existing ones):
```typescript
import { createAdminClient } from "@/lib/supabase/server";
import { getResend } from "@/lib/email/resend";
```
Note: if `createServerClient` is already imported from `@/lib/supabase/server`, extend that import line instead of adding a duplicate. If the existing block scopes by a different variable than `user.id` (e.g. `ctx.ownerId`), keep whatever the current code uses.

- [ ] **Step 2: Smoke it**

```bash
curl -s -X POST http://localhost:3004/api/contacts \
  -H 'Content-Type: application/json' \
  -d '{"name":"Hot Alert Test","status":"new"}' | head -c 300
```
Then PUT temperature hot is not the trigger — creation is; so instead create hot directly if the create schema allows temperature; if not (createContactSchema has no temperature field), the block only fires for AI/webhook-created hot contacts. Verify behavior: with RESEND_API_KEY unset locally, the email branch is skipped silently (guard) — confirm no error in dev-server logs and contact creation still 201.

- [ ] **Step 3: Type-check and commit**

```bash
npm run type-check
git add src/app/api/contacts/route.ts
git commit -m "feat(alerts): instant hot-lead email alongside Slack ping"
```

---

### Task 12: Missed-call auto-text-back (TDD on the decision)

**Files:**
- Create: `src/lib/webhooks/missed-call.ts`
- Test: `src/lib/webhooks/missed-call.test.ts`
- Modify: `src/app/api/webhooks/twilio/voice/route.ts`

**Design note:** The app cannot answer calls, so v1 semantics: **every inbound call to the connected number is a missed call.** Owner resolution: match `To` (the called Twilio number) against `profiles.twilio_phone_number`. Guard rails: skip anonymous callers, 60-minute per-contact cooldown (dedupes Twilio webhook retries + rapid re-calls), always log the missed call as an inbound message even when no text is sent, always return valid TwiML even on internal failure. SMS is sent via the Twilio SDK directly (`from` must be the called number; the adapter's `OutboundMessage` has no `from` field).

- [ ] **Step 1: Write the failing test**

`src/lib/webhooks/missed-call.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import { shouldSendTextBack } from "./missed-call";

const NOW = new Date("2026-06-30T10:00:00.000Z");

describe("shouldSendTextBack", () => {
  it("sends when enabled, caller known, no recent auto-text", () => {
    const d = shouldSendTextBack({ enabled: true, fromNumber: "+61400111222", toNumber: "+61255501234", lastAutoTextAt: null, now: NOW });
    expect(d.send).toBe(true);
  });

  it("does not send when the feature is disabled", () => {
    const d = shouldSendTextBack({ enabled: false, fromNumber: "+61400111222", toNumber: "+61255501234", lastAutoTextAt: null, now: NOW });
    expect(d.send).toBe(false);
    expect(d.reason).toBe("disabled");
  });

  it("does not send to anonymous/withheld callers", () => {
    for (const from of [null, "", "anonymous", "Anonymous", "+266696687", "unavailable"]) {
      const d = shouldSendTextBack({ enabled: true, fromNumber: from, toNumber: "+61255501234", lastAutoTextAt: null, now: NOW });
      expect(d.send).toBe(false);
    }
  });

  it("does not send without a destination business number", () => {
    const d = shouldSendTextBack({ enabled: true, fromNumber: "+61400111222", toNumber: null, lastAutoTextAt: null, now: NOW });
    expect(d.send).toBe(false);
  });

  it("respects the 60-minute cooldown", () => {
    const recent = new Date(NOW.getTime() - 30 * 60 * 1000).toISOString();
    const d = shouldSendTextBack({ enabled: true, fromNumber: "+61400111222", toNumber: "+61255501234", lastAutoTextAt: recent, now: NOW });
    expect(d.send).toBe(false);
    expect(d.reason).toBe("cooldown");
  });

  it("sends again after the cooldown expires", () => {
    const old = new Date(NOW.getTime() - 61 * 60 * 1000).toISOString();
    const d = shouldSendTextBack({ enabled: true, fromNumber: "+61400111222", toNumber: "+61255501234", lastAutoTextAt: old, now: NOW });
    expect(d.send).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test -- src/lib/webhooks/missed-call.test.ts`
Expected: FAIL — cannot resolve `./missed-call`.

- [ ] **Step 3: Implement the pure decision**

`src/lib/webhooks/missed-call.ts`:
```typescript
// Pure decision logic for missed-call auto-text-back. No DB, no Twilio — unit-tested.

export const TEXT_BACK_COOLDOWN_MS = 60 * 60 * 1000; // one auto-text per contact per hour

// Twilio sends these placeholders for withheld caller IDs.
const ANONYMOUS_VALUES = new Set(["anonymous", "unavailable", "restricted", "unknown", "+266696687"]);

export interface TextBackDecisionInput {
  enabled: boolean;
  fromNumber: string | null;
  toNumber: string | null;
  lastAutoTextAt: string | null; // ISO timestamp of the last auto-text to this contact
  now: Date;
}

export interface TextBackDecision {
  send: boolean;
  reason: "ok" | "disabled" | "anonymous_caller" | "no_destination" | "cooldown";
}

export function shouldSendTextBack(input: TextBackDecisionInput): TextBackDecision {
  if (!input.enabled) return { send: false, reason: "disabled" };

  const from = (input.fromNumber ?? "").trim();
  if (!from || ANONYMOUS_VALUES.has(from.toLowerCase()) || !/^\+?\d{6,15}$/.test(from)) {
    return { send: false, reason: "anonymous_caller" };
  }

  if (!input.toNumber || !input.toNumber.trim()) {
    return { send: false, reason: "no_destination" };
  }

  if (input.lastAutoTextAt) {
    const last = new Date(input.lastAutoTextAt).getTime();
    if (Number.isFinite(last) && input.now.getTime() - last < TEXT_BACK_COOLDOWN_MS) {
      return { send: false, reason: "cooldown" };
    }
  }

  return { send: true, reason: "ok" };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `npm test -- src/lib/webhooks/missed-call.test.ts`
Expected: 6 passed.

- [ ] **Step 5: Rewrite the voice webhook**

Replace the full contents of `src/app/api/webhooks/twilio/voice/route.ts` with:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { validateRequest } from "twilio/lib/webhooks/webhooks";
import twilio from "twilio";
import { createAdminClient } from "@/lib/supabase/server";
import { findOrCreateContact } from "@/lib/contacts/find-or-create";
import { shouldSendTextBack } from "@/lib/webhooks/missed-call";

function twiml(say: string): NextResponse {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${say}</Say>
</Response>`;
  return new NextResponse(xml, { headers: { "Content-Type": "text/xml" } });
}

const STUB_GREETING =
  "Thank you for calling. Our AI assistant is not yet configured. Please try again later.";
const TEXT_BACK_GREETING =
  "Sorry we can't take your call right now. We've just sent you a text message so we can help you straight away.";

export async function POST(request: NextRequest) {
  const body = await request.text();

  // Parse form-encoded body into params object for signature verification
  const params: Record<string, string> = {};
  const searchParams = new URLSearchParams(body);
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }

  // Verify Twilio signature (unchanged from the previous stub)
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const signature = request.headers.get("x-twilio-signature") || "";
  const shouldSkip = process.env.NODE_ENV !== "production" && !authToken;
  if (!shouldSkip) {
    if (!authToken || !signature) {
      return new Response("Forbidden", { status: 403 });
    }
    const isValid = validateRequest(authToken, signature, request.url, params);
    if (!isValid) {
      return new Response("Forbidden", { status: 403 });
    }
  }

  const from = params.From ?? null;
  const to = params.To ?? null;
  console.log(`[Twilio Voice] inbound call from=${from} to=${to} status=${params.CallStatus ?? ""}`);

  try {
    const admin = createAdminClient();

    // Resolve which tenant owns the called number.
    let profile: {
      user_id: string;
      missed_call_text_back_enabled: boolean;
      missed_call_message: string;
    } | null = null;

    if (to) {
      const { data } = await admin
        .from("profiles")
        .select("user_id, missed_call_text_back_enabled, missed_call_message")
        .eq("twilio_phone_number", to)
        .maybeSingle();
      profile = data;
    }
    if (!profile && process.env.TWILIO_PHONE_NUMBER && to === process.env.TWILIO_PHONE_NUMBER) {
      // Env-configured single-tenant fallback: the one profile with the feature on.
      const { data } = await admin
        .from("profiles")
        .select("user_id, missed_call_text_back_enabled, missed_call_message")
        .eq("missed_call_text_back_enabled", true)
        .limit(1)
        .maybeSingle();
      profile = data;
    }

    if (!profile) {
      return twiml(STUB_GREETING);
    }

    // Find or create the caller as a contact (dedupes by phone).
    const { contactId } = await findOrCreateContact({
      userId: profile.user_id,
      supabase: admin,
      phone: from ?? undefined,
      sourceChannel: "voice",
    });

    // Cooldown check: last auto-text to this contact.
    const { data: lastAuto } = await admin
      .from("messages")
      .select("created_at")
      .eq("user_id", profile.user_id)
      .eq("contact_id", contactId)
      .eq("direction", "outbound")
      .contains("metadata", { auto_text_back: true })
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const decision = shouldSendTextBack({
      enabled: profile.missed_call_text_back_enabled,
      fromNumber: from,
      toNumber: to,
      lastAutoTextAt: lastAuto?.created_at ?? null,
      now: new Date(),
    });

    // Find or create an SMS conversation keyed by the caller's number.
    let conversationId: string;
    const { data: existingConv } = await admin
      .from("conversations")
      .select("id")
      .eq("user_id", profile.user_id)
      .eq("contact_id", contactId)
      .eq("channel_type", "sms")
      .order("last_message_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (existingConv) {
      conversationId = existingConv.id;
    } else {
      const { data: newConv, error: convError } = await admin
        .from("conversations")
        .insert({
          user_id: profile.user_id,
          contact_id: contactId,
          channel_type: "sms",
          external_thread_id: from,
          status: "active",
          is_ai_active: true,
          last_message_at: new Date().toISOString(),
        })
        .select("id")
        .single();
      if (convError || !newConv) {
        throw new Error(`Failed to create conversation: ${convError?.message ?? "unknown"}`);
      }
      conversationId = newConv.id;
    }

    // Always log the missed call as an inbound event (visible in the thread).
    await admin.from("messages").insert({
      user_id: profile.user_id,
      conversation_id: conversationId,
      contact_id: contactId,
      direction: "inbound",
      sender_type: "contact",
      content: "📞 Missed call",
      content_type: "text",
      channel_type: "voice",
      metadata: { missed_call: true, call_from: from, call_to: to },
    });

    if (decision.send && from && to) {
      const messageText =
        profile.missed_call_message ||
        "Sorry we missed your call! Reply here and we'll help you right away.";

      // Direct SDK call: the reply must come FROM the number that was called.
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
      if (accountSid && twilioAuthToken) {
        const client = twilio(accountSid, twilioAuthToken);
        const result = await client.messages.create({ to: from, from: to, body: messageText });

        await admin.from("messages").insert({
          user_id: profile.user_id,
          conversation_id: conversationId,
          contact_id: contactId,
          direction: "outbound",
          sender_type: "ai",
          content: messageText,
          content_type: "text",
          channel_type: "sms",
          external_message_id: result.sid,
          metadata: { auto_text_back: true, call_from: from },
        });
      } else {
        console.warn("[Twilio Voice] text-back skipped: TWILIO_ACCOUNT_SID/AUTH_TOKEN not configured");
      }
    } else {
      console.log(`[Twilio Voice] no text-back (${decision.reason})`);
    }

    // Freshen activity timestamps + notify the owner in-app.
    const nowIso = new Date().toISOString();
    await Promise.all([
      admin.from("conversations").update({ last_message_at: nowIso }).eq("id", conversationId),
      admin.from("contacts").update({ last_interaction_at: nowIso }).eq("id", contactId),
      admin.from("notifications").insert({
        user_id: profile.user_id,
        type: "new_message",
        title: decision.send ? "Missed call — auto-text sent" : "Missed call",
        body: `Call from ${from ?? "unknown number"}${decision.send ? ". We texted them back automatically." : "."}`,
        link: `/conversations/${conversationId}`,
      }),
    ]);

    return twiml(profile.missed_call_text_back_enabled ? TEXT_BACK_GREETING : STUB_GREETING);
  } catch (error) {
    // A webhook must never 500 back to Twilio with a broken call experience.
    console.error("[Twilio Voice] handler error", error);
    return twiml(STUB_GREETING);
  }
}
```

- [ ] **Step 6: Smoke it locally (no Twilio account needed)**

Locally `TWILIO_AUTH_TOKEN` is unset → signature check skipped, and the SMS send branch logs `text-back skipped` (SID/token missing) — everything else (contact, conversation, messages, notification) executes for real.

First enable the feature for the dev profile and set its number:
```bash
docker exec -i supabase_db_Lead_to_Customer psql -U postgres -d postgres -c \
  "UPDATE profiles SET missed_call_text_back_enabled = true, twilio_phone_number = '+61255501234' WHERE user_id = '784e8466-82e2-4f57-a68b-1e289b62b54a';"
```
Then simulate a call:
```bash
curl -s -X POST http://localhost:3004/api/webhooks/twilio/voice \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  --data 'From=%2B61400111222&To=%2B61255501234&CallStatus=ringing&CallSid=CAtest123'
```
Expected: TwiML containing "We've just sent you a text message". Verify DB:
```bash
docker exec -i supabase_db_Lead_to_Customer psql -U postgres -d postgres -c "
SELECT name, phone, source_channel FROM contacts WHERE phone = '+61400111222';
SELECT direction, sender_type, channel_type, content, metadata FROM messages m
  JOIN contacts c ON c.id = m.contact_id WHERE c.phone = '+61400111222' ORDER BY m.created_at;
SELECT type, title FROM notifications ORDER BY created_at DESC LIMIT 1;"
```
Expected: 1 contact (source_channel `voice`); an inbound `📞 Missed call` message (no outbound row locally since Twilio creds absent — correct); a `Missed call` notification. Fire the same curl again immediately → still only one missed-call message per call (a second inbound row IS expected — each call logs), and text-back decision would be `cooldown` had a text been sent. Check the dashboard notification bell shows the missed-call entry (realtime).

- [ ] **Step 7: Type-check and commit**

```bash
npm run type-check
git add src/lib/webhooks/missed-call.ts src/lib/webhooks/missed-call.test.ts src/app/api/webhooks/twilio/voice/route.ts
git commit -m "feat(calls): missed-call auto-text-back with cooldown, logging, in-app notification"
```

---

### Task 13: Analytics tabs + nav simplification

**Files:**
- Create: `src/app/(dashboard)/analytics/layout.tsx`
- Modify: `src/components/layout/sidebar.tsx`
- Modify: `src/components/layout/mobile-nav.tsx` (conditional)

- [ ] **Step 1: Analytics tab layout**

`src/app/(dashboard)/analytics/layout.tsx`:
```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/analytics", label: "Overview" },
  { href: "/analytics/funnel", label: "Funnel" },
  { href: "/analytics/team", label: "Team" },
];

export default function AnalyticsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div>
      <nav className="mb-6 flex gap-6 border-b border-gray-200">
        {tabs.map((t) => {
          const active = t.href === "/analytics" ? pathname === "/analytics" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              className={`-mb-px border-b-2 pb-2 text-sm font-medium transition-colors ${
                active
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-800"
              }`}
            >
              {t.label}
            </Link>
          );
        })}
      </nav>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Remove the now-redundant header cross-links**

In `src/app/(dashboard)/analytics/page.tsx`, find the header links "Team Analytics →" and "Funnel →" and delete them (the tab bar replaces them). Leave everything else untouched.

- [ ] **Step 3: Sidebar rework**

In `src/components/layout/sidebar.tsx`, the current array is exactly:
```typescript
const navItems: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/channels", label: "Channels", icon: Radio },
  { href: "/broadcasts", label: "Broadcasts", icon: Megaphone },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/system-flow", label: "System Flow", icon: GitBranch },
  { href: "/app-pages", label: "App Pages", icon: Map },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: Shield },
];
```
Replace with (daily loop first; Approvals finally reachable; System Flow + App Pages dropped from nav — pages stay URL-accessible):
```typescript
const navItems: NavItem[] = [
  { href: "/dashboard", label: "Today", icon: LayoutDashboard },
  { href: "/conversations", label: "Conversations", icon: MessageSquare },
  { href: "/approvals", label: "Approvals", icon: ClipboardCheck },
  { href: "/contacts", label: "Contacts", icon: Users },
  { href: "/bookings", label: "Bookings", icon: CalendarCheck },
  { href: "/broadcasts", label: "Broadcasts", icon: Megaphone },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/channels", label: "Channels", icon: Radio },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Admin", icon: Shield },
];
```
Update the lucide-react import: add `ClipboardCheck`, remove `GitBranch` and `Map` (only if nothing else in the file uses them).

- [ ] **Step 4: MobileNav**

Open `src/components/layout/mobile-nav.tsx`. If it has its own item list: relabel Dashboard → "Today"; if it lists System Flow/App Pages, remove them; keep it to at most 5 items (typical bottom-nav constraint) prioritized as Today, Conversations, Contacts, Bookings, Settings. If it imports the sidebar's array, no change needed.

- [ ] **Step 5: Verify + commit**

```bash
for p in /dashboard /analytics /analytics/funnel /analytics/team /approvals; do
  echo -n "$p "; curl -s -o /dev/null -w "%{http_code}\n" "http://localhost:3004$p"; done
```
Expected: all 200. Browser: tab bar shows on all three analytics pages with correct active state; sidebar shows Today + Approvals; System Flow/App Pages gone from nav but `/system-flow` still loads by URL.

```bash
npm run type-check
git add "src/app/(dashboard)/analytics/layout.tsx" "src/app/(dashboard)/analytics/page.tsx" src/components/layout/sidebar.tsx src/components/layout/mobile-nav.tsx
git commit -m "feat(nav): analytics tabs, Approvals in sidebar, daily-loop nav order"
```

---

### Task 14: Full QA gate + docs + push

**Files:**
- Modify: `CLAUDE.md`, `DEPLOY-RUNBOOK.md`

- [ ] **Step 1: Full test + lint + type sweep**

```bash
npm test
npm run type-check
npm run lint
```
Expected: all previous 59 tests + ~18 new ones green (follow-ups 5, today 3, daily-brief 4, missed-call 6); tsc zero errors; lint zero NEW errors (pre-existing warnings acceptable).

- [ ] **Step 2: Production build**

**Stop the dev server first** (building while `next dev` runs corrupts `.next`):
```bash
npm run build
```
Expected: zero errors; new routes listed: `/api/follow-ups`, `/api/follow-ups/[id]`, `/api/dashboard/today`, `/api/ai/approvals/[id]/act`, `/api/cron/daily-brief`, `/api/digest/daily/send`, `/api/settings/notifications`, `/settings/notifications`. Restart dev after: `npm run dev`.

- [ ] **Step 3: End-to-end smoke (the daily loop)**

With dev server running:
1. `/dashboard` → Today card: all five sections render; add + complete a follow-up.
2. Simulate a missed call (Task 12 curl) → notification bell shows "Missed call"; conversation thread contains 📞 event.
3. Seed a pending approval (Task 8 SQL) → shows in Today card + `/approvals`; one-tap POST approves it.
4. `curl -s -X POST http://localhost:3004/api/cron/daily-brief -H "Authorization: Bearer $SECRET"` → sent/skipped/failed JSON (or the documented 503 without RESEND_API_KEY).
5. `/settings/notifications` → toggles persist.
6. `/analytics` tabs navigate.

- [ ] **Step 4: Update docs**

- `CLAUDE.md` → "What's Been Done": append one `[2026-06-30]` bullet summarizing: Today command center, follow_ups CRUD, daily brief (builder+cron+send-now), one-tap email approvals (confirm-page pattern, action_token), hot-lead email alert, missed-call auto-text-back (v1 semantics: every inbound call = missed; cooldown 60m; needs Twilio creds + public URL to fire for real), analytics tabs + nav rework, migration `20260630000001` (migrations now 26).
- `DEPLOY-RUNBOOK.md`: migration count 25 → 26; add `CRON_SECRET` to required env vars ("cron routes fail closed without it"); note `vercel.json` now exists with the daily-brief cron; note missed-call text-back requires `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/number + the voice webhook URL configured on the Twilio number.

- [ ] **Step 5: Final commit + push**

```bash
git add CLAUDE.md DEPLOY-RUNBOOK.md
git commit -m "docs: daily-retention rework — runbook + changelog"
git push
```

---

## Self-review checklist (run before declaring done)

1. **RLS-in-dev caveat:** everything ran under SKIP_AUTH (service-role) locally — the follow_ups policy and notification-insert paths are written for prod RLS but not exercised by it. Flag in the final report.
2. **Known deliberate limits:** missed-call fires on *every* inbound call (no ring-through — the app has no call forwarding); brief timezone DST skew ≤1h; email one-tap needs two taps (scanner safety); Vercel cron + real SMS only work once deployed + Twilio connected.
3. **Type consistency spot-checks:** `action_token` selected everywhere it's used (`daily-brief.ts`, `act/route.ts`); `follow_ups.completed_at` (not `completed`) in DB while the API accepts `completed: boolean`; `bounds.dateStr` matches `bookings.booking_date` format.
