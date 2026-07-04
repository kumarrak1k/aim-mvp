import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { requireStripe, getStripePriceId, StripePlanId } from "@/app/lib/stripe";
import { absoluteUrl } from "@/app/config/site";
import { checkRateLimit } from "@/app/lib/rateLimit";

const VALID_PLAN_IDS: StripePlanId[] = [
  "plus_monthly",
  "plus_annual",
  "professional_monthly",
  "professional_annual",
];

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to subscribe." }, { status: 401 });
  }

  const rl = await checkRateLimit(userId, "stripe-checkout", 20, 60);
  if (!rl.allowed) {
    return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
  }

  let planId: string;
  try {
    ({ planId } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!VALID_PLAN_IDS.includes(planId as StripePlanId)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }

  let priceId: string;
  try {
    priceId = getStripePriceId(planId as StripePlanId);
  } catch {
    return NextResponse.json({ error: "Plan not available." }, { status: 503 });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;

  const stripeClient = requireStripe();

  const meta = user.privateMetadata as {
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    subscriptionStatus?: string;
  };

  // Guard against creating a SECOND subscription (double-billing). A user who
  // already has a live subscription (active / trialing / past_due in dunning)
  // must change plans via the billing portal, not a fresh Checkout — otherwise
  // they'd be charged for two concurrent subscriptions. Cancelled/incomplete
  // users fall through and can subscribe again.
  const LIVE_SUB_STATES = new Set(["active", "trialing", "past_due"]);
  if (meta?.stripeSubscriptionId && LIVE_SUB_STATES.has(meta?.subscriptionStatus ?? "")) {
    return NextResponse.json(
      {
        error:
          "You already have an active subscription. Manage or change your plan from the billing page.",
        code: "already_subscribed",
      },
      { status: 409 }
    );
  }

  // Reuse existing Stripe customer if we already created one for this user.
  let customerId = meta?.stripeCustomerId;

  if (!customerId) {
    // Idempotency key keyed to the user prevents duplicate Stripe customers
    // (and double-billing) if checkout is clicked twice or the request retries.
    const customer = await stripeClient.customers.create(
      { email, metadata: { clerkUserId: userId } },
      { idempotencyKey: `customer_${userId}` }
    );
    customerId = customer.id;
    await client.users.updateUserMetadata(userId, {
      privateMetadata: { stripeCustomerId: customerId },
    });
  }

  const session = await stripeClient.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: absoluteUrl("/practice?payment=success"),
    cancel_url: absoluteUrl("/for-candidates/pricing?payment=cancelled"),
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { clerkUserId: userId, planId },
    },
  });

  return NextResponse.json({ url: session.url });
}
