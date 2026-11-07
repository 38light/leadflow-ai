#!/usr/bin/env node
// Explicit environment only: never loads .env.local or discovers credentials.
// Required: NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_SUPABASE_URL,
// NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, PILOT_QA_PROJECT_REF.
// Optional: PILOT_QA_REALTIME=true verifies an authenticated INSERT subscription.
// Creates two disposable confirmed users without sending invitations/email.
// Uses synthetic text, disables fixture AI before chat, and cleans up in finally.
import { randomBytes, randomUUID } from 'node:crypto';
import { isIP } from 'node:net';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';

class QAError extends Error {}
const runId = randomUUID();
const users = [];
const clients = [];
const storagePaths = [];
let admin;
let checks = 0;
let stage = 'Validate explicit hosted environment';
let failed = false;

function requireValue(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new QAError(`Missing required environment variable: ${name}`);
  return value;
}

function hostedOrigin(raw, name) {
  let url;
  try { url = new URL(raw); } catch { throw new QAError(`${name} must be an HTTPS origin`); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port
      || url.pathname !== '/' || url.search || url.hash || isIP(url.hostname)
      || !url.hostname.includes('.') || /(^|\.)(localhost|local|test|invalid)$/.test(url.hostname)) {
    throw new QAError(`${name} must be a hosted HTTPS origin without credentials, path, or port`);
  }
  return url;
}

function checkLegacyKey(key, role, ref) {
  if (key.startsWith(role === 'anon' ? 'sb_publishable_' : 'sb_secret_')) return;
  try {
    const payload = JSON.parse(Buffer.from(key.split('.')[1], 'base64url').toString('utf8'));
    if (key.split('.').length === 3 && payload.role === role && payload.ref === ref) return;
  } catch { /* Never print keys or their decoded payloads. */ }
  throw new QAError(`Supabase ${role} key has the wrong format, role, or project reference`);
}

function ok(condition, label) {
  if (!condition) throw new QAError(label);
  checks += 1;
  console.log(`PASS ${label}`);
}

async function unwrap(operation, label) {
  stage = label;
  const result = await operation;
  if (result.error) throw new QAError(label);
  return result.data;
}

// All SDK HTTP requests are pinned to the explicitly authorized Supabase origin.
// Do not follow redirects with API keys, passwords, or session cookies attached.
function boundedFetch(origin) {
  return async (input, init = {}) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    if (url.origin !== origin) throw new QAError('Refused a request outside the authorized origin');
    const timeout = AbortSignal.timeout(20_000);
    return fetch(input, {
      ...init, redirect: 'manual',
      signal: init.signal ? AbortSignal.any([init.signal, timeout]) : timeout,
    });
  };
}

function saveCookies(jar, values) {
  for (const { name, value, options } of values) {
    if (!value || options?.maxAge === 0) jar.delete(name);
    else jar.set(name, value);
  }
}

function readResponseCookies(jar, headers) {
  for (const cookie of headers.getSetCookie()) {
    const [pair, ...attributes] = cookie.split(';');
    const separator = pair.indexOf('=');
    if (separator < 1) continue;
    const name = pair.slice(0, separator).trim();
    const value = pair.slice(separator + 1);
    const expired = attributes.some(attribute => /^\s*max-age=0\s*$/i.test(attribute));
    if (!value || expired) jar.delete(name);
    else jar.set(name, value);
  }
}

