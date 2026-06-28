import { describe, it, expect } from "vitest";
import { calculateLeadScore } from "./lead-score";

describe("calculateLeadScore", () => {
  it("returns a fixed 100 for won regardless of other signals", () => {
    expect(calculateLeadScore({ status: "won", temperature: "cold" })).toBe(100);
  });

  it("returns a fixed 0 for lost regardless of other signals", () => {
    expect(
      calculateLeadScore({ status: "lost", temperature: "hot", source_channel: "hubspot" })
    ).toBe(0);
  });

  it("defaults missing status to 'new' and missing temperature to 'cold'", () => {
    // new(5) + cold(5) + no channel(0) = 10
    expect(calculateLeadScore({})).toBe(10);
  });

  it("sums status + temperature + channel + completeness bonuses", () => {
    // qualified(40) + hot(30) + whatsapp(15) + email(5) + phone(5) + company(3) = 98
    expect(
      calculateLeadScore({
        status: "qualified",
        temperature: "hot",
        source_channel: "whatsapp",
        email: "a@b.com",
        phone: "123",
        company: "Acme",
      })
    ).toBe(98);
  });

  it("caps the score at 100", () => {
    // negotiation(80) + hot(30) + hubspot(20) + email(5) + phone(5) + company(3) = 143 -> 100
    expect(
      calculateLeadScore({
        status: "negotiation",
        temperature: "hot",
        source_channel: "hubspot",
        email: "a@b.com",
        phone: "123",
        company: "Acme",
      })
    ).toBe(100);
  });

  it("ignores unknown channel and unknown temperature gracefully", () => {
    // contacted(20) + unknown temp -> 5 fallback + unknown channel -> 0 = 25
    expect(
      calculateLeadScore({
        status: "contacted",
        temperature: "lukewarm",
        source_channel: "carrier-pigeon",
      })
    ).toBe(25);
  });

  it("never returns below 0 or above 100", () => {
    const scores = [
      calculateLeadScore({ status: "new" }),
      calculateLeadScore({ status: "won" }),
      calculateLeadScore({ status: "lost" }),
    ];
    for (const s of scores) {
      expect(s).toBeGreaterThanOrEqual(0);
      expect(s).toBeLessThanOrEqual(100);
    }
  });
});
