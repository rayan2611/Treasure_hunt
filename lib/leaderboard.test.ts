import { describe, it, expect } from "vitest";
import { sortForLeaderboard, type LeaderboardTeamLike } from "./leaderboard";

function team(
  name: string,
  questionsCompleted: number,
  lastCompletedAt: string | null,
  registeredAt: string
): LeaderboardTeamLike & { name: string } {
  return { name, questionsCompleted, lastCompletedAt, registeredAt };
}

describe("sortForLeaderboard", () => {
  it("orders by questions_completed descending first", () => {
    const teams = [
      team("Low", 2, null, "2026-09-06T17:00:00Z"),
      team("High", 5, null, "2026-09-06T17:00:00Z")
    ];
    const sorted = sortForLeaderboard(teams);
    expect(sorted.map((t) => t.name)).toEqual(["High", "Low"]);
  });

  it("breaks ties by last_completed_at ascending (earlier finisher ranks higher)", () => {
    const teams = [
      team("Later", 3, "2026-09-06T17:10:00Z", "2026-09-06T16:00:00Z"),
      team("Earlier", 3, "2026-09-06T17:05:00Z", "2026-09-06T16:00:00Z")
    ];
    const sorted = sortForLeaderboard(teams);
    expect(sorted.map((t) => t.name)).toEqual(["Earlier", "Later"]);
  });

  it("puts teams with no completions after teams with at least one, at equal questionsCompleted", () => {
    const teams = [
      team("NeverCompleted", 0, null, "2026-09-06T16:00:00Z"),
      team("JustCompleted", 0, "2026-09-06T17:00:00Z", "2026-09-06T16:30:00Z")
    ];
    const sorted = sortForLeaderboard(teams);
    expect(sorted.map((t) => t.name)).toEqual(["JustCompleted", "NeverCompleted"]);
  });

  it("finally breaks ties by registered_at ascending", () => {
    const teams = [
      team("RegisteredLater", 0, null, "2026-09-06T16:30:00Z"),
      team("RegisteredFirst", 0, null, "2026-09-06T16:00:00Z")
    ];
    const sorted = sortForLeaderboard(teams);
    expect(sorted.map((t) => t.name)).toEqual(["RegisteredFirst", "RegisteredLater"]);
  });

  it("does not mutate the input array", () => {
    const teams = [team("A", 1, null, "2026-09-06T16:00:00Z"), team("B", 2, null, "2026-09-06T16:00:00Z")];
    const original = [...teams];
    sortForLeaderboard(teams);
    expect(teams).toEqual(original);
  });
});
