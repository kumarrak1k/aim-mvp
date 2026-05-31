import type Stripe from "stripe";
import { prisma } from "./prisma";

/**
 * Records a Stripe event id and returns true the FIRST time it's seen, false
 * on any replay. Stripe delivers at-least-once and retries on non-2xx, so
 * every webhook handler must call this and no-op on a duplicate.
 */
export async function recordStripeEvent(
  eventId: string,
  type: string
): Promise<{ firstTime: boolean }> {
  try {
    await prisma.processedStripeEvent.create({ data: { id: eventId, type } });
    return { firstTime: true };
  } catch {
    // Unique-constraint violation (P2002) → already processed.
    return { firstTime: false };
  }
}

/**
 * Reads the current period end (unix seconds) from a subscription. On the
 * pinned API version (2026-04-22.dahlia) this moved onto the subscription
 * ITEM, so read the item first and fall back to the subscription field.
 */
export function subscriptionPeriodEnd(
  subscription: Stripe.Subscription
): number | null {
  const item = subscription.items?.data?.[0] as
    | (Stripe.SubscriptionItem & { current_period_end?: number })
    | undefined;
  const fromItem = item?.current_period_end;
  const fromSub = (subscription as Stripe.Subscription & {
    current_period_end?: number;
  }).current_period_end;
  return fromItem ?? fromSub ?? null;
}
