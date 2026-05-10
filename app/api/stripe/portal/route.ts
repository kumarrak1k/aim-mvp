import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { requireStripe } from "@/app/lib/stripe";
import { absoluteUrl } from "@/app/config/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/portal
 *
 * Creates a Stripe Customer Portal session for the signed-in user so they
 * can manage their subscription (cancel, change payment method, download
 * invoices). Requires the Customer Portal to be configured in the Stripe
 * Dashboard (Billing → Customer Portal).
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  }

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const meta = user.privateMetadata as { stripeCustomerId?: string };
    const customerId = meta?.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json(
        { error: "No billing account found. Contact support." },
        { status: 404 }
      );
    }

    const stripe = requireStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: absoluteUrl("/practice"),
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("STRIPE PORTAL ERROR:", error);
    return NextResponse.json(
      { error: "Could not open billing portal." },
      { status: 500 }
    );
  }
}
