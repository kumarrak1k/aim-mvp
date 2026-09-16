import Stripe from "stripe";

/** The plans on sale: one product, three billing periods. */
export type StripePlanId = "pro_monthly" | "pro_quarterly" | "pro_annual";

/**
 * Retired tiers. Nothing sells these any more, but live subscriptions and
 * historic records still carry the ids, and they must keep resolving to Pro.
 */
export const LEGACY_PLAN_IDS = [
  "plus_monthly",
  "plus_annual",
  "professional_monthly",
  "professional_annual",
] as const;

/**
 * Stripe product per billing period. Each product holds one price per currency
 * (GBP, EUR, USD), so the price is chosen at checkout rather than configured
 * nine times over.
 */
export function getProProductId(planId: StripePlanId): string {
  const map: Record<StripePlanId, string | undefined> = {
    pro_monthly: process.env.STRIPE_PRODUCT_PRO_MONTHLY,
    pro_quarterly: process.env.STRIPE_PRODUCT_PRO_QUARTERLY,
    pro_annual: process.env.STRIPE_PRODUCT_PRO_ANNUAL,
  };
  const productId = map[planId];
  if (!productId) throw new Error(`Stripe product not configured for plan: ${planId}`);
  return productId;
}

export type SupportedCurrency = "gbp" | "eur" | "usd";

export function normaliseCurrency(value: unknown): SupportedCurrency {
  const raw = typeof value === "string" ? value.toLowerCase() : "";
  return raw === "eur" || raw === "usd" ? raw : "gbp";
}

export type CorporateStripePlan = "team" | "business";
export type CorporateBilling = "monthly" | "annual";

export function getCorporateStripePriceId(
  plan: CorporateStripePlan,
  billing: CorporateBilling,
): string {
  const map: Record<CorporateStripePlan, Record<CorporateBilling, string | undefined>> = {
    team: {
      monthly: process.env.STRIPE_PRICE_CORPORATE_TEAM_MONTHLY,
      annual: process.env.STRIPE_PRICE_CORPORATE_TEAM_ANNUAL,
    },
    business: {
      monthly: process.env.STRIPE_PRICE_CORPORATE_BUSINESS_MONTHLY,
      annual: process.env.STRIPE_PRICE_CORPORATE_BUSINESS_ANNUAL,
    },
  };
  const priceId = map[plan]?.[billing];
  if (!priceId) {
    throw new Error(`Stripe price ID not configured for corporate plan: ${plan}_${billing}`);
  }
  return priceId;
}

function createStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia", typescript: true });
}

export const stripe = createStripeClient();

export function requireStripe(): Stripe {
  if (!stripe) throw new Error("Stripe is not configured (set STRIPE_SECRET_KEY)");
  return stripe;
}

/**
 * The live price for a plan in the candidate's currency.
 *
 * Asks Stripe rather than trusting configuration: prices change, and a stale
 * id in an environment variable would either fail checkout or charge the wrong
 * amount. Falls back to the product's default price when the currency has none.
 */
export async function resolveProPriceId(
  planId: StripePlanId,
  currency: SupportedCurrency
): Promise<string> {
  const client = requireStripe();
  const product = getProProductId(planId);
  const prices = await client.prices.list({ product, active: true, limit: 20 });

  const match = prices.data.find(
    (price) => price.currency === currency && price.type === "recurring"
  );
  if (match) return match.id;

  const fallback = prices.data.find((price) => price.type === "recurring");
  if (fallback) return fallback.id;

  throw new Error(`No active price found for plan: ${planId}`);
}
