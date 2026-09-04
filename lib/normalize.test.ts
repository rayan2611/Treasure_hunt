import { describe, it, expect } from "vitest";
import { normalizeAnswer } from "./normalize";

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
