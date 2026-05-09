import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireStripe } from "@/app/lib/stripe";
import Stripe from "stripe";

export const runtime = "nodejs";

// Stripe sends raw bodies — Next.js must not parse this route.
export const dynamic = "force-dynamic";

type SubscriptionMeta = {
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePlanId?: string;
  subscriptionStatus?: string;
  subscriptionCurrentPeriodEnd?: number;
};

async function updateUserSubscription(
  clerkUserId: string,
  data: Partial<SubscriptionMeta>
) {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);
  const existing = (user.privateMetadata ?? {}) as Record<string, unknown>;
  await client.users.updateUserMetadata(clerkUserId, {
    privateMetadata: { ...existing, ...data },
  });
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  const clerkUserId = subscription.metadata?.clerkUserId;
  if (!clerkUserId) {
    console.warn("STRIPE WEBHOOK: subscription missing clerkUserId metadata", subscription.id);
    return;
  }

  const item = subscription.items.data[0];
  await updateUserSubscription(clerkUserId, {
    stripeCustomerId: subscription.customer as string,
    stripeSubscriptionId: subscription.id,
    stripePlanId: subscription.metadata?.planId ?? item?.price?.lookup_key ?? null,
    subscriptionStatus: subscription.status,
    subscriptionCurrentPeriodEnd: (subscription as Stripe.Subscription & { current_period_end: number }).current_period_end,
  });
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const clerkUserId = subscription.metadata?.clerkUserId;
  if (!clerkUserId) return;

  await updateUserSubscription(clerkUserId, {
    stripeSubscriptionId: subscription.id,
    stripePlanId: undefined,
    subscriptionStatus: "cancelled",
    subscriptionCurrentPeriodEnd: undefined,
  });
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE WEBHOOK: STRIPE_WEBHOOK_SECRET not set");
    return NextResponse.json({ error: "Webhook not configured." }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const rawBody = await req.text();
  const stripeClient = requireStripe();

  let event: Stripe.Event;
  try {
    event = stripeClient.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("STRIPE WEBHOOK: signature verification failed", err);
    return NextResponse.json({ error: "Webhook signature invalid." }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpsert(event.data.object as Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      default:
        // Unhandled event type — acknowledge receipt so Stripe doesn't retry.
        break;
    }
  } catch (err) {
    console.error("STRIPE WEBHOOK: handler error", event.type, err);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
