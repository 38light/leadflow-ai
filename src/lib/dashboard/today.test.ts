import { describe, expect, it } from "vitest";
import { businessDayBounds, validTimezone } from "./today";

describe("business day boundaries", () => {
  it("uses the business day when UTC is still yesterday", () => {
    expect(businessDayBounds(new Date("2026-11-06T23:00:00Z"), "Australia/Sydney")).toEqual({
      timezone: "Australia/Sydney", businessDate: "2026-11-07",
      start: "2026-11-06T13:00:00.000Z", end: "2026-11-07T13:00:00.000Z", localTime: "10:00:00",
    });
  });
  it("includes the repeated hour when daylight saving ends", () => {
    const day = businessDayBounds(new Date("2026-04-05T02:00:00Z"), "Australia/Sydney");
    expect(day.start).toBe("2026-04-04T13:00:00.000Z");
    expect(day.end).toBe("2026-04-05T14:00:00.000Z");
    expect(Date.parse(day.end) - Date.parse(day.start)).toBe(25 * 60 * 60 * 1000);
  });
  it("does not manufacture an extra hour when daylight saving starts", () => {
    const day = businessDayBounds(new Date("2026-10-04T02:00:00Z"), "Australia/Sydney");
    expect(day.start).toBe("2026-10-03T14:00:00.000Z");
    expect(day.end).toBe("2026-10-04T13:00:00.000Z");
    expect(Date.parse(day.end) - Date.parse(day.start)).toBe(23 * 60 * 60 * 1000);
  });
  it("handles a half-hour timezone at a year boundary", () => {
    const day = businessDayBounds(new Date("2026-12-31T20:00:00Z"), "Asia/Kolkata");
    expect(day.businessDate).toBe("2027-01-01");
    expect(day.start).toBe("2026-12-31T18:30:00.000Z");
    expect(day.end).toBe("2027-01-01T18:30:00.000Z");
  });
  it("keeps UTC midnight as 00:00", () => {
    expect(businessDayBounds(new Date("2026-11-07T00:00:00Z"), "UTC").localTime).toBe("00:00:00");
  });
  it("falls back safely from an invalid profile setting", () => {
    expect(validTimezone("not/a-zone")).toBe("Australia/Sydney");
    expect(validTimezone(null)).toBe("Australia/Sydney");
    expect(() => businessDayBounds(new Date("bad"), "UTC")).toThrow("Invalid reference date");
  });
});
