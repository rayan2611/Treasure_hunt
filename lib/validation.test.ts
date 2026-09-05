import { describe, it, expect } from "vitest";
import { isValidBitsId, isValidTeamSize, isValidPin } from "./validation";

describe("isValidBitsId", () => {
  it("has no format restriction — accepts any non-empty value", () => {
    expect(isValidBitsId("2023A7PS1234P")).toBe(true);
    expect(isValidBitsId("some random id 123")).toBe(true);
    expect(isValidBitsId("  padded  ")).toBe(true);
  });

  it("rejects empty/whitespace-only values", () => {
    expect(isValidBitsId("")).toBe(false);
    expect(isValidBitsId("   ")).toBe(false);
  });
});

describe("isValidTeamSize", () => {
  it("accepts 1-4 additional members (team size 2-5)", () => {
    expect(isValidTeamSize(1)).toBe(true);
    expect(isValidTeamSize(2)).toBe(true);
    expect(isValidTeamSize(3)).toBe(true);
    expect(isValidTeamSize(4)).toBe(true);
  });

  it("rejects team sizes outside 2-5 total", () => {
    expect(isValidTeamSize(0)).toBe(false);
    expect(isValidTeamSize(5)).toBe(false);
  });
});

describe("isValidPin", () => {
  it("accepts exactly four digits", () => {
    expect(isValidPin("1234")).toBe(true);
    expect(isValidPin("0000")).toBe(true);
  });

  it("rejects anything that isn't exactly four digits", () => {
    expect(isValidPin("123")).toBe(false);
    expect(isValidPin("12345")).toBe(false);
    expect(isValidPin("12a4")).toBe(false);
    expect(isValidPin("")).toBe(false);
  });
});
