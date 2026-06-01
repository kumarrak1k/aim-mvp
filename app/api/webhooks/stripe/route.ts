import { NextRequest, NextResponse } from "next/server";
import { requireStripe } from "@/app/lib/stripe";
import { prisma } from "@/app/lib/prisma";
import { recordStripeEvent } from "@/app/lib/stripeEvents";
import {
  corporateUpsertData,
  corporateDeletedData,
  subscriptionPeriodEnd,
} from "@/app/lib/stripeSync";
import Stripe from "stripe";

export const runtime = "nodejs";

// Stripe sends raw bodies — Next.js must not parse this route.
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/stripe
 *
 * Corporate Stripe webhook handler. Separate from the candidate webhook at
 * /api/stripe/webhook. Uses STRIPE_WEBHOOK_SECRET_CORPORATE and updates
 * the Prisma Company record rather than Clerk user metadata.
 *
 * Expected Stripe events:
 *   checkout.session.completed     — subscription started, set planStatus "active"
 *   customer.subscription.updated  — renewal / plan change, keep planStatus in sync
 *   customer.subscription.deleted  — cancellation, set planStatus "cancelled"
 */

async function getCompanyId(
  subscription: Stripe.Subscription
): Promise<string | null> {
  const id = subscription.metadata?.companyId;
  return id ?? null;
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  const companyId = await getCompanyId(subscription);
  if (!companyId) {
    console.warn(
      "CORPORATE WEBHOOK: subscription missing companyId metadata",
      subscription.id
    );
    return;
  }

  await prisma.company.update({
    where: { id: companyId },
    data: corporateUpsertData(subscription),
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const companyId = await getCompanyId(subscription);
  if (!companyId) return;

  await prisma.company.update({
    where: { id: companyId },
    data: corporateDeletedData(subscription),
  });
}

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripeClient: Stripe
) {
  // companyId is set on the session metadata during checkout creation
  const companyId = session.metadata?.companyId;
  if (!companyId) {
    console.warn(
      "CORPORATE WEBHOOK: checkout.session.completed missing companyId",
      session.id
    );
    return;
  }

  // Retrieve the subscription so we get the period end
  let periodEnd: number | null = null;
  if (session.subscription) {
    try {
      const sub = await stripeClient.subscriptions.retrieve(
        session.subscription as string
      );
      periodEnd = subscriptionPeriodEnd(sub);
    } catch (err) {
      console.error("CORPORATE WEBHOOK: could not retrieve subscription", err);
    }
  }

  await prisma.company.update({
    where: { id: companyId },
    data: {
      planStatus: "active",
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: (session.subscription as string) ?? null,
      stripeCurrentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
    },
  });
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET_CORPORATE;
  if (!webhookSecret) {
    console.error(
      "CORPORATE WEBHOOK: STRIPE_WEBHOOK_SECRET_CORPORATE not set"
    );
    return NextResponse.json(
      { error: "Webhook not configured." },
      { status: 500 }
    );
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 }
    );
  }

  const rawBody = await req.text();
  const stripeClient = requireStripe();

  let event: Stripe.Event;
  try {
    event = stripeClient.webhooks.constructEvent(
      rawBody,
      signature,
      webhookSecret
    );
  } catch (err) {
    console.error("CORPORATE WEBHOOK: signature verification failed", err);
    return NextResponse.json(
      { error: "Webhook signature invalid." },
      { status: 400 }
    );
  }

  // Idempotency — Stripe retries/replays; process each event id at most once.
  const { firstTime } = await recordStripeEvent(event.id, event.type);
  if (!firstTime) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
          stripeClient
        );
        break;
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(
          event.data.object as Stripe.Subscription
        );
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription
        );
        break;
      default:
        // Unhandled event type — acknowledge receipt so Stripe doesn't retry.
        break;
    }
  } catch (err) {
    console.error("CORPORATE WEBHOOK: handler error", event.type, err);
    return NextResponse.json(
      { error: "Webhook handler failed." },
      { status: 500 }
    );
  }

  return NextResponse.json({ received: true });
}
