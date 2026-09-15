/**
 * Bounding helpers for the client-supplied fields that tie one practice
 * attempt's events together (practice_started, practice_answered,
 * practice_completed). These values come from the browser, so anything
 * malformed is stored as null rather than trusted.
 */

/** Client-supplied attempt id: kept only when it is a short, non-empty string. */
export function boundedAttemptId(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 && value.length <= 64 ? value : null;
}

/** Client-supplied question position/count: kept only when an integer 1-20. */
export function boundedQuestionCount(value: unknown): number | null {
  return Number.isInteger(value) && (value as number) >= 1 && (value as number) <= 20
    ? (value as number)
    : null;
}
