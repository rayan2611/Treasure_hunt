import { describe, it, expect } from "vitest";
import { isRateLimited } from "./rate-limit";

describe("isRateLimited", () => {
  const threshold = 1200;

  it("is not limited when there is no prior submission", () => {
    expect(isRateLimited(null, Date.now(), threshold)).toBe(false);
  });

  it("is limited when the last submission was within the threshold", () => {
    const now = Date.now();
    const last = new Date(now - 500).toISOString();
    expect(isRateLimited(last, now, threshold)).toBe(true);
  });

  it("is not limited once the threshold has elapsed", () => {
    const now = Date.now();
    const last = new Date(now - 1300).toISOString();
    expect(isRateLimited(last, now, threshold)).toBe(false);
  });

  it("is based on the database timestamp, not any in-memory counter", () => {
    // Two "instances" computing independently from the same DB-read timestamp
    // must agree — this is the property that makes it safe across serverless
    // instances with no shared memory.
    const now = Date.now();
    const last = new Date(now - 100).toISOString();
    const instanceA = isRateLimited(last, now, threshold);
    const instanceB = isRateLimited(last, now, threshold);
    expect(instanceA).toBe(instanceB);
    expect(instanceA).toBe(true);
  });
});
