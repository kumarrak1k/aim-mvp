import type Stripe from "stripe";

/**
 * Pure decision helpers shared by the Stripe webhooks AND the nightly
 * reconcile job (app/lib/stripeReconcile.ts).
 *
 * Keeping the classification + status-mapping logic in ONE place means the
 * unattended reconciler can never drift from the real-time webhook handlers:
 * if a mapping changes here, both the webhook and the reconcile pick it up.
 * No I/O lives in this file — these are deterministic functions of a Stripe
 * subscription, easy to reason about and unit-test.
 *
 * Webhook callers:
 *   POST /api/stripe/webhook   — candidate → Clerk privateMetadata
 *   POST /api/webhooks/stripe  — corporate → Prisma Company
 */

/**
 * Reads the current period end (unix seconds) from a subscription. On the
 * pinned API version (2026-04-22.dahlia) this moved onto the subscription
 * ITEM, so read the item first and fall back to the subscription field.
 */
export function subscriptionPeriodEnd(
  subscription: Stripe.Subscription,
): number | null {
  const item = subscription.items?.data?.[0] as
    | (Stripe.SubscriptionItem & { current_period_end?: number })
    | undefined;
  const fromItem = item?.current_period_end;
  const fromSub = (subscription as Stripe.Subscription & {
    current_period_end?: number;
  }).current_period_end;
  return fromItem ?? fromSub ?? null;
}

// ── Candidate (Clerk privateMetadata) ────────────────────────────────────────

export type CandidateSubscriptionMeta = {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePlanId?: string;
  subscriptionStatus?: string;
  subscriptionCurrentPeriodEnd?: number;
};

/** True if this subscription belongs to a corporate workspace, not a candidate. */
export function isCorporateSubscription(subscription: Stripe.Subscription): boolean {
  return (
    subscription.metadata?.planType === "corporate" ||
    Boolean(subscription.metadata?.companyId)
  );
}

/** Clerk privateMetadata patch for an active/updated candidate subscription. */
export function candidateUpsertMeta(
  subscription: Stripe.Subscription,
): CandidateSubscriptionMeta {
  const item = subscription.items.data[0];
  const periodEnd = subscriptionPeriodEnd(subscription);
  return {
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    stripePlanId: subscription.metadata?.planId ?? item?.price?.lookup_key ?? null,
    subscriptionStatus: subscription.status,
    subscriptionCurrentPeriodEnd: periodEnd ?? undefined,
  };
}

/** Clerk privateMetadata patch for a cancelled candidate subscription. */
export function candidateDeletedMeta(
  subscription: Stripe.Subscription,
): CandidateSubscriptionMeta {
  return {
    stripeSubscriptionId: subscription.id,
    stripePlanId: undefined,
    subscriptionStatus: "cancelled",
    subscriptionCurrentPeriodEnd: undefined,
  };
}

// ── Corporate (Prisma Company) ───────────────────────────────────────────────

/**
 * Map a Stripe subscription status → Company.planStatus for an upsert.
 * `past_due` deliberately stays "active" — Stripe Smart Retries are still
 * attempting payment; the dunning schedule cancels the sub if they all fail.
 */
export function mapCorporatePlanStatus(
  stripeStatus: Stripe.Subscription.Status,
): "active" | "expired" {
  return stripeStatus === "active" || stripeStatus === "trialing"
    ? "active"
    : stripeStatus === "past_due"
      ? "active"
      : "expired";
}

export type CorporateUpsertData = {
  planStatus: "active" | "expired";
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripeCurrentPeriodEnd: Date | null;
};

/** Company update for an active/updated corporate subscription. */
export function corporateUpsertData(
  subscription: Stripe.Subscription,
): CorporateUpsertData {
  const periodEnd = subscriptionPeriodEnd(subscription);
  return {
    planStatus: mapCorporatePlanStatus(subscription.status),
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    stripeCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
  };
}

export type CorporateDeletedData = {
  planStatus: "cancelled";
  stripeSubscriptionId: string;
  stripeCurrentPeriodEnd: null;
};

/** Company update for a cancelled corporate subscription. */
export function corporateDeletedData(
  subscription: Stripe.Subscription,
): CorporateDeletedData {
  return {
    planStatus: "cancelled",
    stripeSubscriptionId: subscription.id,
    stripeCurrentPeriodEnd: null,
  };
}
