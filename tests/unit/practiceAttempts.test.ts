/**
 * Per-attempt practice progress, built from activity events.
 *
 * practice_started, practice_answered and practice_completed share an
 * attemptId, so an interview someone left can be told apart from one they
 * never began, and the admin can see which question they stopped at.
 */
import { describe, it, expect } from "vitest";
import { summarisePracticeAttempts } from "@/app/lib/practiceAttempts";

const at = (minute: number) => new Date(Date.UTC(2026, 8, 15, 10, minute));

describe("summarisePracticeAttempts", () => {
  it("counts each attempt once, however many questions were answered", () => {
    const summary = summarisePracticeAttempts([
      { event: "practice_started", detail: { attemptId: "a1" }, createdAt: at(0) },
      { event: "practice_answered", detail: { attemptId: "a1", questionNumber: 1 }, createdAt: at(2) },
      { event: "practice_answered", detail: { attemptId: "a1", questionNumber: 2 }, createdAt: at(4) },
      { event: "practice_completed", detail: { attemptId: "a1" }, createdAt: at(9) },
      { event: "practice_started", detail: { attemptId: "a2" }, createdAt: at(20) },
      { event: "practice_answered", detail: { attemptId: "a2", questionNumber: 1 }, createdAt: at(22) },
    ]);

    expect(summary).toMatchObject({ started: 2, answered: 2, finished: 1 });
  });

  it("reports the last question answered in the most recent unfinished attempt", () => {
    const summary = summarisePracticeAttempts([
      { event: "practice_started", detail: { attemptId: "old" }, createdAt: at(0) },
      { event: "practice_answered", detail: { attemptId: "old", questionNumber: 3 }, createdAt: at(5) },
      { event: "practice_started", detail: { attemptId: "new" }, createdAt: at(30) },
      { event: "practice_answered", detail: { attemptId: "new", questionNumber: 1 }, createdAt: at(32) },
      { event: "practice_answered", detail: { attemptId: "new", questionNumber: 2 }, createdAt: at(35) },
    ]);

    expect(summary.lastExitQuestion).toBe(2);
  });

  it("reports 0 when the latest unfinished attempt was left before any answer", () => {
    const summary = summarisePracticeAttempts([
      { event: "practice_started", detail: { attemptId: "a1" }, createdAt: at(0) },
    ]);

    expect(summary.lastExitQuestion).toBe(0);
  });

  it("counts starts recorded before attempt ids existed one by one", () => {
    const summary = summarisePracticeAttempts([
      { event: "practice_started", detail: { roleInput: "Analyst" }, createdAt: at(0) },
      { event: "practice_started", detail: null, createdAt: at(10) },
      { event: "practice_started", detail: { attemptId: "a1" }, createdAt: at(20) },
    ]);

    expect(summary.started).toBe(3);
  });

  it("has no exit question when every tracked attempt was finished", () => {
    const summary = summarisePracticeAttempts([
      { event: "practice_started", detail: { attemptId: "a1" }, createdAt: at(0) },
      { event: "practice_completed", detail: { attemptId: "a1" }, createdAt: at(9) },
    ]);

    expect(summary.lastExitQuestion).toBeNull();
  });
});
