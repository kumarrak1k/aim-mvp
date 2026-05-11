import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { requireStripe } from "@/app/lib/stripe";
import { absoluteUrl } from "@/app/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/company/billing-portal
 *
 * Opens the Stripe Customer Portal for the company so admins can:
 *   - update their payment method
 *   - download invoices
 *   - cancel or change subscription
 *
 * Requires STRIPE_SECRET_KEY and that the Customer Portal is configured in
 * the Stripe Dashboard (Billing → Customer Portal).
 *
 * Admin-only. The company must have a stripeCustomerId (i.e. they must have
 * gone through checkout at least once).
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

    if (!company.stripeCustomerId) {
      return NextResponse.json(
        {
          error:
            "No billing account found. Complete checkout first to set up billing.",
        },
        { status: 404 }
      );
    }

    const stripe = requireStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: company.stripeCustomerId,
      return_url: absoluteUrl("/company/dashboard"),
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("COMPANY BILLING PORTAL ERROR:", error);
    return NextResponse.json(
      { error: "Could not open billing portal." },
      { status: 500 }
    );
  }
}
