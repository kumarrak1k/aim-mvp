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
 * Undo a recordStripeEvent claim. Called when the handler THROWS after the
 * event id was recorded, so Stripe's automatic retry of the same event is not
 * swallowed by the duplicate guard and actually re-runs the handler. (The row
 * is the dedup lock; if processing failed, the lock must be released.)
 */
export async function deleteStripeEvent(eventId: string): Promise<void> {
  try {
    await prisma.processedStripeEvent.delete({ where: { id: eventId } });
  } catch {
    // Already gone (or never written) — nothing to release.
  }
}
