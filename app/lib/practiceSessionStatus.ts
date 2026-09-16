/**
 * The practice session lifecycle, defined once.
 *
 * A row is created as soon as the first answer is scored, so an interview that
 * is abandoned half way still exists. Which rows are shown, counted and swept
 * up differs by status, and those rules live here rather than being repeated
 * (and drifting) across the API routes, admin and cron jobs.
 */

export const PRACTICE_SESSION_STATUS = {
  /** Answers are being saved as the candidate goes. */
  IN_PROGRESS: "in_progress",
  /** Every question was answered. */
  COMPLETED: "completed",
  /** The candidate chose to stop and see their results. */
  FINISHED_EARLY: "finished_early",
  /** Left unfinished and swept up after STALE_AFTER_DAYS. */
  ABANDONED: "abandoned",
} as const;

export type PracticeSessionStatus =
  (typeof PRACTICE_SESSION_STATUS)[keyof typeof PRACTICE_SESSION_STATUS];

/** Statuses that count as a finished interview: listed, scored and reported. */
export const LISTED_STATUSES: readonly string[] = [
  PRACTICE_SESSION_STATUS.COMPLETED,
  PRACTICE_SESSION_STATUS.FINISHED_EARLY,
];

export function isListedStatus(status: string): boolean {
  return LISTED_STATUSES.includes(status);
}

/** Prisma filter for "a finished interview". */
export const LISTED_STATUS_FILTER = { status: { in: LISTED_STATUSES as string[] } };

/**
 * Usage rule: an interview counts once the candidate has actually been given
 * something (one scored answer), whatever happened afterwards. Resuming reuses
 * the same row, so nothing is counted twice.
 */
export function countsTowardsUsage(session: { answeredCount: number; status: string }): boolean {
  return session.answeredCount >= 1;
}

/** Prisma filter for the usage rule above. */
export const USAGE_COUNT_FILTER = { answeredCount: { gte: 1 } };

export const STALE_AFTER_DAYS = 7;

/** An unfinished interview nobody has touched for a week is not coming back. */
export function isStale(
  session: { status: string; lastActivityAt: Date },
  now: Date = new Date()
): boolean {
  if (session.status !== PRACTICE_SESSION_STATUS.IN_PROGRESS) return false;
  return now.getTime() - session.lastActivityAt.getTime() > STALE_AFTER_DAYS * 24 * 60 * 60 * 1000;
}
