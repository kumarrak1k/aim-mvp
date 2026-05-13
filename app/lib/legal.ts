import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";

/**
 * Bump this whenever you make a material change to /terms or /privacy.
 * Format: YYYY-MM-DD. Bumping forces all signed-in users to re-accept on
 * their next visit before they can access protected pages.
 */
export const CURRENT_TOS_VERSION = "2026-05-13";

export type TosStatus = {
  accepted: boolean;
  acceptedVersion: string | null;
  acceptedAt: Date | null;
  currentVersion: string;
};

export async function getTosStatus(clerkUserId: string): Promise<TosStatus> {
  const row = await prisma.userProfile.findUnique({
    where: { clerkUserId },
    select: { tosAcceptedAt: true, tosAcceptedVersion: true },
  });

  const acceptedVersion = row?.tosAcceptedVersion ?? null;

  return {
    accepted: acceptedVersion === CURRENT_TOS_VERSION,
    acceptedVersion,
    acceptedAt: row?.tosAcceptedAt ?? null,
    currentVersion: CURRENT_TOS_VERSION,
  };
}

export async function recordTosAcceptance(params: {
  clerkUserId: string;
  ipAddress: string | null;
  userAgent: string | null;
}): Promise<void> {
  const acceptedAt = new Date();

  await prisma.$transaction([
    prisma.userProfile.upsert({
      where: { clerkUserId: params.clerkUserId },
      create: {
        clerkUserId: params.clerkUserId,
        tosAcceptedAt: acceptedAt,
        tosAcceptedVersion: CURRENT_TOS_VERSION,
      },
      update: {
        tosAcceptedAt: acceptedAt,
        tosAcceptedVersion: CURRENT_TOS_VERSION,
      },
    }),
    prisma.termsAcceptance.create({
      data: {
        clerkUserId: params.clerkUserId,
        version: CURRENT_TOS_VERSION,
        acceptedAt,
        ipAddress: params.ipAddress ?? undefined,
        userAgent: params.userAgent ?? undefined,
      },
    }),
  ]);
}

/**
 * Server-side gate. Use at the top of any protected server component
 * (page.tsx or layout.tsx) that requires up-to-date ToS acceptance.
 * Silently allows signed-out users through (they will be redirected to
 * sign-in by other guards).
 */
export async function requireTosAcceptance(nextPath: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) return;

  const status = await getTosStatus(userId);
  if (status.accepted) return;

  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/practice";
  redirect(`/accept-terms?next=${encodeURIComponent(safeNext)}`);
}
