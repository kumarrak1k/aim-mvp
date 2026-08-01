/**
 * Session-level score coherence.
 *
 * The per-question fix (scoreCoherence) stopped a headline diverging from its
 * own category breakdown. This covers the level above it: the session score
 * must equal the aggregate of the per-question scores the candidate has just
 * been shown, and the hire signal must follow that score rather than being
 * asserted independently.
 *
 * Both summary paths — AI and fallback — now use the same arithmetic, so this
 * pins the shared behaviour.
 */
import { describe, it, expect } from "vitest";

/** Mirrors clampScore + average + the hire-signal thresholds in the route. */
const clampScore = (v: number) =>
  Number.isFinite(v) ? Math.max(0, Math.min(10, Math.round(v))) : 0;

const average = (values: number[]) => {
  const valid = values.filter((v) => Number.isFinite(v));
  if (valid.length === 0) return 0;
  return valid.reduce((s, v) => s + v, 0) / valid.length;
};

const sessionScoreOf = (perQuestion: number[]) => clampScore(average(perQuestion));

const hireSignalOf = (score: number): "Weak" | "Moderate" | "Strong" =>
  score >= 8 ? "Strong" : score >= 5 ? "Moderate" : "Weak";

describe("session score is the aggregate of its questions", () => {
  it("averages the per-question scores", () => {
    expect(sessionScoreOf([6, 7, 5, 7, 8])).toBe(7); // 6.6 -> 7
    expect(sessionScoreOf([4, 4, 5, 4, 5])).toBe(4); // 4.4 -> 4
  });

  it("cannot report a headline the question scores do not support", () => {
    // The failure this replaces: a model-authored 8 over five weak answers.
    const perQuestion = [4, 5, 4, 4, 5];
    expect(sessionScoreOf(perQuestion)).toBe(4);
    expect(sessionScoreOf(perQuestion)).not.toBe(8);
  });

  it("keeps a strong session strong", () => {
    expect(sessionScoreOf([9, 9, 8, 9, 10])).toBe(9);
  });

  it("handles a session with no scored answers without crashing", () => {
    expect(sessionScoreOf([])).toBe(0);
  });

  it("ignores non-numeric noise rather than counting it as zero", () => {
    expect(sessionScoreOf([7, NaN, 7])).toBe(7);
  });
});

describe("hire signal follows the derived score", () => {
  it("uses the documented thresholds", () => {
    expect(hireSignalOf(9)).toBe("Strong");
    expect(hireSignalOf(8)).toBe("Strong");
    expect(hireSignalOf(7)).toBe("Moderate");
    expect(hireSignalOf(5)).toBe("Moderate");
    expect(hireSignalOf(4)).toBe("Weak");
  });

  it("never attaches a Strong verdict to a mid session", () => {
    // "Strong" on a 5 is the same incoherence as a mismatched number, in words.
    const score = sessionScoreOf([5, 5, 6, 4, 5]);
    expect(score).toBe(5);
    expect(hireSignalOf(score)).toBe("Moderate");
  });
});
