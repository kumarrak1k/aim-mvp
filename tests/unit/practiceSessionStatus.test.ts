/**
 * Practice session lifecycle rules, defined once.
 *
 * From Phase 1 a PracticeSession row is created as soon as the first answer is
 * scored (status in_progress) and later becomes completed, finished_early or
 * abandoned. Lists and reports must only show finished interviews, the usage
 * cap must count any interview with at least one answer, and an unfinished
 * interview left for 7 days is stale.
 */
import { describe, it, expect } from "vitest";
import {
  PRACTICE_SESSION_STATUS,
  LISTED_STATUSES,
  isListedStatus,
  countsTowardsUsage,
  isStale,
  STALE_AFTER_DAYS,
} from "@/app/lib/practiceSessionStatus";

const DAY = 24 * 60 * 60 * 1000;

describe("practice session status rules", () => {
  it("lists completed and finished-early interviews only", () => {
    expect([...LISTED_STATUSES].sort()).toEqual(["completed", "finished_early"]);
    expect(isListedStatus(PRACTICE_SESSION_STATUS.COMPLETED)).toBe(true);
    expect(isListedStatus(PRACTICE_SESSION_STATUS.FINISHED_EARLY)).toBe(true);
    expect(isListedStatus(PRACTICE_SESSION_STATUS.IN_PROGRESS)).toBe(false);
    expect(isListedStatus(PRACTICE_SESSION_STATUS.ABANDONED)).toBe(false);
  });

  it("counts an interview towards usage once one answer is saved, whatever its status", () => {
    expect(countsTowardsUsage({ answeredCount: 1, status: "in_progress" })).toBe(true);
    expect(countsTowardsUsage({ answeredCount: 3, status: "abandoned" })).toBe(true);
    expect(countsTowardsUsage({ answeredCount: 0, status: "in_progress" })).toBe(false);
  });

  it("treats an unfinished interview untouched for 7 days as stale", () => {
    const now = new Date("2026-09-16T09:00:00Z");
    expect(STALE_AFTER_DAYS).toBe(7);
    expect(isStale({ status: "in_progress", lastActivityAt: new Date(now.getTime() - 8 * DAY) }, now)).toBe(true);
    expect(isStale({ status: "in_progress", lastActivityAt: new Date(now.getTime() - 2 * DAY) }, now)).toBe(false);
    expect(isStale({ status: "completed", lastActivityAt: new Date(now.getTime() - 30 * DAY) }, now)).toBe(false);
  });
});
