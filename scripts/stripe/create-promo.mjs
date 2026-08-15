/**
 * Create (or report) a customer-facing promotion code on the LIVE Stripe
 * account, restricted to the candidate plans (Plus / Professional, monthly +
 * yearly, all currencies — currencies share products, so a product restriction
 * covers every currency).
 *
 * Both sites share one Stripe account, so a code created here works at
 * checkout on aicareermentor.co.uk AND aicareermentor.com, whether it arrives
 * pre-applied via a ?promo= link or typed into Stripe's code field.
 *
 * Idempotent: re-running reports the existing code instead of duplicating it.
 *
 * Run:  node scripts/stripe/create-promo.mjs
 * Env:  STRIPE_SECRET_KEY (read from .env via dotenv, as the app does)
 *
 * To retire a code early: deactivate it in the Stripe dashboard
 * (Products → Coupons → the code) — takes effect immediately at checkout.
 */
import "dotenv/config";
import Stripe from "stripe";

const CODE = "SUMMER2026";
const PERCENT_OFF = 50;
// "once" = 50% off the first invoice: first month on monthly plans, the whole
// first year on yearly plans. Change to { duration: "repeating",
// duration_in_months: N } for an N-month running discount on monthly plans.
const DURATION = "once";
const EXPIRES_AT = Math.floor(Date.parse("2026-09-30T23:59:59Z") / 1000);
// Safety valve in case the code leaks beyond the printed flyers.
const MAX_REDEMPTIONS = 500;

const key = process.env.STRIPE_SECRET_KEY;
if (!key) throw new Error("STRIPE_SECRET_KEY is not set.");
if (!key.startsWith("sk_live_")) {
  console.warn("⚠ Not a live key — creating the code in TEST mode.");
}
const stripe = new Stripe(key);

// Already created? Report and stop (promotion codes are unique per code+active).
const existing = await stripe.promotionCodes.list({ code: CODE, limit: 1 });
if (existing.data.length) {
  const p = existing.data[0];
  console.log(`Promotion code ${CODE} already exists: ${p.id}`);
  console.log(`  active=${p.active} redeemed=${p.times_redeemed}/${p.max_redemptions ?? "∞"}`);
  console.log(`  coupon=${p.coupon.id} (${p.coupon.percent_off}% off, ${p.coupon.duration})`);
  process.exit(0);
}

// Candidate products only: keeps a hand-out consumer code off the corporate
// Team/Business checkout (which also accepts promotion codes).
const products = await stripe.products.list({ active: true, limit: 100 });
const candidate = products.data.filter((p) => /\b(plus|professional)\b/i.test(p.name));
if (!candidate.length) throw new Error("No Plus/Professional products found — refusing to create an unrestricted coupon.");
console.log("Restricting to products:");
for (const p of candidate) console.log(`  ${p.id}  ${p.name}`);

const coupon = await stripe.coupons.create({
  name: "Summer 2026 — 50% off first payment",
  percent_off: PERCENT_OFF,
  duration: DURATION,
  applies_to: { products: candidate.map((p) => p.id) },
});

const promo = await stripe.promotionCodes.create({
  coupon: coupon.id,
  code: CODE,
  expires_at: EXPIRES_AT,
  max_redemptions: MAX_REDEMPTIONS,
});

console.log(`\nCreated coupon ${coupon.id} + promotion code ${promo.id}`);
console.log(`  ${CODE}: ${PERCENT_OFF}% off the first payment, Plus/Professional only`);
console.log(`  expires ${new Date(EXPIRES_AT * 1000).toISOString()}, max ${MAX_REDEMPTIONS} redemptions`);