async function account(label, url, anonKey, fetcher) {
  stage = `Create disposable ${label} account`;
  const password = `Qa!9-${randomBytes(24).toString('base64url')}`;
  const email = `pilot-qa-${label}-${runId}@example.com`;
  const created = await admin.auth.admin.createUser({
    email, password, email_confirm: true,
    user_metadata: { pilot_qa_run: runId, full_name: `Pilot QA ${label}` },
  });
  // Retain any returned ID even when the server also reports an error.
  if (created.data?.user?.id) users.push(created.data.user.id);
  if (created.error || !created.data?.user?.id) throw new QAError(`Create disposable ${label} account`);
  const id = created.data.user.id;
  const profile = await unwrap(admin.from('profiles').update({
    business_name: `Pilot QA ${label}`, ai_enabled: false, require_approval: true, timezone: 'UTC',
  }).eq('user_id', id).select('user_id,ai_enabled').single(), `Disable AI for disposable ${label}`);
  if (profile.user_id !== id || profile.ai_enabled !== false) throw new QAError('Fixture AI was not disabled');
  const jar = new Map();
  const client = createServerClient(url, anonKey, {
    global: { fetch: fetcher },
    auth: { autoRefreshToken: false, debug: false },
    realtime: { logger: () => {} },
    cookies: {
      getAll: () => [...jar].map(([name, value]) => ({ name, value })),
      setAll: values => saveCookies(jar, values),
    },
  });
  clients.push(client);
  const signedIn = await unwrap(client.auth.signInWithPassword({ email, password }), `Sign in disposable ${label}`);
  ok(signedIn.session?.user.id === id && jar.size > 0, `${label} authenticates with SSR session cookies`);
  return { id, client, jar };
}

async function verifyRealtime(owner) {
  stage = 'Receive authenticated Realtime INSERT';
  const id = randomUUID();
  let joinedResolve, joinedReject, receivedResolve, receivedReject;
  const joined = new Promise((resolve, reject) => { joinedResolve = resolve; joinedReject = reject; });
  const received = new Promise((resolve, reject) => { receivedResolve = resolve; receivedReject = reject; });
  // Both promises may reject together; attach handlers before awaiting either.
  joined.catch(() => {});
  received.catch(() => {});
  const fail = () => {
    joinedReject(new QAError('Realtime subscription or receipt failed within ten seconds'));
    receivedReject(new QAError('Realtime subscription or receipt failed within ten seconds'));
  };
  const timer = setTimeout(fail, 10_000);
  const channel = owner.client.channel(`pilot-qa-${runId}`).on('postgres_changes', {
    event: 'INSERT', schema: 'public', table: 'contacts', filter: `user_id=eq.${owner.id}`,
  }, payload => {
    if (payload.new.id === id && payload.new.user_id === owner.id) receivedResolve();
  });
  try {
    const session = await unwrap(owner.client.auth.getSession(), 'Read fixture session for Realtime');
    if (!session.session) throw new QAError('Realtime fixture has no authenticated session');
    await owner.client.realtime.setAuth(session.session.access_token);
    channel.subscribe(status => {
      if (status === 'SUBSCRIBED') joinedResolve();
      else if (['CHANNEL_ERROR', 'TIMED_OUT', 'CLOSED'].includes(status)) fail();
    });
    await joined;
    await unwrap(owner.client.from('contacts').insert({ id, user_id: owner.id, name: 'Pilot QA realtime', source_channel: 'manual' }), 'Insert fixture for Realtime');
    await received;
    ok(true, 'Authenticated Realtime receives its own contact INSERT');
  } finally {
    clearTimeout(timer);
    await owner.client.removeChannel(channel);
  }
}

