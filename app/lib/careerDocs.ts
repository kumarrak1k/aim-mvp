/**
 * Career-doc access control + generation logging.
 *
 * Career-doc tools (CV enhancer, personal statement, cover letter) are a
 * Professional-only feature. During the no-card free trial they are available
 * but subject to a fair-usage cap to keep OpenAI costs economical.
 * Every successful generation is logged in CareerDocGeneration, which both
 * powers the trial cap (counted since trial start) and serves as a history.
 */

import { prisma } from "./prisma";
import { getCandidatePlan, TRIAL_USAGE_CAPS } from "./candidatePlan";
import { recordActivity, ACTIVITY_EVENTS } from "./activity";

export type CareerDocKind =
  | "cv-enhancer"
  | "personal-statement"
  | "cover-letter";

export type CareerDocAccess =
  | { ok: true }
  | { ok: false; status: number; error: string; upgrade: boolean };

/**
 * Gate a career-doc generation. `label` is the human name of the tool, used
 * in the Professional-required message (e.g. "CV Enhancer").
 */
export async function checkCareerDocAccess(
  userId: string,
  label: string
): Promise<CareerDocAccess> {
  const plan = await getCandidatePlan(userId);

  if (!plan.isProfessional) {
    // A blocked attempt is demand for the Professional tier — count it.
    recordActivity(userId, ACTIVITY_EVENTS.CAREER_DOC_BLOCKED, plan, {
      reason: "plan",
      tool: label,
    });
    return {
      ok: false,
      status: 403,
      error: `${label} requires the Professional plan.`,
      upgrade: true,
    };
  }

  // Fair-usage cap during the free trial only — paid Professional is unlimited.
  if (plan.isTrial) {
    const since = plan.trialStartedAt
      ? new Date(plan.trialStartedAt)
      : undefined;
    const used = await prisma.careerDocGeneration.count({
      where: { clerkUserId: userId, ...(since && { createdAt: { gte: since } }) },
    });
    if (used >= TRIAL_USAGE_CAPS.careerDocs) {
      recordActivity(userId, ACTIVITY_EVENTS.CAREER_DOC_BLOCKED, plan, {
        reason: "trial_cap",
        tool: label,
        used,
      });
      return {
        ok: false,
        status: 429,
        error: `Your free trial includes ${TRIAL_USAGE_CAPS.careerDocs} career-doc generations. Upgrade to Professional for unlimited access.`,
        upgrade: true,
      };
    }
  }

  return { ok: true };
}

/** Log a successful generation (non-fatal — never breaks the user's request). */
export async function recordCareerDocGeneration(
  userId: string,
  kind: CareerDocKind
): Promise<void> {
  try {
    await prisma.careerDocGeneration.create({
      data: { clerkUserId: userId, kind },
    });
  } catch {
    // Swallow — logging must never fail the actual generation response.
  }
}
