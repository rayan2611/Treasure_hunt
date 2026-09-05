import { describe, it, expect } from "vitest";
import { extractCheckpointSecret } from "./checkpoint-secret";

describe("extractCheckpointSecret", () => {
  it("extracts the c query param from a full checkpoint URL", () => {
    expect(extractCheckpointSecret("https://hunt.example.com/scan?c=abc123")).toBe("abc123");
  });

  it("extracts c even when other query params are present", () => {
    expect(extractCheckpointSecret("https://hunt.example.com/scan?utm=x&c=abc123&y=2")).toBe("abc123");
  });

  it("falls back to the raw string when it is not URL-shaped", () => {
    expect(extractCheckpointSecret("bare-secret-value")).toBe("bare-secret-value");
  });

  it("trims surrounding whitespace", () => {
    expect(extractCheckpointSecret("  bare-secret-value  ")).toBe("bare-secret-value");
  });

  it("falls back to the raw string when a URL has no c param", () => {
    expect(extractCheckpointSecret("https://hunt.example.com/scan")).toBe("https://hunt.example.com/scan");
  });
});
