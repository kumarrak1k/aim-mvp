/**
 * Keeps the headline score consistent with the category breakdown.
 *
 * The two are produced by the same model call but scored independently, and
 * the evidence floors in the feedback prompt ("credited a real example →
 * overall >= 6", "→ ownership >= 7") act on overall_score ALONE. When the
 * categories disagree, the candidate sees Content 5, Relevance 4, Structure 4
 * and a headline of 7 — arithmetic that cannot be reconciled from the screen
 * and reads as the number being made up.
 *
 * The floors exist for a good reason: they fixed genuinely harsh marking that
 * contradicted its own praise. So this does not discard them, it bounds them.
 * The headline may sit above the weighted mean — holistic judgement is real,
 * and an answer can be worth more than the sum of its parts — but not by so
 * much that the breakdown stops explaining it.
 *
 * Weighting favours substance over delivery: an interview is won on what was
 * said, and confidence should not carry a thin answer.
 */

export const CATEGORY_WEIGHTS = {
  content: 0.3,
  relevance: 0.25,
  structure: 0.2,
  clarity: 0.15,
  confidence: 0.1,
} as const;

/** How far the headline may exceed the weighted category mean. */
export const MAX_DIVERGENCE = 1;

export type CategoryScores = Partial<Record<keyof typeof CATEGORY_WEIGHTS, unknown>>;

function score(v: unknown): number | null {
  if (typeof v !== "number" || !Number.isFinite(v)) return null;
  return Math.max(0, Math.min(10, v));
}

/**
 * Weighted mean of the categories actually present, or null when there are
 * none to reason about (in which case the model's overall stands unchanged).
 */
export function weightedCategoryMean(categories: CategoryScores | null | undefined): number | null {
  if (!categories) return null;

  let total = 0;
  let weightUsed = 0;
  for (const [key, weight] of Object.entries(CATEGORY_WEIGHTS)) {
    const value = score(categories[key as keyof typeof CATEGORY_WEIGHTS]);
    if (value === null) continue;
    total += value * weight;
    weightUsed += weight;
  }
  if (weightUsed === 0) return null;

  // Re-normalise so a missing category doesn't silently drag the mean down.
  return total / weightUsed;
}

/**
 * Reconcile the headline score with the breakdown.
 *
 * Only ever pulls the headline DOWN toward the categories, never up: raising a
 * score the breakdown cannot justify would trade one incoherence for another,
 * and inflating marks is the failure mode this product can least afford.
 */
export function reconcileOverallScore(
  overall: unknown,
  categories: CategoryScores | null | undefined
): { overall: number | null; adjusted: boolean; categoryMean: number | null } {
  const stated = score(overall);
  const mean = weightedCategoryMean(categories);

  if (stated === null || mean === null) {
    return { overall: stated, adjusted: false, categoryMean: mean };
  }

  const ceiling = Math.round(mean + MAX_DIVERGENCE);
  if (stated <= ceiling) {
    return { overall: stated, adjusted: false, categoryMean: mean };
  }

  return {
    overall: Math.max(0, Math.min(10, ceiling)),
    adjusted: true,
    categoryMean: mean,
  };
}
