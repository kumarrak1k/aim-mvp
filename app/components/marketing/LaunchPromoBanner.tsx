import { getLaunchPromo } from "@/app/lib/launchPromo";

/**
 * Pricing-page launch offer banner. Renders nothing unless LAUNCH_PROMO_CODE
 * is set in the environment AND the code is still active with redemptions
 * left, so it retires itself when the offer sells out.
 */
export async function LaunchPromoBanner() {
  const promo = await getLaunchPromo();
  if (!promo) return null;

  const discountLine =
    promo.percentOff === 100
      ? "Your first month is free"
      : promo.percentOff
      ? `${promo.percentOff}% off your first month`
      : promo.amountOff
      ? `£${promo.amountOff} off your first month`
      : "Launch discount";

  return (
    <div className="mx-auto mb-8 max-w-3xl rounded-2xl border border-emerald-400/25 bg-gradient-to-r from-emerald-400/[0.08] via-cyan-400/[0.06] to-emerald-400/[0.08] px-5 py-4 text-center">
      <p className="text-[12px] font-bold tracking-wide text-emerald-300">
        Launch offer
      </p>
      <p className="mt-1.5 text-base font-bold text-white sm:text-lg">
        {discountLine} with code{" "}
        <span className="rounded-lg bg-emerald-400/15 px-2 py-0.5 font-mono text-emerald-200">
          {promo.code}
        </span>
      </p>
      <p className="mt-1.5 text-xs leading-5 text-gray-400">
        Applied automatically when you arrive from our launch links, or enter
        the code at checkout.
        {promo.remaining !== null && promo.maxRedemptions !== null && (
          <span className="font-bold text-emerald-300">
            {" "}
            Only {promo.remaining} of {promo.maxRedemptions} left.
          </span>
        )}
      </p>
    </div>
  );
}
