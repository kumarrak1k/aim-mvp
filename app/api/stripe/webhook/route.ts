import { NextRequest, NextResponse } from "next/server";
import { clerkClient } from "@clerk/nextjs/server";
import { requireStripe } from "@/app/lib/stripe";
import { recordStripeEvent, deleteStripeEvent } from "@/app/lib/stripeEvents";
import {
  isCorporateSubscription,
  candidateUpsertMeta,
  candidateDeletedMeta,
} from "@/app/lib/stripeSync";
import Stripe from "stripe";

export const runtime = "nodejs";

// Stripe sends raw bodies — Next.js must not parse this route.
export const dynamic = "force-dynamic";

/**
 * Read the user's current metadata, apply the stale/out-of-order guard, then
 * write. Guard (mirrors the reconcile): a LIVE subscription may CLAIM the record
 * (catches a brand-new subscriber); any non-live status — and any delete for an
 * OLD subscription — may only update the record that ALREADY points at this
 * subscription, so a late/out-of-order event can never clobber a newer plan.
 */
async function applyCandidateSubscription(
  clerkUserId: string,
  subscription: Stripe.Subscription,
  kind: "upsert" | "deleted"
) {
  const client = await clerkClient();
  const user = await client.users.getUser(clerkUserId);
  const existing = (user.privateMetadata ?? {}) as Record<string, unknown>;

  const live =
    subscription.status === "active" || subscription.status === "trialing";
  if (
    (!live || kind === "deleted") &&
    existing.stripeSubscriptionId !== subscription.id
  ) {
    return; // stale / not-the-current-subscription — ignore
  }

  const data =
    kind === "deleted"
      ? candidateDeletedMeta(subscription)
      : candidateUpsertMeta(subscription);

  await client.users.updateUserMetadata(clerkUserId, {
    privateMetadata: { ...existing, ...data },
  });
}

async function handleSubscriptionUpsert(subscription: Stripe.Subscription) {
  // Defensive: corporate subscriptions are handled by /api/webhooks/stripe.
  if (isCorporateSubscription(subscription)) return;

  const clerkUserId = subscription.metadata?.clerkUserId;
  if (!clerkUserId) {
    console.warn("STRIPE WEBHOOK: subscription missing clerkUserId metadata", subscription.id);
    return;
  }

  await applyCandidateSubscription(clerkUserId, subscription, "upsert");
}

/**
 * checkout.session.completed fires the instant payment succeeds — before
 * customer.subscription.created in many cases. Writing the metadata here too
 * shrinks the window where a brand-new subscriber lands on /practice still
 * showing the Free tier.
 */
async function handleCandidateCheckoutCompleted(
  session: Stripe.Checkout.Session,
  stripeClient: Stripe
) {
  if (session.metadata?.planType === "corporate" || session.metadata?.companyId) return;
  if (!session.subscription) return;
  const sub = await stripeClient.subscriptions.retrieve(session.subscription as string);
  await handleSubscriptionUpsert(sub);
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  if (isCorporateSubscription(subscription)) return;

  const clerkUserId = subscription.metadata?.clerkUserId;
  if (!clerkUserId) return;

  await applyCandidateSubscription(clerkUserId, subscription, "deleted");
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

  // Idempotency — Stripe retries/replays; process each event id at most once.
  const { firstTime } = await recordStripeEvent(event.id, event.type);
  if (!firstTime) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCandidateCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
          stripeClient
        );
        break;
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
    // Release the idempotency claim so Stripe's automatic retry re-runs the
    // handler instead of being swallowed by the duplicate guard.
    await deleteStripeEvent(event.id);
    return NextResponse.json({ error: "Webhook handler failed." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
