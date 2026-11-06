import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';

const project = fileURLToPath(new URL('../', import.meta.url));
const require = createRequire(`${project}/package.json`);
require('@next/env').loadEnvConfig(project);
const { createClient } = require('@supabase/supabase-js');
const { createServerClient } = require('@supabase/ssr');
const base = 'http://127.0.0.1:3005';
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
assert.equal(new URL(url).hostname, '127.0.0.1', 'Integration tests require local Supabase');
const local = JSON.parse(execFileSync('supabase', ['status', '--output', 'json'], { cwd: project, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }));
const admin = createClient(url, local.SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const users = [];
let checks = 0;
function sql(statement) {
  return execFileSync('docker', ['exec', '-i', 'supabase_db_Lead_to_Customer', 'psql', '-U', 'postgres', '-d', 'postgres', '-v', 'ON_ERROR_STOP=1', '-q'], { input: statement, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
}
const ok = (condition, label) => { assert.ok(condition, label); checks++; console.log(`PASS ${label}`); };
async function unwrap(promise) { const { data, error } = await promise; if (error) throw new Error(error.message); return data; }

async function account(label) {
  const email = `daily-qa-${randomUUID()}@example.com`;
  const password = `Test-${randomUUID()}!`;
  const id = randomUUID();
  // Create only disposable local fixtures; authenticate through the real password flow below.
  sql(`BEGIN;
    INSERT INTO auth.users(instance_id,id,aud,role,email,encrypted_password,email_confirmed_at,raw_app_meta_data,raw_user_meta_data,created_at,updated_at,confirmation_token,recovery_token,email_change_token_new,email_change)
    VALUES('00000000-0000-0000-0000-000000000000','${id}','authenticated','authenticated','${email}',crypt('${password}',gen_salt('bf')),now(),'{"provider":"email","providers":["email"]}','{}',now(),now(),'','','','');
    INSERT INTO auth.identities(provider_id,user_id,identity_data,provider,created_at,updated_at)
    VALUES('${id}','${id}','{"sub":"${id}","email":"${email}"}','email',now(),now());
    COMMIT;`);
  users.push(id);
  await unwrap(admin.from('profiles').update({ business_name: `QA ${label}`, ai_enabled: false, timezone: 'Australia/Sydney' }).eq('user_id', id));
  const jar = new Map();
  const client = createServerClient(url, local.PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: { getAll: () => [...jar].map(([name, value]) => ({ name, value })), setAll: (values) => values.forEach(({ name, value }) => jar.set(name, value)) },
  });
  await unwrap(client.auth.signInWithPassword({ email, password }));
  return { id, client, cookie: [...jar].map(([name, value]) => `${name}=${value}`).join('; ') };
}
async function api(path, method = 'GET', body, cookie = '') {
  const response = await fetch(`${base}${path}`, {
    method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
    body: body ? JSON.stringify(body) : undefined, redirect: 'manual',
  });
  const json = await response.json().catch(() => null);
  return { status: response.status, body: json };
}

try {
  const owner = await account('Owner');
  const other = await account('Other business');
  const member = await account('Colleague');
  const viewer = await account('Read only');
  await unwrap(admin.from('team_members').insert([
    { owner_id: owner.id, member_user_id: member.id, role: 'member' },
    { owner_id: owner.id, member_user_id: viewer.id, role: 'viewer' },
  ]));
  const contact = await unwrap(admin.from('contacts').insert({ user_id: owner.id, name: 'QA Next Step', source_channel: 'manual' }).select().single());
  const foreignContact = await unwrap(admin.from('contacts').insert({ user_id: other.id, name: 'QA Private', source_channel: 'manual' }).select().single());

  for (const path of ['/api/dashboard/today', '/api/follow-ups', '/api/contacts', '/api/conversations']) {
    ok((await api(path)).status === 401, `${path} requires authentication`);
  }
  let result = await api('/api/follow-ups', 'POST', { contact_id: contact.id, title: 'Follow up on quote', due_at: new Date(Date.now() - 3_600_000).toISOString(), assigned_to: member.id }, owner.cookie);
  ok(result.status === 201, 'Owner creates an assigned follow-up');
  let follow = result.body.data;
  ok((await api('/api/follow-ups', 'GET', undefined, member.cookie)).body.data.some(row => row.id === follow.id), 'Team member sees owner follow-up');
  ok((await api('/api/follow-ups', 'GET', undefined, other.cookie)).body.data.length === 0, 'Other business cannot read follow-up');
  result = await api('/api/follow-ups', 'POST', { contact_id: foreignContact.id, title: 'Invalid contact', due_at: new Date().toISOString() }, owner.cookie);
  ok(result.status === 400, 'API rejects another business contact');
  result = await api('/api/follow-ups', 'POST', { contact_id: contact.id, title: 'Invalid assignee', due_at: new Date().toISOString(), assigned_to: other.id }, owner.cookie);
  ok(result.status === 400, 'API rejects another business assignee');
  result = await api('/api/follow-ups', 'POST', { contact_id: contact.id, title: 'Read only attempt', due_at: new Date().toISOString() }, viewer.cookie);
  ok(result.status === 403, 'Viewer cannot create follow-up');
  const direct = await other.client.from('follow_ups').select().eq('id', follow.id);
  ok(!direct.error && direct.data.length === 0, 'RLS hides follow-up from another business');
  const invalidInsert = await owner.client.from('follow_ups').insert({ user_id: owner.id, contact_id: foreignContact.id, title: 'Cross tenant', due_at: new Date().toISOString(), assigned_to: owner.id });
  ok(!!invalidInsert.error, 'Database rejects cross-tenant contact FK');
  const invalidAssignee = await owner.client.from('follow_ups').insert({ user_id: owner.id, contact_id: contact.id, title: 'Cross assignee', due_at: new Date().toISOString(), assigned_to: other.id });
  ok(!!invalidAssignee.error, 'Database rejects cross-tenant assignee');
  const viewerWrite = await viewer.client.from('follow_ups').update({ title: 'Forbidden' }).eq('id', follow.id).select();
  ok(!!viewerWrite.error || viewerWrite.data.length === 0, 'RLS blocks viewer update');
  const oldStamp = follow.updated_at;
  result = await api(`/api/follow-ups/${follow.id}`, 'PATCH', { title: 'Revised next step', expected_updated_at: oldStamp }, member.cookie);
  ok(result.status === 200, 'Assigned member can edit follow-up');
  follow = result.body.data;
  result = await api(`/api/follow-ups/${follow.id}`, 'PATCH', { status: 'completed', expected_updated_at: oldStamp }, owner.cookie);
  ok(result.status === 409, 'Stale update conflicts instead of overwriting');
  result = await api(`/api/follow-ups/${follow.id}`, 'PATCH', { due_at: new Date(Date.now() + 86_400_000).toISOString(), expected_updated_at: follow.updated_at }, owner.cookie);
  ok(result.status === 200, 'Follow-up reschedules persistently');
  follow = result.body.data;
  result = await api(`/api/follow-ups/${follow.id}`, 'PATCH', { status: 'completed', expected_updated_at: follow.updated_at }, owner.cookie);
  ok(result.status === 200 && result.body.data.completed_at, 'Completion stamped by database');
  result = await api('/api/dashboard/today', 'GET', undefined, owner.cookie);
  ok(result.status === 200 && result.body.data.completedToday === 1, 'Today reflects real completed work');
  ok(result.body.data.timezone === 'Australia/Sydney', 'Today uses business timezone');
  ok((await api('/api/dashboard/today', 'GET', undefined, member.cookie)).body.data.completedToday === 1, 'Team Today shares business work');
  ok((await api('/api/contacts', 'GET', undefined, member.cookie)).body.data.some(row => row.id === contact.id), 'Contact list scopes to team business');
  ok((await api(`/api/contacts/${contact.id}`, 'GET', undefined, other.cookie)).status === 404, 'Contact detail rejects cross-tenant access');

  // No AI/provider calls: fixture business explicitly has AI disabled.
  result = await api('/api/chat/init', 'POST', { businessId: owner.id });
  ok(result.status === 200 && result.body.sessionId, 'Visitor initializes a durable session');
  const sessionId = result.body.sessionId;
  const credentials = { businessId: owner.id, sessionId };
  const clientMessageId = randomUUID();
  const messageBody = { ...credentials, content: 'Can I discuss a booking?', clientMessageId, senderName: 'QA Visitor' };
  result = await api('/api/chat/message', 'POST', messageBody);
  ok(result.status === 200, 'Visitor message accepted with AI disabled');
  const sessions = await unwrap(admin.from('web_chat_sessions').select().eq('user_id', owner.id));
  const conversationId = sessions[0].conversation_id;
  const conversation = await unwrap(admin.from('conversations').select().eq('id', conversationId).single());
  const firstMessages = await unwrap(admin.from('messages').select().eq('conversation_id', conversationId));
  ok(firstMessages.filter(row => row.direction === 'inbound').length === 1, 'Visitor message persisted once');
  result = await api('/api/chat/message', 'POST', messageBody);
  const duplicateMessages = await unwrap(admin.from('messages').select().eq('conversation_id', conversationId));
  ok(result.status === 200 && duplicateMessages.filter(row => row.direction === 'inbound').length === 1, 'Visitor retry is idempotent');
  result = await api('/api/dashboard/today', 'GET', undefined, owner.cookie);
  ok(result.body.data.needsReply.some(row => row.id === conversationId), 'Unanswered visitor appears on Today');
  const foreignPoll = await api('/api/chat/messages', 'POST', { businessId: other.id, sessionId });
  ok(foreignPoll.status === 401, 'Visitor capability cannot cross businesses');
  ok((await api('/api/chat/messages', 'POST', { businessId: owner.id, sessionId: 'A'.repeat(43) })).status === 401, 'Invented capability rejected');

  const approval = await unwrap(admin.from('ai_approvals').insert({ user_id: owner.id, contact_id: conversation.contact_id, conversation_id: conversationId, draft_content: 'QA draft must remain private', status: 'pending' }).select().single());
  result = await api('/api/chat/messages', 'POST', credentials);
  ok(result.status === 200 && !JSON.stringify(result.body).includes('QA draft must remain private'), 'Polling never exposes unapproved drafts');
  result = await api('/api/dashboard/today', 'GET', undefined, member.cookie);
  ok(result.body.data.approvals.some(row => row.id === approval.id), 'Team sees approval in Today');
  ok(!result.body.data.needsReply.some(row => row.id === conversationId), 'Pending approval is not duplicated as needs-reply work');
  ok((await api(`/api/ai/approvals/${approval.id}`, 'POST', { action: 'approve' }, viewer.cookie)).status === 403, 'Viewer cannot approve reply');
  ok((await api(`/api/ai/approvals/${approval.id}`, 'POST', { action: 'approve' }, other.cookie)).status === 404, 'Other business cannot approve reply');
  const race = await Promise.all([
    api(`/api/ai/approvals/${approval.id}`, 'POST', { action: 'approve', edited_content: 'QA approved reply' }, owner.cookie),
    api(`/api/ai/approvals/${approval.id}`, 'POST', { action: 'approve', edited_content: 'QA approved reply' }, member.cookie),
  ]);
  ok(race.filter(row => row.status === 200).length === 1 && race.filter(row => row.status === 409).length === 1, 'Concurrent approvals publish exactly once');
  const outbound = await unwrap(admin.from('messages').select().eq('conversation_id', conversationId).eq('direction', 'outbound'));
  ok(outbound.length === 1, 'Exactly one approved outbound row');
  result = await api('/api/chat/messages', 'POST', credentials);
  ok(result.body.data.messages.some(row => row.content === 'QA approved reply'), 'Approved reply reaches visitor transcript');
  const delivered = await unwrap(admin.from('messages').select('delivered_at').eq('id', outbound[0].id).single());
  ok(!!delivered.delivered_at, 'Delivery recorded after visitor fetch');
  const replyRequest = { content: 'QA human reply', client_message_id: randomUUID() };
  result = await api(`/api/conversations/${conversationId}/messages`, 'POST', replyRequest, member.cookie);
  ok(result.status === 200 || result.status === 201, 'Member can send human web-chat reply');
  await api(`/api/conversations/${conversationId}/messages`, 'POST', replyRequest, member.cookie);
  const humanReplies = await unwrap(admin.from('messages').select().eq('conversation_id', conversationId).eq('sender_type', 'human'));
  ok(humanReplies.length === 1, 'Human retry is idempotent');
  result = await api('/api/chat/messages', 'POST', credentials);
  ok(result.body.data.messages.some(row => row.content === 'QA human reply'), 'Human reply reaches same visitor session');
  result = await api('/api/dashboard/today', 'GET', undefined, owner.cookie);
  ok(!result.body.data.needsReply.some(row => row.id === conversationId), 'Confirmed response resolves needs-reply item');
  const invalidRpc = await owner.client.rpc('act_on_web_chat_approval', { p_owner_id: owner.id, p_actor_id: owner.id, p_approval_id: approval.id, p_action: null });
  ok(!!invalidRpc.error, 'Database rejects NULL approval action');
  const spoofRpc = await other.client.rpc('send_web_chat_reply', { p_owner_id: owner.id, p_actor_id: owner.id, p_conversation_id: conversationId, p_request_id: randomUUID(), p_content: 'Spoof' });
  ok(!!spoofRpc.error, 'Database rejects spoofed actor');
  const invalidReply = await owner.client.rpc('send_web_chat_reply', { p_owner_id: owner.id, p_actor_id: owner.id, p_conversation_id: conversationId, p_request_id: null, p_content: 'Invalid request' });
  ok(!!invalidReply.error, 'Database requires manual reply idempotency ID');
  result = await api('/api/chat/message', 'POST', { ...credentials, content: 'STOP', clientMessageId: randomUUID() });
  const preference = await unwrap(admin.from('contacts').select('opted_out').eq('id', conversation.contact_id).single());
  ok(result.status === 200 && preference.opted_out, 'STOP persists in human mode without an AI call');
  result = await api(`/api/conversations/${conversationId}/messages`, 'POST', { content: 'Should not send', client_message_id: randomUUID() }, owner.cookie);
  ok(result.status === 409, 'Opted-out visitor cannot receive manual outbound');

  const sms = await unwrap(admin.from('conversations').insert({ user_id: owner.id, contact_id: contact.id, channel_type: 'sms', status: 'active' }).select().single());
  result = await api(`/api/conversations/${sms.id}/messages`, 'POST', { content: 'Do not dispatch', client_message_id: randomUUID() }, owner.cookie);
  ok(result.status === 422, 'Unsupported channel fails visibly instead of claiming delivery');
  const smsApproval = await unwrap(admin.from('ai_approvals').insert({ user_id: owner.id, contact_id: contact.id, conversation_id: sms.id, draft_content: 'Never dispatch', status: 'pending' }).select().single());
  result = await api(`/api/ai/approvals/${smsApproval.id}`, 'POST', { action: 'approve' }, owner.cookie);
  ok(result.status === 422, 'Unsupported approval stays pending');
  const stillPending = await unwrap(admin.from('ai_approvals').select('status').eq('id', smsApproval.id).single());
  ok(stillPending.status === 'pending', 'Failed approval does not falsely record success');
  result = await api(`/api/ai/approvals/${smsApproval.id}`, 'POST', { action: 'reject' }, owner.cookie);
  ok(result.status === 200, 'Unsupported draft can still be rejected');
  // Remove the finished approval fixture: the legacy audit FK deliberately retains approvers.
  // Either participant may win the race above, so cleanup must not depend on its winner.
  await unwrap(admin.from('ai_approvals').delete().eq('id', approval.id).eq('user_id', owner.id));
  sql(`BEGIN; DELETE FROM auth.users WHERE id='${member.id}'; COMMIT;`);
  const reassigned = await unwrap(admin.from('follow_ups').select('assigned_to').eq('id', follow.id).single());
  ok(reassigned.assigned_to === owner.id, 'Deleted teammate follow-up reassigns to owner at commit');
  console.log(`\n${checks} integration checks passed.`);
} finally {
  if (users.length) {
    sql(`DELETE FROM public.ai_approvals WHERE user_id IN (${users.map(id => `'${id}'`).join(',')});`);
  }
  for (const id of users.reverse()) {
    sql(`DELETE FROM auth.users WHERE id='${id}';`);
  }
}
