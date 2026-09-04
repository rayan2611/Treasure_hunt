import { describe, it, expect } from "vitest";
import { normalizeAnswer, extractLastFourDigits } from "./normalize";

describe("normalizeAnswer", () => {
  it("lowercases, trims, strips punctuation, collapses whitespace", () => {
    expect(normalizeAnswer("  Krishna!  ")).toBe("krishna");
    expect(normalizeAnswer("Vrindavan.")).toBe("vrindavan");
    expect(normalizeAnswer("Radha,  Krishna")).toBe("radha krishna");
  });

  it("treats differently-spelled equivalents as equal when normalized the same way", () => {
    expect(normalizeAnswer("Matki")).toBe(normalizeAnswer(" matki "));
  });
});

describe("extractLastFourDigits", () => {
  it("extracts the last four digits from a BITS ID", () => {
    expect(extractLastFourDigits("2023A7PS1234P")).toBe("1234");
  });

  it("throws when fewer than four digits are present", () => {
    expect(() => extractLastFourDigits("ABC")).toThrow();
  });
});
