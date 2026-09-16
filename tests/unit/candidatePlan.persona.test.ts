/**
 * Persona entitlement matrix — locks `resolveCandidatePlan()` for every
 * test-pack persona.
 *
 * This resolver is the single source of truth every candidate feature gate
 * depends on (unlimited sessions, voice/camera, assessment centre, Advanced
 * question mix). A regression here would silently break plan gating, so the
 * full persona table is pinned. Pure function, no I/O.
 *
 * Keep the PERSONAS here in sync with tests/e2e/fixtures/personas.ts so the
 * seeded E2E users and this unit matrix can never disagree about what each
 * persona resolves to.
 */
import { describe, it, expect, vi } from "vitest";

// candidatePlan.ts imports `clerkClient` at module load (for getCandidatePlan /
// startCandidateTrialIfEligible). resolveCandidatePlan itself is pure — stub the
// server SDK so importing the module doesn't pull Clerk's server runtime into
// the jsdom test environment.
vi.mock("@clerk/nextjs/server", () => ({ clerkClient: vi.fn() }));

import { resolveCandidatePlan, type CandidateBillingMeta } from "@/app/lib/candidatePlan";

const NOW = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const iso = (ms: number) => new Date(ms).toISOString();

const PERSONAS: Record<string, CandidateBillingMeta> = {
  free: { trialConsumed: true, trialEndsAt: "2020-01-01T00:00:00Z" },
  trial: { trialStartedAt: iso(NOW - 0.5 * DAY), trialEndsAt: iso(NOW + 6.5 * DAY), trialConsumed: true },
  plus: { subscriptionStatus: "active", stripePlanId: "plus_monthly", trialConsumed: true },
  professional: { subscriptionStatus: "active", stripePlanId: "professional_annual", trialConsumed: true },
};

describe("resolveCandidatePlan — persona matrix", () => {
  it("Free: consumed/expired trial, no subscription → Free, locked", () => {
    const p = resolveCandidatePlan(PERSONAS.free);
    expect(p.planName).toBe("Free");
    expect(p.effectivePlan).toBe("free");
    expect(p.isPaid).toBe(false);
    expect(p.isActive).toBe(false);
    expect(p.isUnlimited).toBe(false);
    expect(p.isProfessional).toBe(false);
    expect(p.isTrial).toBe(false);
  });

  it("Trial: the no-card trial grants the whole product, isTrial", () => {
    const p = resolveCandidatePlan(PERSONAS.trial);
    expect(p.planName).toBe("Pro");
    expect(p.effectivePlan).toBe("pro");
    expect(p.isTrial).toBe(true);
    expect(p.isPaid).toBe(false);
    expect(p.isUnlimited).toBe(true);
    expect(p.isPro).toBe(true);
    expect(p.trialDaysRemaining).toBe(7);
  });

  // The retired tiers still exist on old subscriptions: those people keep the
  // full product rather than being dropped to Free by a pricing change.
  it("Legacy Plus subscriber → Pro", () => {
    const p = resolveCandidatePlan(PERSONAS.plus);
    expect(p.planName).toBe("Pro");
    expect(p.effectivePlan).toBe("pro");
    expect(p.isPaid).toBe(true);
    expect(p.paidPlanName).toBe("Pro");
    expect(p.isUnlimited).toBe(true);
    expect(p.isPro).toBe(true);
    expect(p.isTrial).toBe(false);
  });

  it("Legacy Professional subscriber → Pro", () => {
    const p = resolveCandidatePlan(PERSONAS.professional);
    expect(p.planName).toBe("Pro");
    expect(p.effectivePlan).toBe("pro");
    expect(p.isPaid).toBe(true);
    expect(p.paidPlanName).toBe("Pro");
    expect(p.isPro).toBe(true);
    expect(p.isUnlimited).toBe(true);
  });

  it("Pro (paid): each billing period resolves the same", () => {
    for (const planId of ["pro_monthly", "pro_quarterly", "pro_annual"]) {
      const p = resolveCandidatePlan({ subscriptionStatus: "active", stripePlanId: planId });
      expect(p.planName).toBe("Pro");
      expect(p.isPaid).toBe(true);
      expect(p.isUnlimited).toBe(true);
    }
  });

  // ── Precedence / edge cases the gates rely on ─────────────────────────────
  it("a paid subscription overrides an active trial (paid wins, isTrial=false)", () => {
    const p = resolveCandidatePlan({
      subscriptionStatus: "active",
      stripePlanId: "professional_annual",
      trialStartedAt: iso(NOW),
      trialEndsAt: iso(NOW + 6.5 * DAY),
      trialConsumed: true,
    });
    expect(p.isPaid).toBe(true);
    expect(p.isTrial).toBe(false);
    expect(p.planName).toBe("Pro");
  });

  it("null / empty metadata → Free", () => {
    expect(resolveCandidatePlan(null).planName).toBe("Free");
    expect(resolveCandidatePlan({}).planName).toBe("Free");
  });

  it("past_due grants a grace window (mirrors corporate dunning): keeps paid access, flags isPastDue", () => {
    const p = resolveCandidatePlan({ subscriptionStatus: "past_due", stripePlanId: "pro_monthly" });
    expect(p.isPaid).toBe(true);
    expect(p.planName).toBe("Pro");
    expect(p.effectivePlan).toBe("pro");
    expect(p.isUnlimited).toBe(true);
    expect(p.isPastDue).toBe(true);
  });

  it("past_due keeps every feature during the grace window", () => {
    const p = resolveCandidatePlan({ subscriptionStatus: "past_due", stripePlanId: "professional_annual" });
    expect(p.isPro).toBe(true);
    expect(p.isPastDue).toBe(true);
  });

  it("a healthy active subscription is not flagged past_due", () => {
    expect(resolveCandidatePlan(PERSONAS.plus).isPastDue).toBe(false);
    expect(resolveCandidatePlan(PERSONAS.trial).isPastDue).toBe(false);
  });

  it("Stripe 'trialing' status counts as paid/active", () => {
    const p = resolveCandidatePlan({ subscriptionStatus: "trialing", stripePlanId: "pro_monthly" });
    expect(p.isPaid).toBe(true);
    expect(p.paidPlanName).toBe("Pro");
  });
});
