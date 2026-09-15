import { ACTIVITY_EVENTS } from "@/app/lib/activity";

/**
 * Per-attempt practice progress built from activity events.
 *
 * practice_started, practice_answered and practice_completed share a
 * client-generated attemptId, so an interview someone left part-way through
 * can be told apart from one they never began.
 */

export type PracticeAttemptEvent = {
  event: string;
  detail: unknown;
  createdAt: Date;
};

export type PracticeAttemptSummary = {
  /** Interviews begun. Starts recorded before attempt ids existed count one each. */
  started: number;
  /** Tracked interviews with at least one scored answer. */
  answered: number;
  /** Tracked interviews saved in full. */
  finished: number;
  /**
   * Highest question answered in the most recent unfinished tracked interview:
   * 0 when it was left before any answer, null when there is no such interview.
   */
  lastExitQuestion: number | null;
};

function attemptIdOf(detail: unknown): string | null {
  if (!detail || typeof detail !== "object") return null;
  const id = (detail as { attemptId?: unknown }).attemptId;
  return typeof id === "string" && id.length > 0 ? id : null;
}

function questionNumberOf(detail: unknown): number {
  if (!detail || typeof detail !== "object") return 0;
  const n = (detail as { questionNumber?: unknown }).questionNumber;
  return typeof n === "number" && Number.isFinite(n) ? n : 0;
}

export function summarisePracticeAttempts(events: PracticeAttemptEvent[]): PracticeAttemptSummary {
  let untrackedStarts = 0;
  const startedAt = new Map<string, number>();
  const highestAnswered = new Map<string, number>();
  const finished = new Set<string>();

  for (const e of events) {
    const id = attemptIdOf(e.detail);
    if (e.event === ACTIVITY_EVENTS.PRACTICE_STARTED) {
      if (!id) {
        untrackedStarts += 1;
      } else if (!startedAt.has(id)) {
        startedAt.set(id, e.createdAt.getTime());
      }
    } else if (id && e.event === ACTIVITY_EVENTS.PRACTICE_ANSWERED) {
      highestAnswered.set(id, Math.max(highestAnswered.get(id) ?? 0, questionNumberOf(e.detail)));
    } else if (id && e.event === ACTIVITY_EVENTS.PRACTICE_COMPLETED) {
      finished.add(id);
    }
  }

  let latestUnfinished: string | null = null;
  let latestTime = -Infinity;
  for (const [id, time] of startedAt) {
    if (!finished.has(id) && time > latestTime) {
      latestUnfinished = id;
      latestTime = time;
    }
  }

  return {
    started: untrackedStarts + startedAt.size,
    answered: highestAnswered.size,
    finished: finished.size,
    lastExitQuestion: latestUnfinished === null ? null : highestAnswered.get(latestUnfinished) ?? 0,
  };
}
