import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ getAPIContext: vi.fn(), createServerClient: vi.fn() }));
vi.mock("@/lib/auth/get-user", () => ({ getAPIContext: mocks.getAPIContext }));
vi.mock("@/lib/supabase/server", () => ({ createServerClient: mocks.createServerClient }));
import { PATCH } from "@/app/api/follow-ups/[id]/route";

const ownerId = "11111111-1111-4111-8111-111111111111";
const id = "22222222-2222-4222-8222-222222222222";
const version = "2026-11-07T01:02:03.123456+00:00";
const context = { params: Promise.resolve({ id }) };
function request(body: unknown) {
  return new NextRequest(`http://localhost/api/follow-ups/${id}`, { method: "PATCH", body: JSON.stringify(body) });
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getAPIContext.mockResolvedValue({ user: { id: ownerId }, ownerId, isOwner: true, teamRole: null });
});

describe("follow-up mutation boundary", () => {
  it("refuses anonymous writes before touching the database", async () => {
    mocks.getAPIContext.mockResolvedValue(null);
    expect((await PATCH(request({ expected_updated_at: version, status: "completed" }), context)).status).toBe(401);
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });
  it("refuses read-only team members before touching the database", async () => {
    mocks.getAPIContext.mockResolvedValue({ user: { id: ownerId }, ownerId, isOwner: false, teamRole: "viewer" });
    expect((await PATCH(request({ expected_updated_at: version, status: "completed" }), context)).status).toBe(403);
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });
  it("rejects writes that omit the version from the browser's snapshot", async () => {
    expect((await PATCH(request({ status: "completed" }), context)).status).toBe(400);
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });
  it("rejects tenant substitution even from an authenticated owner", async () => {
    expect((await PATCH(request({ user_id: id, expected_updated_at: version, status: "completed" }), context)).status).toBe(400);
    expect(mocks.createServerClient).not.toHaveBeenCalled();
  });
  it("reports a stale update as a conflict instead of pretending it completed", async () => {
    const query = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) };
    mocks.createServerClient.mockResolvedValue({ from: vi.fn().mockReturnValue(query) });
    const response = await PATCH(request({ expected_updated_at: version, status: "completed" }), context);
    expect(response.status).toBe(409);
    expect(await response.json()).toHaveProperty("error");
    expect(query.eq).toHaveBeenCalledWith("user_id", ownerId);
    expect(query.eq).toHaveBeenCalledWith("updated_at", version);
  });
  it("returns the database-confirmed state after a successful conditional update", async () => {
    const saved = { id, user_id: ownerId, status: "completed", completed_at: "2026-11-07T01:05:00Z", updated_at: "2026-11-07T01:05:00Z" };
    const query = { update: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), select: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockResolvedValue({ data: saved, error: null }) };
    mocks.createServerClient.mockResolvedValue({ from: vi.fn().mockReturnValue(query) });
    const response = await PATCH(request({ expected_updated_at: version, status: "completed" }), context);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ data: saved });
    expect(query.update).toHaveBeenCalledWith({ status: "completed" });
  });
});
