import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { stripe } from "@/app/lib/stripe";
import {
  resolveCandidatePlan,
  type CandidateBillingMeta,
} from "@/app/lib/candidatePlan";

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
    const meta = user.privateMetadata as CandidateBillingMeta & {
      stripeCustomerId?: string;
      stripeSubscriptionId?: string;
    };

    // Single source of truth — honours the no-card reverse trial.
    const plan = resolveCandidatePlan(meta);

    const planId = (meta?.stripePlanId ?? "").toLowerCase();
    const periodEnd = meta?.subscriptionCurrentPeriodEnd
      ? new Date(meta.subscriptionCurrentPeriodEnd * 1000).toISOString()
      : null;
    const hasCustomer = Boolean(meta?.stripeCustomerId);

    // Derive billing interval from the planId string
    const billingInterval: "monthly" | "annual" | null = planId.includes("annual")
      ? "annual"
      : planId.includes("monthly")
      ? "monthly"
      : null;

    // Fetch cancel_at_period_end directly from Stripe (not stored in metadata).
    // Only relevant for genuine paid subscriptions — trial users have no Stripe
    // subscription, so we skip the call entirely.
    let cancelAtPeriodEnd = false;
    if (plan.isPaid && meta?.stripeSubscriptionId && stripe) {
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
      planName: plan.planName,
      isActive: plan.isActive,
      planId: meta?.stripePlanId ?? null,
      currentPeriodEnd: periodEnd,
      hasCustomer,
      billingInterval,
      cancelAtPeriodEnd,
      // ── Reverse-trial state (drives trial UI) ──────────────────────────
      isTrial: plan.isTrial,
      isPaid: plan.isPaid,
      isPastDue: plan.isPastDue,
      paidPlanName: plan.paidPlanName,
      trialEndsAt: plan.trialEndsAt,
      trialDaysRemaining: plan.trialDaysRemaining,
      trialConsumed: plan.trialConsumed,
    });
  } catch (error) {
    console.error("SUBSCRIPTION GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load subscription." }, { status: 500 });
  }
}
