/**
 * Complimentary access regression.
 *
 * A comp grant sets neither isPaid nor isTrial, so any UI branching only on
 * those two treats an admin-granted Professional guest as a brand-new free
 * user — which is how the "start your free trial" banner came to be shown to
 * someone who already had Professional.
 */
import { describe, it, expect } from "vitest";
import { resolveCandidatePlan } from "../../app/lib/candidatePlan";

const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

describe("comp access is distinguishable from free", () => {
  it("grants Professional without setting isPaid or isTrial", () => {
    const plan = resolveCandidatePlan({ compPlan: "professional", compUntil: future });
    expect(plan.planName).toBe("Professional");
    expect(plan.isProfessional).toBe(true);
    expect(plan.isActive).toBe(true);
    // The exact combination that made comp look like a free user.
    expect(plan.isPaid).toBe(false);
    expect(plan.isTrial).toBe(false);
    // …which is why isComp has to be surfaced to the client.
    expect(plan.isComp).toBe(true);
    expect(plan.compUntil).toBe(future);
  });

  it("does not mark the trial as consumed, so the banner must not offer one", () => {
    const plan = resolveCandidatePlan({ compPlan: "professional", compUntil: future });
    // Both false: the old banner logic fell through to "never trialled" and
    // offered a free trial to someone already on Professional.
    expect(plan.trialConsumed).toBe(false);
    expect(plan.isTrial).toBe(false);
    expect(plan.isComp).toBe(true);
  });

  it("expires cleanly back to Free", () => {
    const plan = resolveCandidatePlan({ compPlan: "professional", compUntil: past });
    expect(plan.planName).toBe("Free");
    expect(plan.isComp).toBe(false);
    expect(plan.compUntil).toBeNull();
  });

  it("supports a Plus-tier comp grant", () => {
    const plan = resolveCandidatePlan({ compPlan: "plus", compUntil: future });
    expect(plan.planName).toBe("Plus");
    expect(plan.isComp).toBe(true);
    expect(plan.isProfessional).toBe(false);
  });

  it("lets a real paid plan take precedence over comp", () => {
    const plan = resolveCandidatePlan({
      subscriptionStatus: "active",
      stripePlanId: "professional_monthly",
      compPlan: "plus",
      compUntil: future,
    });
    expect(plan.planName).toBe("Professional");
    expect(plan.isPaid).toBe(true);
    expect(plan.isComp).toBe(false);
  });

  it("keeps a plain free user free", () => {
    const plan = resolveCandidatePlan({});
    expect(plan.planName).toBe("Free");
    expect(plan.isComp).toBe(false);
    expect(plan.isActive).toBe(false);
  });
});
