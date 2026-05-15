import Stripe from "stripe";

export type StripePlanId =
  | "plus_monthly"
  | "plus_annual"
  | "professional_monthly"
  | "professional_annual";

function createStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: "2026-04-22.dahlia", typescript: true });
}

export const stripe = createStripeClient();

export function requireStripe(): Stripe {
  if (!stripe) throw new Error("Stripe is not configured — set STRIPE_SECRET_KEY");
  return stripe;
}

export function getStripePriceId(planId: StripePlanId): string {
  const map: Record<StripePlanId, string | undefined> = {
    plus_monthly: process.env.STRIPE_PRICE_PLUS_MONTHLY,
    plus_annual: process.env.STRIPE_PRICE_PLUS_ANNUAL,
    professional_monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
    professional_annual: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL,
  };
  const priceId = map[planId];
  if (!priceId) throw new Error(`Stripe price ID not configured for plan: ${planId}`);
  return priceId;
}
