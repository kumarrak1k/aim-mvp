import { stripe } from "./stripe";

/**
 * Launch-offer promo details for the pricing page banner.
 *
 * Driven entirely by ONE env var: set LAUNCH_PROMO_CODE (e.g. "LAUNCH100")
 * in Vercel and redeploy to show the banner; remove it to hide the banner.
 * The code itself (discount, redemption cap, expiry) is configured in the
 * Stripe dashboard, so marketing changes never need a code change.
 */

export type LaunchPromo = {
  code: string;
  percentOff: number | null;
  /** Whole-currency amount, e.g. 10 for £10 off. */
  amountOff: number | null;
  maxRedemptions: number | null;
  timesRedeemed: number;
  /** Redemptions left, or null when the code is uncapped. */
  remaining: number | null;
};

let cache: { value: LaunchPromo | null; expires: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

export async function getLaunchPromo(): Promise<LaunchPromo | null> {
  const code = process.env.LAUNCH_PROMO_CODE?.trim();
  if (!code || !stripe) return null;

  if (cache && Date.now() < cache.expires) return cache.value;

  try {
    const codes = await stripe.promotionCodes.list({
      code,
      active: true,
      limit: 1,
      expand: ["data.promotion.coupon"],
    });
    const promo = codes.data[0];

    let value: LaunchPromo | null = null;
    if (promo) {
      const maxRedemptions = promo.max_redemptions ?? null;
      const timesRedeemed = promo.times_redeemed ?? 0;
      const remaining =
        maxRedemptions === null ? null : Math.max(0, maxRedemptions - timesRedeemed);

      // A fully redeemed code stays "active" in Stripe but can't be applied;
      // treat it as over so the banner disappears on its own.
      if (remaining === null || remaining > 0) {
        const coupon = promo.promotion?.coupon;
        const expandedCoupon =
          coupon && typeof coupon === "object" ? coupon : null;
        value = {
          code: promo.code,
          percentOff: expandedCoupon?.percent_off ?? null,
          amountOff: expandedCoupon?.amount_off
            ? expandedCoupon.amount_off / 100
            : null,
          maxRedemptions,
          timesRedeemed,
          remaining,
        };
      }
    }

    cache = { value, expires: Date.now() + CACHE_MS };
    return value;
  } catch (error) {
    console.error("LAUNCH PROMO LOOKUP ERROR:", error);
    // Don't cache failures for the full window; retry sooner.
    cache = { value: null, expires: Date.now() + 60 * 1000 };
    return null;
  }
}
