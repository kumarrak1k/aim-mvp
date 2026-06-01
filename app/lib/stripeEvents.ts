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
