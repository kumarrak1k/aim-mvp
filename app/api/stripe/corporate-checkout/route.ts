import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  requireStripe,
  getCorporateStripePriceId,
  CorporateStripePlan,
  CorporateBilling,
} from "@/app/lib/stripe";
import { absoluteUrl } from "@/app/config/site";

const VALID_PLANS: CorporateStripePlan[] = ["team", "business"];
const VALID_BILLING: CorporateBilling[] = ["monthly", "annual"];

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in to subscribe." }, { status: 401 });
  }

  let plan: CorporateStripePlan;
  let billing: CorporateBilling;
  try {
    ({ plan, billing } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (!VALID_PLANS.includes(plan)) {
    return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
  }
  if (!VALID_BILLING.includes(billing)) {
    return NextResponse.json({ error: "Invalid billing period." }, { status: 400 });
  }

  let priceId: string;
  try {
    priceId = getCorporateStripePriceId(plan, billing);
  } catch {
    return NextResponse.json({ error: "Plan not available." }, { status: 503 });
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const email = user.emailAddresses[0]?.emailAddress;

  const stripeClient = requireStripe();

  // Reuse existing Stripe customer if one was already created for this user.
  const meta = user.privateMetadata as { stripeCustomerId?: string };
  let customerId = meta?.stripeCustomerId;

  if (!customerId) {
    const customer = await stripeClient.customers.create({
      email,
      metadata: { clerkUserId: userId },
    });
    customerId = customer.id;
    await client.users.updateUserMetadata(userId, {
      privateMetadata: { stripeCustomerId: customerId },
    });
  }

  const session = await stripeClient.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: absoluteUrl("/for-business?payment=success"),
    cancel_url: absoluteUrl("/for-business/pricing?payment=cancelled"),
    allow_promotion_codes: true,
    subscription_data: {
      metadata: { clerkUserId: userId, plan, billing, planType: "corporate" },
    },
  });

  return NextResponse.json({ url: session.url });
}
