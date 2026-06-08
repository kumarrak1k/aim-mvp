/**
 * Trial-abuse defense for the no-card candidate free trial.
 *
 * Without this, one person can farm unlimited 7-day Professional trials with
 * plus-tag / dotted / disposable emails. We (a) block known disposable domains
 * and (b) record a SHA-256 hash of the NORMALIZED email so the same human
 * can't claim a second trial under a new account. We never store the address.
 */

import crypto from "crypto";
import { prisma } from "./prisma";

// Small, high-traffic disposable-domain denylist. Extend as needed.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "tempmail.com", "temp-mail.org", "guerrillamail.com",
  "guerrillamail.info", "grr.la", "sharklasers.com", "10minutemail.com",
  "throwawaymail.com", "yopmail.com", "trashmail.com", "getnada.com",
  "dispostable.com", "maildrop.cc", "fakeinbox.com", "mailnesia.com",
  "mintemail.com", "mohmal.com", "emailondeck.com", "tempr.email",
  "discard.email", "spam4.me", "trbvm.com", "moakt.com",
]);

function normalizeEmail(email: string): string {
  const lower = email.trim().toLowerCase();
  const [local, domain] = lower.split("@");
  if (!domain) return lower;
  let user = local.split("+")[0]; // strip +tags
  if (domain === "gmail.com" || domain === "googlemail.com") {
    user = user.replace(/\./g, ""); // gmail ignores dots
  }
  return `${user}@${domain}`;
}

export function isDisposableEmail(email: string): boolean {
  const domain = email.trim().toLowerCase().split("@")[1] ?? "";
  return DISPOSABLE_DOMAINS.has(domain);
}

export type TrialEligibility = { eligible: boolean; reason?: string };

/**
 * Atomically claim trial eligibility for an email. Returns eligible:false if
 * the domain is disposable or the normalized email has already had a trial.
 * On eligible:true a TrialGrant row is created (so a later call is rejected).
 */
export async function claimTrialEligibility(
  clerkUserId: string,
  email: string
): Promise<TrialEligibility> {
  if (!email) return { eligible: false, reason: "no_email" };
  if (isDisposableEmail(email)) return { eligible: false, reason: "disposable_email" };

  const emailHash = crypto
    .createHash("sha256")
    .update(normalizeEmail(email))
    .digest("hex");

  try {
    await prisma.trialGrant.create({ data: { emailHash, clerkUserId } });
    return { eligible: true };
  } catch {
    // Unique-constraint violation → this normalized email already had a trial.
    return { eligible: false, reason: "email_already_trialed" };
  }
}

/**
 * Undo a claim made by claimTrialEligibility when the trial did NOT actually
 * start (the grant threw, or startCandidateTrialIfEligible returned started=false).
 * Without this, a transient failure permanently burns the email's one-time
 * eligibility even though no trial was ever granted.
 *
 * Scoped to (emailHash, clerkUserId) so it can only release the row THIS user
 * just created — never an older grant belonging to a different account.
 */
export async function releaseTrialEligibility(
  clerkUserId: string,
  email: string
): Promise<void> {
  if (!email) return;
  const emailHash = crypto
    .createHash("sha256")
    .update(normalizeEmail(email))
    .digest("hex");
  try {
    await prisma.trialGrant.deleteMany({ where: { emailHash, clerkUserId } });
  } catch {
    // Nothing to release (already gone, or never created).
  }
}