try {
  const app = hostedOrigin(requireValue('NEXT_PUBLIC_APP_URL'), 'NEXT_PUBLIC_APP_URL');
  const supabase = hostedOrigin(requireValue('NEXT_PUBLIC_SUPABASE_URL'), 'NEXT_PUBLIC_SUPABASE_URL');
  const ref = supabase.hostname.match(/^([a-z0-9]{20})\.supabase\.co$/)?.[1];
  if (!ref || requireValue('PILOT_QA_PROJECT_REF') !== ref) {
    throw new QAError('PILOT_QA_PROJECT_REF must exactly match the hosted Supabase URL project reference');
  }
  const anonKey = requireValue('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const serviceKey = requireValue('SUPABASE_SERVICE_ROLE_KEY');
  checkLegacyKey(anonKey, 'anon', ref);
  checkLegacyKey(serviceKey, 'service_role', ref);
  if (!['', 'true', 'false'].includes(process.env.PILOT_QA_REALTIME ?? '')) {
    throw new QAError('PILOT_QA_REALTIME must be true or false when supplied');
  }
  const appFetch = boundedFetch(app.origin);
  const supabaseFetch = boundedFetch(supabase.origin);
  console.log(`Hosted pilot QA run ${runId}; project ${ref}. Disposable fixtures only.`);

  async function request(path, { method = 'GET', body, user, html = false } = {}) {
    stage = `${method} ${path}`;
    const response = await appFetch(`${app.origin}${path}`, {
      method,
      headers: {
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...(user ? { Cookie: [...user.jar].map(([name, value]) => `${name}=${value}`).join('; ') } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (user) readResponseCookies(user.jar, response.headers);
    return { status: response.status, body: html ? await response.text() : await response.json().catch(() => null) };
  }

  let result = await request('/login', { html: true });
  ok(result.status === 200 && /Welcome back/.test(result.body) && /Access is by invitation/.test(result.body), 'Hosted login is invitation-only');
  result = await request('/register', { html: true });
  ok(result.status === 200 && /Join by invitation/.test(result.body) && !/<form\b/i.test(result.body), 'Hosted registration exposes no signup form');
  ok((await request('/api/dashboard/today')).status === 401, 'Anonymous Today request requires authentication');
  stage = 'Inspect hosted Auth settings without signing up';
  const settingsResponse = await supabaseFetch(`${supabase.origin}/auth/v1/settings`, { headers: { apikey: anonKey } });
  const settings = await settingsResponse.json().catch(() => null);
  ok(settingsResponse.ok && settings?.disable_signup === true, 'Hosted Auth disables public signup');

  admin = createClient(supabase.origin, serviceKey, {
    global: { fetch: supabaseFetch }, auth: { persistSession: false, autoRefreshToken: false, debug: false },
    realtime: { logger: () => {} },
  });
  const owner = await account('owner', supabase.origin, anonKey, supabaseFetch);
  const other = await account('other', supabase.origin, anonKey, supabaseFetch);
  result = await request('/api/dashboard/today', { user: owner });
  ok(result.status === 200 && result.body?.data?.currentUserId === owner.id && result.body.data.canEdit === true
    && result.body.data.needsReply.length === 0 && result.body.data.approvals.length === 0,
  'Hosted app recognizes the authorized project and empty fixture workspace');

  result = await request('/api/chat/init', { method: 'POST', body: { businessId: owner.id } });
  ok(result.status === 200 && typeof result.body?.sessionId === 'string', 'Visitor starts a durable chat session');
  const credentials = { businessId: owner.id, sessionId: result.body.sessionId };
  const message = { ...credentials, content: `Pilot QA visitor question ${runId}`, senderName: 'Pilot QA Visitor', clientMessageId: randomUUID() };
  result = await request('/api/chat/message', { method: 'POST', body: message });
  ok(result.status === 200 && result.body?.data?.accepted === true && result.body.data.status === 'awaiting_reply', 'AI-disabled visitor message is durably accepted');
  const inbound = await unwrap(admin.from('messages').select('id,conversation_id,contact_id')
    .eq('id', result.body.data.messageId).eq('user_id', owner.id).single(), 'Read exact fixture inbound receipt');
  result = await request('/api/chat/message', { method: 'POST', body: message });
  const inboundRows = await unwrap(owner.client.from('messages').select('id').eq('user_id', owner.id)
    .eq('conversation_id', inbound.conversation_id).eq('direction', 'inbound'), 'Check fixture retry persistence');
  ok(result.status === 200 && result.body?.data?.messageId === inbound.id && inboundRows.length === 1, 'Visitor retry persists exactly one inbound message');
  result = await request('/api/dashboard/today', { user: owner });
  ok(result.status === 200 && result.body?.data?.needsReply.some(row => row.id === inbound.conversation_id), 'Unanswered visitor appears on Today');
  ok((await request('/api/chat/messages', { method: 'POST', body: { ...credentials, businessId: other.id } })).status === 401,
    'Visitor session cannot cross business boundaries');
  const otherContacts = await unwrap(other.client.from('contacts').select('id').eq('id', inbound.contact_id), 'Check cross-business contact RLS');
  ok(otherContacts.length === 0 && (await request(`/api/contacts/${inbound.contact_id}`, { user: other })).status === 404,
    'Other business cannot read the visitor contact through RLS or API');

  const draftContent = `Private pilot QA draft ${runId}`;
  const approval = await unwrap(admin.from('ai_approvals').insert({
    user_id: owner.id, contact_id: inbound.contact_id, conversation_id: inbound.conversation_id,
    draft_content: draftContent, reasoning: 'Synthetic QA fixture; no AI model called', status: 'pending',
  }).select('id').single(), 'Create private synthetic approval fixture');
  result = await request('/api/chat/messages', { method: 'POST', body: credentials });
  ok(result.status === 200 && result.body?.data?.messages.length === 1
    && result.body.data.messages[0].id === inbound.id && !JSON.stringify(result.body).includes(draftContent),
  'Visitor polling never exposes the unapproved draft');
  result = await request('/api/dashboard/today', { user: owner });
  ok(result.status === 200 && result.body?.data?.approvals.some(row => row.id === approval.id && row.draftContent === draftContent),
    'Private approval appears in the owner Today queue');
  ok((await request(`/api/ai/approvals/${approval.id}`, { method: 'POST', user: other, body: { action: 'approve' } })).status === 404,
    'Other business cannot approve the private reply');
  const approvedContent = `Approved pilot QA reply ${runId}`;
  result = await request(`/api/ai/approvals/${approval.id}`, { method: 'POST', user: owner, body: { action: 'approve', edited_content: approvedContent } });
  ok(result.status === 200, 'Owner approves the edited web-chat reply');
  result = await request('/api/chat/messages', { method: 'POST', body: credentials });
  const outbound = result.body?.data?.messages?.filter(row => row.direction === 'outbound');
  ok(result.status === 200 && outbound?.length === 1 && outbound[0].content === approvedContent, 'Approved reply reaches the original visitor exactly once');
  const delivered = await unwrap(owner.client.from('messages').select('delivered_at').eq('id', outbound[0].id)
    .eq('user_id', owner.id).single(), 'Read exact fixture delivery receipt');
  ok(Boolean(delivered.delivered_at), 'Visitor polling records actual delivery');

  result = await request('/api/follow-ups', { method: 'POST', user: owner, body: {
    contact_id: inbound.contact_id, title: 'Pilot QA next step', due_at: new Date(Date.now() - 60_000).toISOString(),
  } });
  ok(result.status === 201 && result.body?.data?.status === 'pending' && result.body.data.assigned_to === owner.id, 'Owner creates a persisted follow-up');
  const followUp = result.body.data;
  const foreignTasks = await unwrap(other.client.from('follow_ups').select('id').eq('id', followUp.id), 'Check cross-business follow-up RLS');
  ok(foreignTasks.length === 0, 'Other business cannot read the follow-up');
  result = await request(`/api/follow-ups/${followUp.id}`, { method: 'PATCH', user: owner, body: {
    status: 'completed', expected_updated_at: followUp.updated_at,
  } });
  ok(result.status === 200 && result.body?.data?.status === 'completed' && Boolean(result.body.data.completed_at), 'Follow-up completion is stamped by the database');
  result = await request(`/api/follow-ups/${followUp.id}`, { method: 'PATCH', user: owner, body: {
    title: 'Stale change', expected_updated_at: followUp.updated_at,
  } });
  ok(result.status === 409, 'Stale follow-up edits cannot overwrite completed work');
  result = await request('/api/dashboard/today', { user: owner });
  ok(result.status === 200 && result.body?.data?.completedToday === 1 && result.body.data.needsReply.length === 0
    && result.body.data.approvals.length === 0 && result.body.data.followUps.length === 0, 'Today reflects completed work and delivered replies');
  result = await request('/api/dashboard/onboarding', { user: owner });
  const requiredSteps = ['profile_complete', 'first_visitor_message', 'first_delivered_reply', 'first_follow_up'];
  ok(result.status === 200 && result.body?.data?.allDone === true && result.body.data.percent === 100
    && result.body.data.items.length === 4 && requiredSteps.every(key => result.body.data.items.some(item => item.key === key && item.done)),
  'All four onboarding steps complete from real persisted activity');

  const bucket = await unwrap(admin.storage.getBucket('knowledge-docs'), 'Read private knowledge bucket configuration');
  ok(bucket.public === false, 'Knowledge storage bucket is private');
  const base = await unwrap(owner.client.from('knowledge_bases').insert({ user_id: owner.id, name: `Pilot QA ${runId}` })
    .select('id').single(), 'Create owner knowledge-base fixture');
  const filePath = `${owner.id}/${base.id}/pilot-qa-${runId}.txt`;
  const fileContent = `Synthetic private pilot QA document ${runId}`;
  storagePaths.push(filePath);
  await unwrap(owner.client.storage.from('knowledge-docs').upload(filePath, Buffer.from(fileContent), { contentType: 'text/plain', upsert: false }), 'Upload owner-scoped text fixture');
  ok(true, 'Owner uploads a file under its own knowledge-base path');
  const ownFile = await unwrap(owner.client.storage.from('knowledge-docs').download(filePath), 'Download own private text fixture');
  ok(await ownFile.text() === fileContent, 'Owner can read the private uploaded file');
  stage = 'Reject cross-business storage download';
  const foreignFile = await other.client.storage.from('knowledge-docs').download(filePath);
  ok([400, 403, 404].includes(Number(foreignFile.error?.status)) && foreignFile.data === null,
    'Other business cannot read the private file');

  if (process.env.PILOT_QA_REALTIME === 'true') await verifyRealtime(owner);
  else console.log('SKIP optional Realtime receipt (set PILOT_QA_REALTIME=true to include it).');
} catch (error) {
  failed = true;
  // SDK/network errors can contain request data. Only print our static labels.
  console.error(`FAIL ${error instanceof QAError ? error.message : stage}`);
} finally {
  for (const client of clients) {
    try { await client.removeAllChannels(); await client.realtime.disconnect(); }
    catch { failed = true; console.error('FAIL disconnect fixture Realtime client'); }
  }
  if (admin && storagePaths.length) {
    try {
      const result = await admin.storage.from('knowledge-docs').remove(storagePaths);
      if (result.error) throw new QAError('Storage cleanup failed');
    } catch { failed = true; console.error(`FAIL remove exact QA storage file; inspect run ${runId}`); }
  }
  // Legacy approved_by has no cascade. Remove only these test owners' approvals
  // before deleting their auth users; every other fixture row then cascades.
  if (admin && users.length) {
    try {
      const result = await admin.from('ai_approvals').delete().in('user_id', users);
      if (result.error) throw new QAError('Approval cleanup failed');
    } catch { failed = true; console.error(`FAIL remove QA approvals; inspect run ${runId}`); }
    for (const id of [...users].reverse()) {
      try {
        const result = await admin.auth.admin.deleteUser(id);
        if (result.error) throw new QAError('User cleanup failed');
      } catch { failed = true; console.error(`FAIL remove exact QA user ${id}; run ${runId}`); }
    }
  }
}

process.exitCode = failed ? 1 : 0;
console.log(`${failed ? 'FAILED' : 'PASSED'}: ${checks} hosted pilot checks. ${failed ? `Inspect failed step/cleanup for run ${runId}.` : 'Disposable users and storage files removed.'}`);
