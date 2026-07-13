import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { prisma } from "@/app/lib/prisma";
import { requireStripe } from "@/app/lib/stripe";
import { absoluteUrl } from "@/app/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Corporate sessions must NOT use the default portal configuration: its
 * "switch plans" catalogue lists the CANDIDATE prices (Plus/Professional), so
 * a company admin could move a £149+ corporate subscription onto a £19
 * candidate price the plan mapper doesn't recognise. This restricted config
 * allows payment-method updates, invoice history and cancellation only; plan
 * changes go through the company dashboard flow, which carries the metadata
 * the webhooks depend on.
 *
 * Found by metadata (purpose=corporate_v1) or created once, then cached per
 * function instance.
 */
let corporatePortalConfigId: string | null = null;

async function getCorporatePortalConfigId(stripe: Stripe): Promise<string> {
  if (corporatePortalConfigId) return corporatePortalConfigId;

  const existing = await stripe.billingPortal.configurations.list({ limit: 100 });
  const found = existing.data.find(
    (c) => c.metadata?.purpose === "corporate_v1" && c.active
  );
  if (found) {
    corporatePortalConfigId = found.id;
    return found.id;
  }

  const created = await stripe.billingPortal.configurations.create({
    features: {
      payment_method_update: { enabled: true },
      invoice_history: { enabled: true },
      customer_update: { enabled: true, allowed_updates: ["email", "address"] },
      subscription_cancel: { enabled: true, mode: "at_period_end" },
      subscription_update: { enabled: false },
    },
    metadata: { purpose: "corporate_v1" },
  });
  corporatePortalConfigId = created.id;
  return created.id;
}

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
      configuration: await getCorporatePortalConfigId(stripe),
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
