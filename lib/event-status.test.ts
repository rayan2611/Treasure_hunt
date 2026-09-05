import { describe, it, expect } from "vitest";
import { effectiveEventStatus } from "./event-status";

const FUTURE = "2026-09-06T11:45:00.000Z";
const BEFORE = new Date(FUTURE).getTime() - 1000;
const AFTER = new Date(FUTURE).getTime() + 1000;

describe("effectiveEventStatus", () => {
  it("stays REGISTRATION before hunt_start_time", () => {
    expect(effectiveEventStatus("REGISTRATION", FUTURE, BEFORE)).toBe("REGISTRATION");
  });

  it("auto-flips REGISTRATION to LIVE once hunt_start_time passes", () => {
    expect(effectiveEventStatus("REGISTRATION", FUTURE, AFTER)).toBe("LIVE");
  });

  it("auto-flips DRAFT to LIVE once hunt_start_time passes", () => {
    expect(effectiveEventStatus("DRAFT", FUTURE, AFTER)).toBe("LIVE");
  });

  it("never auto-starts without a hunt_start_time", () => {
    expect(effectiveEventStatus("REGISTRATION", null, AFTER)).toBe("REGISTRATION");
  });

  it("leaves PAUSED alone even after hunt_start_time passes", () => {
    expect(effectiveEventStatus("PAUSED", FUTURE, AFTER)).toBe("PAUSED");
  });

  it("leaves ENDED alone even after hunt_start_time passes", () => {
    expect(effectiveEventStatus("ENDED", FUTURE, AFTER)).toBe("ENDED");
  });

  it("leaves LIVE alone", () => {
    expect(effectiveEventStatus("LIVE", FUTURE, BEFORE)).toBe("LIVE");
  });
});
