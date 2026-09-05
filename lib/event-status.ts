import type { EventStatus } from "@/lib/types";

// The event auto-transitions from DRAFT/REGISTRATION to LIVE once
// hunt_start_time passes, with no admin needing to click anything at the
// exact moment. PAUSED/ENDED are always explicit admin decisions and take
// priority over the clock.
export function effectiveEventStatus(
  status: EventStatus,
  huntStartTime: string | null,
  now: number = Date.now()
): EventStatus {
  if (status === "DRAFT" || status === "REGISTRATION") {
    if (huntStartTime && now >= new Date(huntStartTime).getTime()) {
      return "LIVE";
    }
  }
  return status;
}
