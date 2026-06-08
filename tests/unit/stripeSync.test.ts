/**
 * Tests for stripeSync.ts — the mapping logic shared by the Stripe webhooks
 * AND the nightly reconcile job (app/lib/stripeReconcile.ts).
 *
 * These functions decide what a candidate's Clerk metadata / a company's
 * planStatus SHOULD be for a given Stripe subscription. Because the unattended
 * reconciler writes records based on them, a silent change here could revoke a
 * paying user's access — so the mappings are pinned down explicitly.
 */

import { describe, it, expect, vi, afterEach } from "vitest";
import type Stripe from "stripe";
import {
  isCorporateSubscription,
  candidateUpsertMeta,
  candidateDeletedMeta,
  mapCorporatePlanStatus,
  corporateUpsertData,
  corporateDeletedData,
  subscriptionPeriodEnd,
  candidatePlanIdFromSubscription,
  corporatePlanIdFromSubscription,
} from "@/app/lib/stripeSync";

type SubOverrides = {
  id?: string;
  customer?: string;
  status?: Stripe.Subscription.Status;
  metadata?: Record<string, string>;
  lookupKey?: string | null;
  priceId?: string;
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
          price: { id: o.priceId, lookup_key: o.lookupKey ?? null },
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

  it("prefers the live price lookup_key over a stale metadata.planId", () => {
    // A Customer-Portal plan switch changes the price's lookup_key but NOT
    // metadata.planId — the live price must win or the portal upgrade is lost.
    const meta = candidateUpsertMeta(
      makeSub({
        metadata: { clerkUserId: "user_1", planId: "plus_monthly" },
        lookupKey: "professional_monthly",
      }),
    );
    expect(meta.stripePlanId).toBe("professional_monthly");
  });

  it("leaves stripePlanId undefined when neither planId nor lookup_key exists", () => {
    const meta = candidateUpsertMeta(makeSub({ metadata: { clerkUserId: "user_1" }, lookupKey: null }));
    expect(meta.stripePlanId).toBeUndefined();
  });

  it("carries the raw Stripe status through (e.g. past_due)", () => {
    const meta = candidateUpsertMeta(makeSub({ status: "past_due", metadata: { clerkUserId: "u" } }));
    expect(meta.subscriptionStatus).toBe("past_due");
  });
});

// ─── candidateDeletedMeta ─────────────────────────────────────────────────────

describe("candidateDeletedMeta", () => {
  it("marks cancelled, clears plan + period end, and expires any reverse trial", () => {
    // trialEndsAt is forced to the epoch so a mid-trial cancellation drops the
    // user to Free instead of falling back to the (still-future) Plus trial.
    expect(candidateDeletedMeta(makeSub({ id: "sub_y" }))).toEqual({
      stripeSubscriptionId: "sub_y",
      stripePlanId: undefined,
      subscriptionStatus: "cancelled",
      subscriptionCurrentPeriodEnd: undefined,
      trialEndsAt: new Date(0).toISOString(),
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

  it("derives planId from metadata.planId when present", () => {
    const data = corporateUpsertData(makeSub({ metadata: { companyId: "co_1", planId: "team" } }));
    expect(data.planId).toBe("team");
  });

  it("derives planId from the price lookup_key (a plan change swaps the price, not metadata)", () => {
    // Business↔Team via a Stripe schedule changes the live price's lookup_key but
    // never touches metadata.planId — deriving from the price closes the revenue
    // leak where a downgraded company kept Business seats/invites.
    const data = corporateUpsertData(makeSub({ lookupKey: "corporate_business_monthly" }));
    expect(data.planId).toBe("business");
  });

  it("omits planId when the price can't be mapped (never clobbers Company.planId with a guess)", () => {
    const data = corporateUpsertData(makeSub({ lookupKey: null }));
    expect(data).not.toHaveProperty("planId");
  });
});

// ─── corporateDeletedData ─────────────────────────────────────────────────────

describe("corporateDeletedData", () => {
  it("cancels the plan but PRESERVES the period end so the UI can show 'access until X'", () => {
    expect(corporateDeletedData(makeSub({ id: "sub_d", periodEnd: 1_900_000_000 }))).toEqual({
      planStatus: "cancelled",
      stripeSubscriptionId: "sub_d",
      stripeCurrentPeriodEnd: new Date(1_900_000_000 * 1000),
    });
  });

  it("uses a null period end only when Stripe itself has none", () => {
    expect(corporateDeletedData(makeSub({ periodEnd: null })).stripeCurrentPeriodEnd).toBeNull();
  });
});

// ─── candidatePlanIdFromSubscription (price-primary tier resolution) ──────────
// Why this matters: a Customer-Portal switch or a scheduled phase swap changes
// the live PRICE but never metadata.planId. Deriving the tier from the price
// keeps the webhook AND the reconcile correct; metadata is only a last resort.

describe("candidatePlanIdFromSubscription", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("prefers a known price lookup_key", () => {
    expect(candidatePlanIdFromSubscription(makeSub({ lookupKey: "plus_annual" }))).toBe("plus_annual");
  });

  it("maps a configured Stripe price id when lookup_key is absent", () => {
    vi.stubEnv("STRIPE_PRICE_PROFESSIONAL_MONTHLY", "price_pro_m");
    expect(
      candidatePlanIdFromSubscription(makeSub({ lookupKey: null, priceId: "price_pro_m" })),
    ).toBe("professional_monthly");
  });

  it("ignores an UNKNOWN lookup_key and uses the price-id map instead", () => {
    vi.stubEnv("STRIPE_PRICE_PLUS_MONTHLY", "price_plus_m");
    expect(
      candidatePlanIdFromSubscription(makeSub({ lookupKey: "legacy_key", priceId: "price_plus_m" })),
    ).toBe("plus_monthly");
  });

  it("falls back to metadata.planId only as a last resort", () => {
    expect(
      candidatePlanIdFromSubscription(makeSub({ lookupKey: null, metadata: { planId: "plus_monthly" } })),
    ).toBe("plus_monthly");
  });

  it("returns null when nothing resolves", () => {
    expect(candidatePlanIdFromSubscription(makeSub({ lookupKey: null }))).toBeNull();
  });
});

// ─── corporatePlanIdFromSubscription (closes the downgrade revenue leak) ──────

describe("corporatePlanIdFromSubscription", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("maps a configured Stripe price id to team / business", () => {
    vi.stubEnv("STRIPE_PRICE_CORPORATE_BUSINESS_ANNUAL", "price_biz_y");
    expect(corporatePlanIdFromSubscription(makeSub({ priceId: "price_biz_y" }))).toBe("business");
  });

  it("derives the tier from a lookup_key substring when no price-id match", () => {
    expect(corporatePlanIdFromSubscription(makeSub({ lookupKey: "corporate_team_monthly" }))).toBe("team");
    expect(corporatePlanIdFromSubscription(makeSub({ lookupKey: "acme_business_plan" }))).toBe("business");
  });

  it("price-id map wins over a conflicting lookup_key", () => {
    vi.stubEnv("STRIPE_PRICE_CORPORATE_TEAM_MONTHLY", "price_team_m");
    expect(
      corporatePlanIdFromSubscription(makeSub({ priceId: "price_team_m", lookupKey: "legacy_business" })),
    ).toBe("team");
  });

  it("falls back to metadata.planId, and returns null when unresolvable", () => {
    expect(
      corporatePlanIdFromSubscription(makeSub({ lookupKey: null, metadata: { planId: "business" } })),
    ).toBe("business");
    expect(corporatePlanIdFromSubscription(makeSub({ lookupKey: null }))).toBeNull();
  });
});
