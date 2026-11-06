import { describe, expect, it } from "vitest";
import { createFollowUpSchema, updateFollowUpSchema, followUpQuerySchema } from "./follow-ups";
import { canEditFollowUps, mutationDatabaseError } from "@/lib/follow-ups/service";

const id = "11111111-1111-4111-8111-111111111111";
const create = { contact_id: id, title: "Call about the quote", due_at: "2026-11-07T15:00:00+11:00" };
const version = "2026-11-07T01:02:03.123456+00:00";

describe("follow-up input boundaries", () => {
  it("normalizes titles and accepts explicit timezone offsets", () => {
    expect(createFollowUpSchema.parse({ ...create, title: "  Call back  " }).title).toBe("Call back");
  });
  it.each(["", " ", "x".repeat(201)])("rejects unusable titles", (title) => {
    expect(createFollowUpSchema.safeParse({ ...create, title }).success).toBe(false);
  });
  it.each(["2026-11-07T15:00", "tomorrow", "Infinity"]) ("rejects ambiguous dates", (due_at) => {
    expect(createFollowUpSchema.safeParse({ ...create, due_at }).success).toBe(false);
  });
  it("prevents callers from choosing a tenant or marking completion at create", () => {
    expect(createFollowUpSchema.safeParse({ ...create, user_id: id }).success).toBe(false);
    expect(createFollowUpSchema.safeParse({ ...create, status: "completed" }).success).toBe(false);
  });
  it("requires a row version for every update", () => {
    expect(updateFollowUpSchema.safeParse({ status: "completed" }).success).toBe(false);
    expect(updateFollowUpSchema.safeParse({ expected_updated_at: version }).success).toBe(false);
    expect(updateFollowUpSchema.parse({ expected_updated_at: version, status: "completed" }).expected_updated_at).toBe(version);
  });
  it("prevents changing tenant/contact and client-controlled completion time", () => {
    expect(updateFollowUpSchema.safeParse({ expected_updated_at: version, status: "completed", user_id: id }).success).toBe(false);
    expect(updateFollowUpSchema.safeParse({ expected_updated_at: version, contact_id: id }).success).toBe(false);
    expect(updateFollowUpSchema.safeParse({ expected_updated_at: version, status: "completed", completed_at: version }).success).toBe(false);
  });
  it("supports bounded status filters and valid contact identifiers", () => {
    expect(followUpQuerySchema.parse({}).status).toBe("pending");
    expect(followUpQuerySchema.safeParse({ contact_id: "wrong" }).success).toBe(false);
    expect(followUpQuerySchema.safeParse({ status: "anything" }).success).toBe(false);
  });
});

describe("follow-up permissions and failures", () => {
  it("allows owners/editors and rejects read-only users", () => {
    expect(canEditFollowUps({ isOwner: true, teamRole: null })).toBe(true);
    expect(canEditFollowUps({ isOwner: false, teamRole: "member" })).toBe(true);
    expect(canEditFollowUps({ isOwner: false, teamRole: "admin" })).toBe(true);
    expect(canEditFollowUps({ isOwner: false, teamRole: "viewer" })).toBe(false);
    expect(canEditFollowUps({ isOwner: false, teamRole: null })).toBe(false);
  });
  it("maps relation races to a retryable conflict without leaking database detail", () => {
    expect(mutationDatabaseError({ code: "23503" }).status).toBe(409);
    expect(mutationDatabaseError({ code: "42501" }).status).toBe(403);
    expect(mutationDatabaseError({ code: "XX000" })).toEqual({ message: "Could not save the follow-up. Please try again.", status: 500 });
  });
});
