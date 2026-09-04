/**
 * Database-backed rate limiting (backend spec section 5). Given the timestamp
 * of a team's most recent submission (read from the `submissions` table, which
 * is indexed on (team_id, submitted_at desc)), decide whether a new submission
 * arrives too soon. Pure function so it can be unit tested without a database.
 */
export function isRateLimited(
  lastSubmittedAt: string | Date | null,
  now: number,
  thresholdMs: number
): boolean {
  if (!lastSubmittedAt) return false;
  const last = new Date(lastSubmittedAt).getTime();
  if (Number.isNaN(last)) return false;
  return now - last < thresholdMs;
}
