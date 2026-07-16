import { prisma } from "./prisma";
import type { SignupAttribution } from "./attributionChannel";

/**
 * Persist first-touch signup attribution onto the user's profile row.
 * First write wins: once ANY attribution field is set for a user it is never
 * overwritten (the backup call from /api/accept-terms and repeat completion
 * calls are no-ops). Non-fatal by design — callers fire-and-forget.
 */
export async function saveSignupAttributionIfUnset(
  clerkUserId: string,
  attr: SignupAttribution
): Promise<void> {
  const existing = await prisma.userProfile.findUnique({
    where: { clerkUserId },
    select: {
      utmSource: true,
      utmMedium: true,
      utmCampaign: true,
      promoCode: true,
      referrer: true,
      landingPath: true,
    },
  });

  if (
    existing &&
    (existing.utmSource ||
      existing.utmMedium ||
      existing.utmCampaign ||
      existing.promoCode ||
      existing.referrer ||
      existing.landingPath)
  ) {
    return; // first touch already recorded
  }

  await prisma.userProfile.upsert({
    where: { clerkUserId },
    update: attr,
    create: { clerkUserId, ...attr },
  });
}
