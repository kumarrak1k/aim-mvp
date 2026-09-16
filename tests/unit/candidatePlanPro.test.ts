/**
 * The single-plan model (Sep 2026).
 *
 * Free and Plus are gone: there is one paid plan, Pro, sold monthly,
 * quarterly or yearly, with a 3-day no-card trial in front of it. After the
 * trial a candidate keeps their past results but cannot start a new interview.
 *
 * Accounts created under the old model must not lose access: a paid or
 * complimentary "plus"/"professional" record still resolves to Pro.
 */
import { describe, it, expect, vi } from "vitest";

vi.mock("@clerk/nextjs/server", () => ({ clerkClient: vi.fn() }));

import {
  resolveCandidatePlan,
  FREE_TIER,
  TRIAL_DURATION_DAYS,
  type CandidateBillingMeta,
} from "@/app/lib/candidatePlan";

const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const iso = (ms: number) => new Date(ms).toISOString();

describe("single Pro plan", () => {
  it("gives a signed-up candidate with no trial and no subscription nothing to practise with", () => {
    const p = resolveCandidatePlan({ trialConsumed: true, trialEndsAt: iso(NOW - DAY) });

    expect(p.planName).toBe("Free");
    expect(p.effectivePlan).toBe("free");
    expect(p.isActive).toBe(false);
    expect(p.isUnlimited).toBe(false);
    expect(p.isPro).toBe(false);
  });

  it("treats the no-card trial as full Pro access", () => {
    const p = resolveCandidatePlan({
      trialStartedAt: iso(NOW - 0.5 * DAY),
      trialEndsAt: iso(NOW + 2.5 * DAY),
      trialConsumed: true,
    });

    expect(p.planName).toBe("Pro");
    expect(p.effectivePlan).toBe("pro");
    expect(p.isTrial).toBe(true);
    expect(p.isPaid).toBe(false);
    expect(p.isUnlimited).toBe(true);
    expect(p.isPro).toBe(true);
  });

  it("recognises each Pro billing period as a paid Pro subscription", () => {
    for (const planId of ["pro_monthly", "pro_quarterly", "pro_annual"]) {
      const p = resolveCandidatePlan({ subscriptionStatus: "active", stripePlanId: planId });

      expect(p.planName).toBe("Pro");
      expect(p.isPaid).toBe(true);
      expect(p.isPro).toBe(true);
    }
  });

  it("keeps old Plus and Professional subscribers on Pro", () => {
    for (const planId of ["plus_monthly", "plus_annual", "professional_monthly", "professional_annual"]) {
      const p = resolveCandidatePlan({ subscriptionStatus: "active", stripePlanId: planId });

      expect(p.effectivePlan).toBe("pro");
      expect(p.isPaid).toBe(true);
    }
  });

  it("keeps complimentary access working, whatever tier it was granted as", () => {
    for (const compPlan of ["pro", "plus", "professional"]) {
      const p = resolveCandidatePlan({ compPlan, compUntil: iso(NOW + 30 * DAY) });

      expect(p.effectivePlan).toBe("pro");
      expect(p.isComp).toBe(true);
      expect(p.isPaid).toBe(false);
    }
  });

  it("ends complimentary access when it expires", () => {
    const p = resolveCandidatePlan({ compPlan: "pro", compUntil: iso(NOW - DAY) });

    expect(p.effectivePlan).toBe("free");
    expect(p.isComp).toBe(false);
  });

  it("keeps a past-due subscriber in place during Stripe's retry window", () => {
    const p = resolveCandidatePlan({ subscriptionStatus: "past_due", stripePlanId: "pro_monthly" });

    expect(p.isPro).toBe(true);
    expect(p.isPastDue).toBe(true);
  });

  it("allows no practice at all once the trial is over", () => {
    expect(FREE_TIER.practiceSessionsPerWindow).toBe(0);
    expect(FREE_TIER.assessmentCentres).toBe(0);
    expect(FREE_TIER.careerDocs).toBe(0);
  });

  it("keeps the trial at three days", () => {
    expect(TRIAL_DURATION_DAYS).toBe(3);
  });
});
