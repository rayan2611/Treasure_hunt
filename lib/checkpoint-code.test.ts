import { describe, it, expect, vi, afterEach } from "vitest";
import { generateCheckpointCode, formatCheckpointCode } from "./checkpoint-code";

describe("formatCheckpointCode", () => {
  it("zero-pads small values instead of truncating", () => {
    expect(formatCheckpointCode(42)).toBe("000042");
  });

  it("leaves a full 6-digit value untouched", () => {
    expect(formatCheckpointCode(123456)).toBe("123456");
  });

  it("zero-pads a single-digit value to 6 characters", () => {
    expect(formatCheckpointCode(7)).toBe("000007");
  });
});

describe("generateCheckpointCode", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("is always exactly 6 digits", () => {
    for (let i = 0; i < 200; i++) {
      expect(generateCheckpointCode()).toMatch(/^\d{6}$/);
    }
  });

  it("never uses Math.random", () => {
    const spy = vi.spyOn(Math, "random");
    generateCheckpointCode();
    expect(spy).not.toHaveBeenCalled();
  });

  it("produces varied output across calls (not a constant)", () => {
    const codes = new Set(Array.from({ length: 50 }, () => generateCheckpointCode()));
    expect(codes.size).toBeGreaterThan(1);
  });
});
