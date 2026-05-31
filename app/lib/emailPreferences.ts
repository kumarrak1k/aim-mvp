/**
 * Candidate email / notification consent.
 *
 * Model: marketing & nurture emails are suppressed only when a candidate has
 * explicitly opted out (unticked the signup box, toggled off in preferences,
 * or used an unsubscribe link). Transactional emails (assessment invites,
 * account/security, trial-expiry notices) ignore this entirely.
 *
 * Legacy accounts with no preference row are treated as "not suppressed" so
 * the existing nurture flow keeps working — but every marketing email carries
 * a one-click unsubscribe, which writes an opt-out row and suppresses future
 * sends. New sign-ups always capture an explicit choice.
 */

import { prisma } from "./prisma";

export async function getEmailPreference(clerkUserId: string) {
  return prisma.emailPreference.findUnique({ where: { clerkUserId } });
}

export async function getOrCreateEmailPreference(
  clerkUserId: string,
  email: string
) {
  const existing = await prisma.emailPreference.findUnique({
    where: { clerkUserId },
  });
  if (existing) return existing;
  return prisma.emailPreference.create({ data: { clerkUserId, email } });
}

export async function setMarketingConsent(
  clerkUserId: string,
  email: string,
  consent: boolean,
  source: "signup" | "preferences" | "unsubscribe"
) {
  return prisma.emailPreference.upsert({
    where: { clerkUserId },
    create: {
      clerkUserId,
      email,
      marketingConsent: consent,
      consentSource: source,
      consentUpdatedAt: new Date(),
    },
    update: {
      email,
      marketingConsent: consent,
      consentSource: source,
      consentUpdatedAt: new Date(),
    },
  });
}

/** One-click unsubscribe by token. Idempotent. Returns the affected email. */
export async function unsubscribeByToken(
  token: string
): Promise<{ ok: boolean; email?: string }> {
  const pref = await prisma.emailPreference.findUnique({
    where: { unsubscribeToken: token },
  });
  if (!pref) return { ok: false };
  if (pref.marketingConsent) {
    await prisma.emailPreference.update({
      where: { unsubscribeToken: token },
      data: {
        marketingConsent: false,
        consentSource: "unsubscribe",
        consentUpdatedAt: new Date(),
      },
    });
  }
  return { ok: true, email: pref.email };
}

/**
 * Marketing is suppressed only when the user has an explicit opt-out row.
 * No row → allowed (legacy grandfathering; opt-out link still present).
 */
export async function isMarketingSuppressed(
  clerkUserId: string
): Promise<boolean> {
  const pref = await prisma.emailPreference.findUnique({
    where: { clerkUserId },
  });
  return pref ? pref.marketingConsent === false : false;
}
