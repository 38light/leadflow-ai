import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({
  getAPIContext: vi.fn(), db: { from: vi.fn(), rpc: vi.fn() }, getChatSession: vi.fn(), processInboundMessage: vi.fn(),
}));
vi.mock("@/lib/auth/get-user", () => ({ getAPIContext: mocks.getAPIContext }));
vi.mock("@/lib/supabase/server", () => ({ createAdminClient: () => mocks.db, createServerClient: async () => mocks.db }));
vi.mock("@/lib/ai/orchestrator", () => ({ processInboundMessage: mocks.processInboundMessage }));
vi.mock("@/lib/rate-limit/chat", () => ({ rateLimitByIp: async () => ({ allowed: true }), rateLimitChatMessage: async () => ({ allowed: true }) }));
vi.mock("@/lib/chat/session", async importOriginal => ({ ...await importOriginal<object>(), getChatSession: mocks.getChatSession }));

import { POST as visitorMessage } from "@/app/api/chat/message/route";
import { POST as pollMessages } from "@/app/api/chat/messages/route";
import { POST as approvalAction } from "@/app/api/ai/approvals/[id]/route";
import { POST as humanReply } from "@/app/api/conversations/[id]/messages/route";

const ownerId = "11111111-1111-4111-8111-111111111111";
const conversationId = "22222222-2222-4222-8222-222222222222";
const messageId = "33333333-3333-4333-8333-333333333333";
const approvalId = "44444444-4444-4444-8444-444444444444";
const body = { businessId: ownerId, sessionId: "A".repeat(43), clientMessageId: messageId, content: "Can you help?" };
const request = (value: unknown) => new NextRequest("http://localhost/api/chat/message", { method: "POST", body: JSON.stringify(value) });
const params = { params: Promise.resolve({ id: approvalId }) };

function query(data: unknown = null) {
  const result = { data, error: null };
  return { select: vi.fn().mockReturnThis(), update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(),
    gt: vi.fn().mockReturnThis(), is: vi.fn().mockReturnThis(), in: vi.fn().mockReturnThis(), order: vi.fn().mockReturnThis(), or: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result), maybeSingle: vi.fn().mockResolvedValue(result), limit: vi.fn().mockResolvedValue(result),
    then: (resolve: (r: unknown) => unknown) => Promise.resolve(result).then(resolve),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAPIContext.mockResolvedValue({ ownerId, user: { id: ownerId }, teamRole: null });
  mocks.getChatSession.mockResolvedValue({ user_id: ownerId, conversation_id: conversationId });
  mocks.db.rpc.mockResolvedValue({ data: { message_id: messageId, contact_id: "contact", conversation_id: conversationId, duplicate: false, is_first_message: true, is_ai_active: true }, error: null });
  mocks.db.from.mockImplementation(table => {
    if (table === "profiles") return query({ business_name: "Test", business_type: "general", ai_enabled: true });
    if (table === "contacts") return query({ opted_out: false });
    if (table === "messages") return query([]);
    return query();
  });
  mocks.processInboundMessage.mockResolvedValue({ shouldSend: false, responseContent: "PRIVATE UNAPPROVED DRAFT", isOptOut: false });
});

