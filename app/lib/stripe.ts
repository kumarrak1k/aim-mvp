import Stripe from "stripe";

export type StripePlanId =
  | "professional_monthly"
  | "professional_annual"
  | "advanced_monthly"
  | "advanced_annual";

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
    professional_monthly: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
    professional_annual: process.env.STRIPE_PRICE_PROFESSIONAL_ANNUAL,
    advanced_monthly: process.env.STRIPE_PRICE_ADVANCED_MONTHLY,
    advanced_annual: process.env.STRIPE_PRICE_ADVANCED_ANNUAL,
  };
  const priceId = map[planId];
  if (!priceId) throw new Error(`Stripe price ID not configured for plan: ${planId}`);
  return priceId;
}
