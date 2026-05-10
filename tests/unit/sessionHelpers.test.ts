/**
 * Tests for sessionHelpers.ts
 */

import { describe, it, expect } from "vitest";
import {
  calculateAverageQuestionScore,
  buildFallbackInterviewSummary,
  createSavedSession,
  prependSavedSession,
} from "../../app/practice/lib/sessionHelpers";
import type { ResultItem } from "../../app/practice/types";

// ─── helpers ─────────────────────────────────────────────────────────────────

const makeResult = (score: number): ResultItem =>
  ({
    feedback: { overall_score: score },
  } as ResultItem);

// ─── calculateAverageQuestionScore ────────────────────────────────────────────

describe("calculateAverageQuestionScore", () => {
  it("returns 0 for empty results", () => {
    expect(calculateAverageQuestionScore([])).toBe(0);
  });

  it("returns the score for a single result", () => {
    expect(calculateAverageQuestionScore([makeResult(8)])).toBe(8);
  });

  it("calculates the average and rounds to 1 decimal place", () => {
    // (7 + 8 + 9) / 3 = 8.0
    expect(calculateAverageQuestionScore([makeResult(7), makeResult(8), makeResult(9)])).toBe(8);
  });

  it("rounds a non-integer average correctly", () => {
    // (6 + 7) / 2 = 6.5
    expect(calculateAverageQuestionScore([makeResult(6), makeResult(7)])).toBe(6.5);
  });

  it("treats missing feedback as 0", () => {
    const noFeedback = { feedback: undefined } as unknown as ResultItem;
    expect(calculateAverageQuestionScore([noFeedback, makeResult(10)])).toBe(5);
  });
});

// ─── buildFallbackInterviewSummary ────────────────────────────────────────────

describe("buildFallbackInterviewSummary", () => {
  it("returns overall_score of 0 for empty results", () => {
    const summary = buildFallbackInterviewSummary([]);
    expect(summary.overall_score).toBe(0);
  });

  it("returns rounded average overall_score", () => {
    // (6 + 8) / 2 = 7
    const summary = buildFallbackInterviewSummary([makeResult(6), makeResult(8)]);
    expect(summary.overall_score).toBe(7);
  });

  it("always includes hire_signal, top_strengths, and top_improvements", () => {
    const summary = buildFallbackInterviewSummary([makeResult(5)]);
    expect(summary.hire_signal).toBe("Moderate");
    expect(Array.isArray(summary.top_strengths)).toBe(true);
    expect(Array.isArray(summary.top_improvements)).toBe(true);
  });

  it("includes an error flag so callers know it is a fallback", () => {
    const summary = buildFallbackInterviewSummary([makeResult(5)]);
    expect(summary.error).toBeTruthy();
  });
});

// ─── createSavedSession ───────────────────────────────────────────────────────

describe("createSavedSession", () => {
  const baseArgs = {
    role: "Nurse",
    interviewType: "Competency",
    difficulty: "Medium",
    totalQuestions: 5,
    summary: {
      overall_score: 7,
      hire_signal: "Moderate" as const,
      top_strengths: [],
      top_improvements: [],
      final_recommendation: "",
      next_steps: [],
    },
  };

  it("sets overallScore from summary", () => {
    const session = createSavedSession(baseArgs);
    expect(session.overallScore).toBe(7);
  });

  it("formats role string as role · type · difficulty", () => {
    const session = createSavedSession(baseArgs);
    expect(session.role).toBe("Nurse · Competency · Medium");
  });

  it("sets totalQuestions correctly", () => {
    const session = createSavedSession(baseArgs);
    expect(session.totalQuestions).toBe(5);
  });

  it("assigns a unique id each time", () => {
    const a = createSavedSession(baseArgs);
    const b = createSavedSession(baseArgs);
    expect(a.id).toBeTruthy();
    expect(b.id).toBeTruthy();
    expect(a.id).not.toBe(b.id);
  });

  it("sets hireSignal from summary", () => {
    const session = createSavedSession(baseArgs);
    expect(session.hireSignal).toBe("Moderate");
  });
});

// ─── prependSavedSession ─────────────────────────────────────────────────────

describe("prependSavedSession", () => {
  const makeSession = (id: string) =>
    ({
      id,
      date: "01/01/2025",
      role: "Test",
      totalQuestions: 3,
      overallScore: 7,
      hireSignal: "Moderate",
    });

  it("prepends the new session at position 0", () => {
    const existing = [makeSession("b"), makeSession("c")];
    const result = prependSavedSession(existing, makeSession("a"));
    expect(result[0].id).toBe("a");
  });

  it("does not exceed the default limit of 8", () => {
    const existing = Array.from({ length: 8 }, (_, i) => makeSession(String(i)));
    const result = prependSavedSession(existing, makeSession("new"));
    expect(result.length).toBe(8);
    expect(result[0].id).toBe("new");
  });

  it("respects a custom limit", () => {
    const existing = [makeSession("b"), makeSession("c"), makeSession("d")];
    const result = prependSavedSession(existing, makeSession("a"), 3);
    expect(result.length).toBe(3);
  });

  it("works with an empty existing list", () => {
    const result = prependSavedSession([], makeSession("a"));
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });
});
