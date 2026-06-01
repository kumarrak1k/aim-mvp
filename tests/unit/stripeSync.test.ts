/**
 * Tests for stripeSync.ts — the mapping logic shared by the Stripe webhooks
 * AND the nightly reconcile job (app/lib/stripeReconcile.ts).
 *
 * These functions decide what a candidate's Clerk metadata / a company's
 * planStatus SHOULD be for a given Stripe subscription. Because the unattended
 * reconciler writes records based on them, a silent change here could revoke a
 * paying user's access — so the mappings are pinned down explicitly.
 */

import { describe, it, expect } from "vitest";
import type Stripe from "stripe";
import {
  isCorporateSubscription,
  candidateUpsertMeta,
  candidateDeletedMeta,
  mapCorporatePlanStatus,
  corporateUpsertData,
  corporateDeletedData,
  subscriptionPeriodEnd,
} from "@/app/lib/stripeSync";

type SubOverrides = {
  id?: string;
  customer?: string;
  status?: Stripe.Subscription.Status;
  metadata?: Record<string, string>;
  lookupKey?: string | null;
  periodEnd?: number | null;
};

/** Minimal Stripe.Subscription shaped just enough for the helpers under test. */
function makeSub(o: SubOverrides = {}): Stripe.Subscription {
  return {
    id: o.id ?? "sub_123",
    customer: o.customer ?? "cus_123",
    status: o.status ?? "active",
    metadata: o.metadata ?? {},
    items: {
      data: [
        {
          price: { lookup_key: o.lookupKey ?? null },
          current_period_end: o.periodEnd === undefined ? 1_900_000_000 : o.periodEnd,
        },
      ],
    },
  } as unknown as Stripe.Subscription;
}

// ─── subscriptionPeriodEnd ────────────────────────────────────────────────────

describe("subscriptionPeriodEnd", () => {
  it("reads current_period_end from the first subscription item", () => {
    expect(subscriptionPeriodEnd(makeSub({ periodEnd: 1_700_000_000 }))).toBe(1_700_000_000);
  });

  it("returns null when no period end is present", () => {
    expect(subscriptionPeriodEnd(makeSub({ periodEnd: null }))).toBeNull();
  });
});

// ─── isCorporateSubscription ──────────────────────────────────────────────────

describe("isCorporateSubscription", () => {
  it("is true when planType is corporate", () => {
    expect(isCorporateSubscription(makeSub({ metadata: { planType: "corporate" } }))).toBe(true);
  });

  it("is true when a companyId is present", () => {
    expect(isCorporateSubscription(makeSub({ metadata: { companyId: "co_1" } }))).toBe(true);
  });

  it("is false for a candidate subscription (clerkUserId only)", () => {
    expect(isCorporateSubscription(makeSub({ metadata: { clerkUserId: "user_1" } }))).toBe(false);
  });

  it("is false when metadata is empty", () => {
    expect(isCorporateSubscription(makeSub({ metadata: {} }))).toBe(false);
  });
});

// ─── candidateUpsertMeta ──────────────────────────────────────────────────────

describe("candidateUpsertMeta", () => {
  it("builds the full metadata patch from metadata.planId", () => {
    expect(
      candidateUpsertMeta(
        makeSub({
          id: "sub_x",
          customer: "cus_x",
          status: "active",
          metadata: { clerkUserId: "user_1", planId: "plus_monthly" },
          periodEnd: 1_700_000_000,
        }),
      ),
    ).toEqual({
      stripeCustomerId: "cus_x",
      stripeSubscriptionId: "sub_x",
      stripePlanId: "plus_monthly",
      subscriptionStatus: "active",
      subscriptionCurrentPeriodEnd: 1_700_000_000,
    });
  });

  it("falls back to the price lookup_key when metadata.planId is absent", () => {
    const meta = candidateUpsertMeta(
      makeSub({ metadata: { clerkUserId: "user_1" }, lookupKey: "professional_annual" }),
    );
    expect(meta.stripePlanId).toBe("professional_annual");
  });

  it("uses null planId when neither planId nor lookup_key exists", () => {
    const meta = candidateUpsertMeta(makeSub({ metadata: { clerkUserId: "user_1" }, lookupKey: null }));
    expect(meta.stripePlanId).toBeNull();
  });

  it("carries the raw Stripe status through (e.g. past_due)", () => {
    const meta = candidateUpsertMeta(makeSub({ status: "past_due", metadata: { clerkUserId: "u" } }));
    expect(meta.subscriptionStatus).toBe("past_due");
  });
});

// ─── candidateDeletedMeta ─────────────────────────────────────────────────────

describe("candidateDeletedMeta", () => {
  it("marks the subscription cancelled and clears plan + period end", () => {
    expect(candidateDeletedMeta(makeSub({ id: "sub_y" }))).toEqual({
      stripeSubscriptionId: "sub_y",
      stripePlanId: undefined,
      subscriptionStatus: "cancelled",
      subscriptionCurrentPeriodEnd: undefined,
    });
  });

  it("does not touch stripeCustomerId (preserves the existing one on merge)", () => {
    expect(candidateDeletedMeta(makeSub())).not.toHaveProperty("stripeCustomerId");
  });
});

// ─── mapCorporatePlanStatus ───────────────────────────────────────────────────

describe("mapCorporatePlanStatus", () => {
  it("maps active and trialing to active", () => {
    expect(mapCorporatePlanStatus("active")).toBe("active");
    expect(mapCorporatePlanStatus("trialing")).toBe("active");
  });

  it("keeps past_due active so Stripe Smart Retries can recover payment", () => {
    expect(mapCorporatePlanStatus("past_due")).toBe("active");
  });

  it("maps every other status to expired", () => {
    for (const status of [
      "canceled",
      "unpaid",
      "incomplete",
      "incomplete_expired",
      "paused",
    ] as const) {
      expect(mapCorporatePlanStatus(status)).toBe("expired");
    }
  });
});

// ─── corporateUpsertData ──────────────────────────────────────────────────────

describe("corporateUpsertData", () => {
  it("builds the Company update for an active subscription", () => {
    expect(
      corporateUpsertData(
        makeSub({ id: "sub_c", customer: "cus_c", status: "active", periodEnd: 1_800_000_000 }),
      ),
    ).toEqual({
      planStatus: "active",
      stripeCustomerId: "cus_c",
      stripeSubscriptionId: "sub_c",
      stripeCurrentPeriodEnd: new Date(1_800_000_000 * 1000),
    });
  });

  it("sets stripeCurrentPeriodEnd to null when Stripe has no period end", () => {
    expect(corporateUpsertData(makeSub({ periodEnd: null })).stripeCurrentPeriodEnd).toBeNull();
  });

  it("downgrades planStatus to expired for a non-live status", () => {
    expect(corporateUpsertData(makeSub({ status: "unpaid" })).planStatus).toBe("expired");
  });
});

// ─── corporateDeletedData ─────────────────────────────────────────────────────

describe("corporateDeletedData", () => {
  it("cancels the company plan and clears the period end", () => {
    expect(corporateDeletedData(makeSub({ id: "sub_d" }))).toEqual({
      planStatus: "cancelled",
      stripeSubscriptionId: "sub_d",
      stripeCurrentPeriodEnd: null,
    });
  });
});
