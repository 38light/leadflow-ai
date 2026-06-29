import { describe, it, expect } from "vitest";
import { chunkText } from "./ingest";

// chunkText is pure (no model/DB), so it's a good hermetic unit-test target.
describe("chunkText", () => {
  it("returns [] for empty/whitespace input", () => {
    expect(chunkText("")).toEqual([]);
    expect(chunkText("   \n\n  ")).toEqual([]);
  });

  it("returns a single chunk when text fits under the limit", () => {
    const out = chunkText("Short knowledge doc about pricing.");
    expect(out).toHaveLength(1);
    expect(out[0]).toBe("Short knowledge doc about pricing.");
  });

  it("splits long text into multiple chunks under the size limit", () => {
    const para = "Sentence about the product. ".repeat(60); // ~1680 chars
    const out = chunkText(para, 500, 100);
    expect(out.length).toBeGreaterThan(1);
    // Each chunk stays within limit + overlap budget.
    for (const c of out) {
      expect(c.length).toBeLessThanOrEqual(500 + 100 + 5);
    }
  });

  it("preserves content across chunks (overlap doesn't drop text)", () => {
    const para = "alpha bravo charlie delta echo foxtrot. ".repeat(50);
    const out = chunkText(para, 400, 80);
    const joined = out.join(" ");
    expect(joined).toContain("alpha bravo charlie");
    expect(joined).toContain("foxtrot");
  });

  it("splits oversized single paragraphs by sentence", () => {
    const big = "This is one sentence. " + "x".repeat(50) + ". Another sentence here.";
    const out = chunkText(big, 40, 0);
    expect(out.length).toBeGreaterThan(1);
  });
});
