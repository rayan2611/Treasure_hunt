/**
 * Deterministic leaderboard ordering (backend spec sections 6 & 9):
 *   ORDER BY questions_completed DESC, last_completed_at ASC, registered_at ASC
 * Teams with no completions yet (last_completed_at null) sort after those who
 * have completed at least one clue, mirroring `get_public_leaderboard` in
 * supabase/schema.sql. Kept here — documented and unit-tested — so any
 * client-side re-sort (e.g. the admin dashboard) stays consistent with the
 * source-of-truth SQL ordering.
 */
export type LeaderboardTeamLike = {
  questionsCompleted: number;
  lastCompletedAt: string | null;
  registeredAt: string;
};

export function compareForLeaderboard<T extends LeaderboardTeamLike>(a: T, b: T): number {
  if (a.questionsCompleted !== b.questionsCompleted) {
    return b.questionsCompleted - a.questionsCompleted;
  }

  const aHasCompletion = a.lastCompletedAt !== null;
  const bHasCompletion = b.lastCompletedAt !== null;
  if (aHasCompletion !== bHasCompletion) {
    return aHasCompletion ? -1 : 1;
  }

  if (aHasCompletion && bHasCompletion) {
    const diff = new Date(a.lastCompletedAt as string).getTime() - new Date(b.lastCompletedAt as string).getTime();
    if (diff !== 0) return diff;
  }

  return new Date(a.registeredAt).getTime() - new Date(b.registeredAt).getTime();
}

export function sortForLeaderboard<T extends LeaderboardTeamLike>(teams: T[]): T[] {
  return [...teams].sort(compareForLeaderboard);
}
