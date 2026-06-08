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

// ── Price → plan resolution (authoritative) ──────────────────────────────────
// The live PRICE on the subscription — not the (mutable, sometimes stale)
// subscription metadata — is the source of truth for the tier. A plan switch
// made in Stripe's Customer Portal, or a scheduled downgrade phase swap, changes
// the price but does NOT update metadata.planId; deriving from the price keeps
// the webhook AND the reconcile correct in those cases.

/** Build a price-id → plan reverse map from configured env price IDs (skips unset). */
function reversePriceMap(entries: Array<[string | undefined, string]>): Record<string, string> {
  const m: Record<string, string> = {};
  for (const [id, plan] of entries) if (id) m[id] = plan;
  return m;
}

const CANDIDATE_PLAN_IDS = new Set([
  "plus_monthly",
  "plus_annual",
  "professional_monthly",
  "professional_annual",
]);

/** Candidate planId (StripePlanId) from a subscription: price lookup_key →
 *  env price-id reverse map → metadata.planId (last resort). */
export function candidatePlanIdFromSubscription(
  subscription: Stripe.Subscription,
): string | null {
  const price = subscription.items?.data?.[0]?.price;
  const lookupKey = price?.lookup_key ?? undefined;
  if (lookupKey && CANDIDATE_PLAN_IDS.has(lookupKey)) return lookupKey;

  const priceId = price?.id;
  if (priceId) {
    const map = reversePriceMap([
      [process.env.STRIPE_PRICE_PLUS_MONTHLY, "plus_monthly"],
      [process.env.STRIPE_PRICE_PLUS_ANNUAL, "plus_annual"],
      [process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY, "professional_monthly"],
      [process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL, "professional_annual"],
    ]);
    if (map[priceId]) return map[priceId];
  }
  return subscription.metadata?.planId ?? null;
}

/** Corporate plan ("team" | "business") from a subscription: env price-id
 *  reverse map → lookup_key → metadata.planId. Essential for downgrades, where
 *  the schedule swaps the price but never updates metadata.planId. */
export function corporatePlanIdFromSubscription(
  subscription: Stripe.Subscription,
): "team" | "business" | null {
  const price = subscription.items?.data?.[0]?.price;
  const priceId = price?.id;
  if (priceId) {
    const map = reversePriceMap([
      [process.env.STRIPE_PRICE_CORPORATE_TEAM_MONTHLY, "team"],
      [process.env.STRIPE_PRICE_CORPORATE_TEAM_ANNUAL, "team"],
      [process.env.STRIPE_PRICE_CORPORATE_BUSINESS_MONTHLY, "business"],
      [process.env.STRIPE_PRICE_CORPORATE_BUSINESS_ANNUAL, "business"],
    ]);
    const mapped = map[priceId];
    if (mapped === "team" || mapped === "business") return mapped;
  }
  const lookupKey = price?.lookup_key ?? "";
  if (lookupKey.includes("business")) return "business";
  if (lookupKey.includes("team")) return "team";
  const metaPlan = subscription.metadata?.planId;
  if (metaPlan === "team" || metaPlan === "business") return metaPlan;
  return null;
}

// ── Candidate (Clerk privateMetadata) ────────────────────────────────────────

export type CandidateSubscriptionMeta = {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePlanId?: string;
  subscriptionStatus?: string;
  subscriptionCurrentPeriodEnd?: number;
  trialEndsAt?: string;
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
  const periodEnd = subscriptionPeriodEnd(subscription);
  return {
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    stripePlanId: candidatePlanIdFromSubscription(subscription) ?? undefined,
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
    // End any still-running reverse trial so a mid-trial cancellation drops the
    // user to Free, not back to the (Plus) trial. Harmless if already expired.
    trialEndsAt: new Date(0).toISOString(),
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
  /** Derived from the live price so downgrades (Business→Team) actually take
   *  effect on Company.planId via the webhook + reconcile. Omitted only when the
   *  price can't be mapped, so an unknown price never clobbers the column. */
  planId?: "team" | "business";
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripeCurrentPeriodEnd: Date | null;
};

/** Company update for an active/updated corporate subscription. */
export function corporateUpsertData(
  subscription: Stripe.Subscription,
): CorporateUpsertData {
  const periodEnd = subscriptionPeriodEnd(subscription);
  const planId = corporatePlanIdFromSubscription(subscription);
  return {
    planStatus: mapCorporatePlanStatus(subscription.status),
    ...(planId ? { planId } : {}),
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    stripeCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
  };
}

export type CorporateDeletedData = {
  planStatus: "cancelled";
  stripeSubscriptionId: string;
  stripeCurrentPeriodEnd: Date | null;
};

/** Company update for a cancelled corporate subscription. Keeps the period-end
 *  date so the UI can still show "access until X". */
export function corporateDeletedData(
  subscription: Stripe.Subscription,
): CorporateDeletedData {
  const periodEnd = subscriptionPeriodEnd(subscription);
  return {
    planStatus: "cancelled",
    stripeSubscriptionId: subscription.id,
    stripeCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
  };
}
