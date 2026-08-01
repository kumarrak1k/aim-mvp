/**
 * Score coherence.
 *
 * Reported from a live session: Content 5, Clarity 6, Relevance 4, Structure 4,
 * Confidence 7 — headline 7. The evidence floors added to fix harsh marking
 * lift overall_score alone, so a generous strengths list pushed the headline
 * three points above a breakdown that could not justify it.
 */
import { describe, it, expect } from "vitest";
import {
  reconcileOverallScore,
  weightedCategoryMean,
  MAX_DIVERGENCE,
} from "../../app/lib/scoreCoherence";

/** The exact breakdown from the reported session. */
const REPORTED = { content: 5, clarity: 6, relevance: 4, structure: 4, confidence: 7 };

describe("weightedCategoryMean", () => {
  it("weights substance above delivery", () => {
    // Strong delivery cannot carry weak substance.
    const thin = weightedCategoryMean({
      content: 3, relevance: 3, structure: 3, clarity: 3, confidence: 10,
    })!;
    expect(thin).toBeLessThan(4);
  });

  it("re-normalises when a category is missing", () => {
    const all = weightedCategoryMean({
      content: 6, relevance: 6, structure: 6, clarity: 6, confidence: 6,
    });
    const partial = weightedCategoryMean({ content: 6, relevance: 6 });
    expect(all).toBeCloseTo(6, 5);
    // A missing category must not drag the mean toward zero.
    expect(partial).toBeCloseTo(6, 5);
  });

  it("returns null when there is nothing to reason about", () => {
    expect(weightedCategoryMean(null)).toBeNull();
    expect(weightedCategoryMean({})).toBeNull();
  });
});

describe("reconcileOverallScore", () => {
  it("pulls the reported 7 down to something the breakdown supports", () => {
    const result = reconcileOverallScore(7, REPORTED);
    expect(result.adjusted).toBe(true);
    expect(result.overall).toBe(6);
    expect(result.categoryMean).toBeLessThan(5.5);
  });

  it("allows holistic judgement within the divergence allowance", () => {
    // An answer can be worth slightly more than the sum of its parts.
    const result = reconcileOverallScore(7, {
      content: 6, relevance: 6, structure: 6, clarity: 6, confidence: 6,
    });
    expect(result.adjusted).toBe(false);
    expect(result.overall).toBe(7);
  });

  it("never raises a score the breakdown would justify", () => {
    // Deliberately one-directional: inflating marks is the worse failure.
    const result = reconcileOverallScore(4, {
      content: 9, relevance: 9, structure: 9, clarity: 9, confidence: 9,
    });
    expect(result.adjusted).toBe(false);
    expect(result.overall).toBe(4);
  });

  it("leaves a strong, coherent answer untouched", () => {
    const result = reconcileOverallScore(9, {
      content: 9, relevance: 9, structure: 8, clarity: 9, confidence: 9,
    });
    expect(result.adjusted).toBe(false);
    expect(result.overall).toBe(9);
  });

  it("keeps 10 reachable when every category earns it", () => {
    const result = reconcileOverallScore(10, {
      content: 10, relevance: 10, structure: 10, clarity: 10, confidence: 10,
    });
    expect(result.overall).toBe(10);
  });

  it("passes through when categories are absent", () => {
    const result = reconcileOverallScore(7, undefined);
    expect(result.overall).toBe(7);
    expect(result.adjusted).toBe(false);
  });

  it("ignores non-numeric noise rather than scoring it zero", () => {
    const result = reconcileOverallScore(7, {
      content: 7, relevance: 7, structure: "n/a", clarity: null, confidence: 7,
    });
    expect(result.overall).toBe(7);
    expect(result.categoryMean).toBeCloseTo(7, 5);
  });

  it("caps divergence at the documented allowance", () => {
    const mean = weightedCategoryMean(REPORTED)!;
    const result = reconcileOverallScore(10, REPORTED);
    expect(result.overall!).toBeLessThanOrEqual(Math.round(mean + MAX_DIVERGENCE));
  });
});
