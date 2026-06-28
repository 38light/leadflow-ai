import { describe, it, expect } from "vitest";
import { createBookingSchema, bookingSettingsSchema } from "./booking";

// createBookingSchema guards the PUBLIC, unauthenticated booking endpoint, so
// its validation is a real input-trust boundary.
describe("createBookingSchema", () => {
  const valid = {
    client_name: "Jane Doe",
    client_email: "jane@example.com",
    booking_date: "2026-07-01",
    start_time: "14:30",
  };

  it("accepts a valid booking", () => {
    expect(createBookingSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a missing client name", () => {
    expect(createBookingSchema.safeParse({ ...valid, client_name: "" }).success).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(createBookingSchema.safeParse({ ...valid, client_email: "nope" }).success).toBe(
      false
    );
  });

  it("rejects a malformed booking_date (not YYYY-MM-DD)", () => {
    expect(createBookingSchema.safeParse({ ...valid, booking_date: "01/07/2026" }).success).toBe(
      false
    );
  });

  it("rejects a malformed start_time (not HH:MM)", () => {
    expect(createBookingSchema.safeParse({ ...valid, start_time: "2pm" }).success).toBe(false);
  });

  it("rejects a non-uuid service_id", () => {
    expect(createBookingSchema.safeParse({ ...valid, service_id: "123" }).success).toBe(false);
  });

  it("accepts a valid uuid service_id", () => {
    expect(
      createBookingSchema.safeParse({
        ...valid,
        service_id: "11111111-1111-1111-1111-111111111111",
      }).success
    ).toBe(true);
  });
});

describe("bookingSettingsSchema", () => {
  it("enforces the slug character set", () => {
    expect(bookingSettingsSchema.safeParse({ booking_url_slug: "Bad Slug!" }).success).toBe(
      false
    );
    expect(bookingSettingsSchema.safeParse({ booking_url_slug: "good-slug-1" }).success).toBe(
      true
    );
  });

  it("applies sensible defaults", () => {
    const parsed = bookingSettingsSchema.parse({});
    expect(parsed.min_notice_hours).toBe(24);
    expect(parsed.max_advance_days).toBe(90);
    expect(parsed.timezone).toBe("Australia/Sydney");
  });
});