describe("visitor delivery", () => {
  it("returns only a receipt when a draft requires approval", async () => {
    const res = await visitorMessage(request(body));
    expect(res.status).toBe(200);
    const text = await res.text();
    expect(text).not.toContain("PRIVATE");
    expect(text).toContain("awaiting_reply");
    expect(mocks.db.rpc).not.toHaveBeenCalledWith("publish_web_chat_ai_reply", expect.anything());
  });
  it("refuses a session belonging to another owner before persisting anything", async () => {
    mocks.getChatSession.mockResolvedValue(null);
    expect((await visitorMessage(request(body))).status).toBe(401);
    expect(mocks.getChatSession).toHaveBeenCalledWith(mocks.db, ownerId, body.sessionId);
    expect(mocks.db.rpc).not.toHaveBeenCalled();
  });
  it("does not rerun AI on a retry of an accepted message", async () => {
    mocks.db.rpc.mockResolvedValue({ data: { duplicate: true, message_id: messageId }, error: null });
    expect((await visitorMessage(request(body))).status).toBe(200);
    expect(mocks.processInboundMessage).not.toHaveBeenCalled();
  });
  it("does not call AI after human takeover", async () => {
    mocks.db.rpc.mockResolvedValue({ data: { duplicate: false, is_ai_active: false, message_id: messageId }, error: null });
    expect((await visitorMessage(request(body))).status).toBe(200);
    expect(mocks.processInboundMessage).not.toHaveBeenCalled();
  });
  it("keeps an accepted enquiry available when AI fails", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.processInboundMessage.mockRejectedValue(new Error("private provider detail"));
    const res = await visitorMessage(request(body));
    expect(res.status).toBe(202);
    expect(await res.text()).not.toContain("private provider");
    log.mockRestore();
  });
  it("rejects malformed request IDs before any DB write", async () => {
    expect((await visitorMessage(request({ ...body, clientMessageId: "bad" }))).status).toBe(400);
    expect(mocks.db.rpc).not.toHaveBeenCalled();
  });
  it("polls only the conversation bound to the capability", async () => {
    const messages = query([{ id: messageId, content: "Hello", direction: "inbound", created_at: "2026-11-07T01:00:00Z", external_message_id: `visitor:${messageId}` }]);
    mocks.db.from.mockReturnValue(messages);
    const res = await pollMessages(request({ ...body, conversationId: "attacker-chosen-conversation" }));
    expect(res.status).toBe(200);
    expect(messages.eq).toHaveBeenCalledWith("user_id", ownerId);
    expect(messages.eq).toHaveBeenCalledWith("conversation_id", conversationId);
    expect(mocks.db.from).not.toHaveBeenCalledWith("ai_approvals");
  });
  it("refuses an invalid poll capability", async () => {
    mocks.getChatSession.mockResolvedValue(null);
    expect((await pollMessages(request(body))).status).toBe(401);
    expect(mocks.db.from).not.toHaveBeenCalled();
  });
});

describe("approval and human reply permissions", () => {
  it("requires a signed-in owner or team member", async () => {
    mocks.getAPIContext.mockResolvedValue(null);
    expect((await approvalAction(request({ action: "approve" }), params)).status).toBe(401);
    expect(mocks.db.rpc).not.toHaveBeenCalled();
  });
  it("blocks viewer writes before the database", async () => {
    mocks.getAPIContext.mockResolvedValue({ ownerId, user: { id: ownerId }, teamRole: "viewer" });
    expect((await approvalAction(request({ action: "approve" }), params)).status).toBe(403);
    expect((await humanReply(request({ content: "Hello", client_message_id: messageId }), params)).status).toBe(403);
    expect(mocks.db.rpc).not.toHaveBeenCalled();
  });
  it("passes the authenticated tenant and actor to the atomic approval function", async () => {
    mocks.db.rpc.mockResolvedValue({ data: { error: "not_found" }, error: null });
    expect((await approvalAction(request({ action: "approve", owner_id: "attacker" }), params)).status).toBe(404);
    expect(mocks.db.rpc).toHaveBeenCalledWith("act_on_web_chat_approval", expect.objectContaining({ p_owner_id: ownerId, p_actor_id: ownerId, p_approval_id: approvalId }));
  });
  it("surfaces concurrent decisions as a conflict", async () => {
    mocks.db.rpc.mockResolvedValue({ data: { error: "already_processed" }, error: null });
    expect((await approvalAction(request({ action: "reject" }), params)).status).toBe(409);
  });
  it("never reports an unsupported external channel as sent", async () => {
    mocks.db.rpc.mockResolvedValue({ data: { error: "unsupported_channel" }, error: null });
    expect((await approvalAction(request({ action: "approve" }), params)).status).toBe(422);
    expect((await humanReply(request({ content: "Hello", client_message_id: messageId }), params)).status).toBe(422);
  });
  it("requires idempotency for manual sends", async () => {
    expect((await humanReply(request({ content: "Hello" }), params)).status).toBe(400);
    expect(mocks.db.rpc).not.toHaveBeenCalled();
  });
});
