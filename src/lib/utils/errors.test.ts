import { describe, it, expect } from "vitest";
import { AppError, getErrorMessage } from "./errors";

describe("AppError", () => {
  it("defaults statusCode to 400 and sets the name", () => {
    const e = new AppError("bad input");
    expect(e.message).toBe("bad input");
    expect(e.statusCode).toBe(400);
    expect(e.name).toBe("AppError");
    expect(e).toBeInstanceOf(Error);
  });

  it("carries a custom statusCode and code", () => {
    const e = new AppError("nope", 403, "FORBIDDEN");
    expect(e.statusCode).toBe(403);
    expect(e.code).toBe("FORBIDDEN");
  });
});

describe("getErrorMessage", () => {
  it("returns the message from an AppError", () => {
    expect(getErrorMessage(new AppError("scoped"))).toBe("scoped");
  });

  it("returns the message from a plain Error", () => {
    expect(getErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("returns a generic message for non-Error values", () => {
    expect(getErrorMessage("a string")).toBe("An unexpected error occurred");
    expect(getErrorMessage(null)).toBe("An unexpected error occurred");
    expect(getErrorMessage({ weird: true })).toBe("An unexpected error occurred");
  });
});
