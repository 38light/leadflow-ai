import { describe, it, expect } from "vitest";
import { createContactSchema, contactFiltersSchema } from "./contacts";

describe("createContactSchema", () => {
  it("accepts a minimal valid contact and applies defaults", () => {
    const parsed = createContactSchema.parse({ name: "Jane" });
    expect(parsed.name).toBe("Jane");
    expect(parsed.status).toBe("new");
    expect(parsed.tags).toEqual([]);
    expect(parsed.metadata).toEqual({});
  });

  it("rejects an empty name", () => {
    expect(createContactSchema.safeParse({ name: "" }).success).toBe(false);
  });

  it("rejects a missing name", () => {
    expect(createContactSchema.safeParse({}).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(
      createContactSchema.safeParse({ name: "Jane", email: "not-an-email" }).success
    ).toBe(false);
  });

  it("rejects an unknown status enum", () => {
    expect(
      createContactSchema.safeParse({ name: "Jane", status: "archived" }).success
    ).toBe(false);
  });

  it("rejects more than 20 tags", () => {
    const tags = Array.from({ length: 21 }, (_, i) => `t${i}`);
    expect(createContactSchema.safeParse({ name: "Jane", tags }).success).toBe(false);
  });
});

describe("contactFiltersSchema", () => {
  it("coerces page/limit from strings and defaults them", () => {
    const parsed = contactFiltersSchema.parse({ page: "3", limit: "50" });
    expect(parsed.page).toBe(3);
    expect(parsed.limit).toBe(50);
  });

  it("defaults page=1 and limit=25 when absent", () => {
    const parsed = contactFiltersSchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(25);
  });

  it("rejects a limit above 100", () => {
    expect(contactFiltersSchema.safeParse({ limit: "101" }).success).toBe(false);
  });
});
