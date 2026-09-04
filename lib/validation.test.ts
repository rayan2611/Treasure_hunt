import { describe, it, expect } from "vitest";
import { isValidBitsId, isValidTeamSize, isValidPin } from "./validation";

describe("isValidBitsId", () => {
  it("accepts the canonical format", () => {
    expect(isValidBitsId("2023A7PS1234P")).toBe(true);
    expect(isValidBitsId("2020B4PS0001A")).toBe(true);
  });

  it("is case-insensitive on the letters", () => {
    expect(isValidBitsId("2023a7ps1234p")).toBe(true);
  });

  it("rejects malformed IDs", () => {
    expect(isValidBitsId("2023A7PS1234")).toBe(false); // missing trailing letter
    expect(isValidBitsId("1234567890123")).toBe(false); // all digits
    expect(isValidBitsId("2023A7PS12345P")).toBe(false); // too many digits
    expect(isValidBitsId("")).toBe(false);
  });
});

describe("isValidTeamSize", () => {
  it("accepts 2-4 additional members (team size 3-5)", () => {
    expect(isValidTeamSize(2)).toBe(true);
    expect(isValidTeamSize(3)).toBe(true);
    expect(isValidTeamSize(4)).toBe(true);
  });

  it("rejects team sizes outside 3-5 total", () => {
    expect(isValidTeamSize(0)).toBe(false);
    expect(isValidTeamSize(1)).toBe(false);
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
