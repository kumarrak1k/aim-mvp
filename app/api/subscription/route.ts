import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const meta = user.privateMetadata as {
      subscriptionStatus?: string;
      stripePlanId?: string;
      subscriptionCurrentPeriodEnd?: number;
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
    };

    // Accept both "active" and "trialing" — Stripe uses "trialing" when a
    // subscription begins with a trial period, but the user should be treated
    // as a paid subscriber immediately.
    const isActive =
      meta?.subscriptionStatus === "active" ||
      meta?.subscriptionStatus === "trialing";
    const planId = (meta?.stripePlanId ?? "").toLowerCase();
    const periodEnd = meta?.subscriptionCurrentPeriodEnd
      ? new Date(meta.subscriptionCurrentPeriodEnd * 1000).toISOString()
      : null;
    const hasCustomer = Boolean(meta?.stripeCustomerId);

    let planName = "Free";
    if (isActive) {
      if (planId.includes("professional")) planName = "Professional";
      else if (planId.includes("plus")) planName = "Plus";
    }

    // Derive billing interval from the planId string
    const billingInterval: "monthly" | "annual" | null = planId.includes("annual")
      ? "annual"
      : planId.includes("monthly")
      ? "monthly"
      : null;

    // Fetch cancel_at_period_end directly from Stripe (not stored in metadata)
    let cancelAtPeriodEnd = false;
    if (isActive && meta?.stripeSubscriptionId && stripe) {
      try {
        const stripeSub = await stripe.subscriptions.retrieve(
          meta.stripeSubscriptionId
        );
        cancelAtPeriodEnd = stripeSub.cancel_at_period_end;
      } catch {
        // Non-fatal — UI degrades gracefully
      }
    }

    return NextResponse.json({
      planName,
      isActive,
      planId: meta?.stripePlanId ?? null,
      currentPeriodEnd: periodEnd,
      hasCustomer,
      billingInterval,
      cancelAtPeriodEnd,
    });
  } catch (error) {
    console.error("SUBSCRIPTION GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load subscription." }, { status: 500 });
  }
}
