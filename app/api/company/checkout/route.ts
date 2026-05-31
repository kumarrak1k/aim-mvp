import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireStripe } from "@/app/lib/stripe";
import { getPlan } from "@/app/lib/corporatePlan";
import { absoluteUrl } from "@/app/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/company/checkout
 *
 * Creates a Stripe Checkout session for the company's current plan.
 * Admin-only. Redirects the browser to Stripe's hosted checkout page.
 * On success Stripe sends the user to /company/dashboard?payment=success.
 *
 * Requires env vars:
 *   STRIPE_PRICE_CORPORATE_TEAM_MONTHLY
 *   STRIPE_PRICE_CORPORATE_BUSINESS_MONTHLY
 */
export async function POST() {
  try {
    const { userId } = await auth();
    if (!userId)
      return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    const admin = await prisma.companyMember.findFirst({
      where: { clerkUserId: userId, role: "admin" },
    });
    if (!admin)
      return NextResponse.json(
        { error: "Admin access required." },
        { status: 403 }
      );

    const company = await prisma.company.findUnique({
      where: { id: admin.companyId },
    });
    if (!company)
      return NextResponse.json({ error: "Company not found." }, { status: 404 });

    if (!company.planId)
      return NextResponse.json(
        {
          error:
            "No plan selected. Choose a plan first from the plan selection page.",
        },
        { status: 400 }
      );

    // Resolve the Stripe price ID from env
    const priceIdMap: Record<string, string | undefined> = {
      team: process.env.STRIPE_PRICE_CORPORATE_TEAM_MONTHLY,
      business: process.env.STRIPE_PRICE_CORPORATE_BUSINESS_MONTHLY,
    };
    const priceId = priceIdMap[company.planId];
    if (!priceId) {
      console.error(
        `COMPANY CHECKOUT: No Stripe price ID configured for plan "${company.planId}"`
      );
      return NextResponse.json(
        { error: "Billing not configured for this plan. Contact support." },
        { status: 503 }
      );
    }

    const plan = getPlan(company.planId);
    const stripe = requireStripe();

    // Reuse existing Stripe customer if one was already created for this company
    let customerId = company.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create(
        { name: company.name, metadata: { companyId: company.id } },
        { idempotencyKey: `customer_company_${company.id}` }
      );
      customerId = customer.id;
      // Persist immediately so we don't create duplicates on retries
      await prisma.company.update({
        where: { id: company.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: absoluteUrl("/company/dashboard?payment=success"),
      cancel_url: absoluteUrl("/company/dashboard?payment=cancelled"),
      allow_promotion_codes: true,
      // companyId on session so checkout.session.completed can update the Company record
      metadata: { companyId: company.id },
      // companyId + planId on subscription so renewal events can update it too
      subscription_data: {
        metadata: {
          companyId: company.id,
          planId: company.planId,
          planName: plan?.name ?? company.planId,
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("COMPANY CHECKOUT ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session." },
      { status: 500 }
    );
  }
}
