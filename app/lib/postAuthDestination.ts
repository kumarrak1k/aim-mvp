import { prisma } from "./prisma";

/**
 * Where a candidate should land after signing in or accepting terms.
 *
 * Onboarding is sent here rather than being linked from anywhere, because a
 * flow a new user has to find is a flow they will not complete. It runs once:
 * anyone who has finished OR skipped it goes straight to their destination.
 *
 * An explicitly requested path always wins. Someone following an emailed
 * assessment invite, or a deep link into a saved session, must get where they
 * were going — interrupting that to ask about career stage would be worse than
 * never asking at all.
 */
export const DEFAULT_DESTINATION = "/practice";

export async function resolvePostAuthDestination(
  clerkUserId: string,
  requestedNext?: string | null
): Promise<string> {
  // A real destination was asked for — honour it.
  if (requestedNext && requestedNext !== DEFAULT_DESTINATION) {
    return requestedNext;
  }

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { clerkUserId },
      select: { onboardingCompletedAt: true },
    });
    if (!profile?.onboardingCompletedAt) return "/onboarding";
  } catch {
    // Never block sign-in on this lookup. Missing the onboarding prompt is a
    // far smaller failure than a user who cannot get into the product.
  }

  return requestedNext ?? DEFAULT_DESTINATION;
}
