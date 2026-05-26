import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { stripe } from "@/app/lib/stripe";
import { PLAN_CONFIG } from "@/app/lib/corporatePlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/company/subscription
 *
 * Returns the current corporate subscription state for the authenticated
 * workspace admin. Fetches billing interval and cancel_at_period_end live
 * from Stripe when a paid subscription exists.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  try {
    // Resolve the company via the user's membership record
    const member = await prisma.companyMember.findFirst({
      where: { clerkUserId: userId },
      include: { company: true },
    });

    if (!member) {
      return NextResponse.json({ error: "No workspace found." }, { status: 404 });
    }

    const company = member.company;
    const isAdmin = member.role === "admin";

    const isActive =
      company.planStatus === "active" ||
      (company.planStatus === "trial" &&
        Boolean(company.trialEndsAt) &&
        new Date(company.trialEndsAt!) > new Date());

    const plan = company.planId ? PLAN_CONFIG[company.planId as keyof typeof PLAN_CONFIG] : null;
    const planName = plan?.name ?? (company.planStatus === "trial" ? "Trial" : "None");

    // Current-period end from DB (set by webhook)
    const periodEndIso = company.stripeCurrentPeriodEnd
      ? company.stripeCurrentPeriodEnd.toISOString()
      : null;

    // Trial info
    const trialEndsAt = company.trialEndsAt ? company.trialEndsAt.toISOString() : null;
    const trialDaysRemaining = company.trialEndsAt
      ? Math.max(0, Math.ceil((new Date(company.trialEndsAt).getTime() - Date.now()) / 86_400_000))
      : null;

    // Fetch live data from Stripe when a paid subscription exists
    let billingInterval: "monthly" | "annual" | null = null;
    let cancelAtPeriodEnd = false;

    if (company.stripeSubscriptionId && stripe) {
      try {
        const stripeSub = await stripe.subscriptions.retrieve(
          company.stripeSubscriptionId,
          { expand: ["items.data.price"] }
        );
        cancelAtPeriodEnd = stripeSub.cancel_at_period_end;

        // Determine billing interval from the price's recurring interval
        const price = stripeSub.items.data[0]?.price as {
          recurring?: { interval?: string };
        } | null;
        if (price?.recurring?.interval === "year") {
          billingInterval = "annual";
        } else if (price?.recurring?.interval === "month") {
          billingInterval = "monthly";
        }
      } catch {
        // Non-fatal — UI degrades gracefully
      }
    }

    return NextResponse.json({
      planId: company.planId ?? null,
      planName,
      planStatus: company.planStatus,
      isActive,
      isAdmin,
      billingInterval,
      cancelAtPeriodEnd,
      currentPeriodEnd: periodEndIso,
      trialEndsAt,
      trialDaysRemaining,
      hasStripeSubscription: Boolean(company.stripeSubscriptionId),
      hasStripeCustomer: Boolean(company.stripeCustomerId),
    });
  } catch (error) {
    console.error("COMPANY SUBSCRIPTION GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load subscription." }, { status: 500 });
  }
}
