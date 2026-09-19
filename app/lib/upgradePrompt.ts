/**
 * When a candidate whose free trial has ended is sent to the upgrade page.
 *
 * The trial is card-free, so it ends quietly: nothing is charged and nothing
 * converts on its own. Left at that, a lapsed trial came back to a greyed-out
 * Start button and a dismissible banner, and never saw a way to pay. They are
 * now sent to /upgrade on the first page they open in each visit.
 *
 * Once per visit, not every page: saved interviews and reports stay theirs
 * after the trial, and someone who came back to read one must be able to.
 */

export type PlanState = {
  isPaid: boolean;
  isTrial: boolean;
  isComp: boolean;
  trialConsumed: boolean;
};

/** Had the trial, it has ended, and nothing is paying for access now. */
export function trialHasLapsed(plan: PlanState): boolean {
  return plan.trialConsumed && !plan.isTrial && !plan.isPaid && !plan.isComp;
}

/**
 * Paths that must never bounce to /upgrade: the pages that take payment, and
 * anything that is part of a sitting already under way.
 */
const NEVER_REDIRECT = [
  "/upgrade",
  "/pricing",
  "/account",
  "/for-candidates/auth-complete",
  "/practice/session",
  "/assessment-centre",
];

/** Session-storage key recording that this visit has already been asked. */
export const UPGRADE_PROMPTED_KEY = "aim_upgrade_prompted";

export function shouldRedirectToUpgrade(
  plan: PlanState,
  pathname: string,
  alreadyPromptedThisVisit: boolean
): boolean {
  if (alreadyPromptedThisVisit) return false;
  if (!trialHasLapsed(plan)) return false;
  return !NEVER_REDIRECT.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
}
