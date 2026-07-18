import { clerkClient } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { startCandidateTrialIfEligible } from "./candidatePlan";
import { enqueueNurtureSequence } from "./nurtureSequence";
import { enqueueTrialEmails } from "./trialEmails";
import {
  checkTrialIpAllowance,
  claimTrialEligibility,
  clientIpFromHeaders,
  releaseTrialEligibility,
} from "./trialEligibility";

/**
 * Idempotent candidate trial auto-start: eligibility claim (one per
 * normalized email, ever), per-IP daily cap, trial grant, reminder emails.
 *
 * Called from TWO places so a lost client round-trip can't strand an
 * account without its trial and welcome emails:
 *   1. POST /api/account-type — the normal sign-up completion path.
 *   2. POST /api/accept-terms — the backup. Terms acceptance is the one
 *      server call EVERY new user provably makes; if the completion page
 *      never ran (OAuth redirect variations, tab closed on the splash),
 *      initialisation happens here instead.
 *
 * Safe to call repeatedly: trialConsumed and the TrialGrant unique hash
 * make double-grants impossible. Failures report to Sentry rather than
 * disappearing into function logs.
 */
export async function autoStartCandidateTrial(
  userId: string,
  headers: Headers
): Promise<{ started: boolean }> {
  let email = "";
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const meta = user.privateMetadata as { trialConsumed?: boolean; role?: string };
    if (meta?.role === "superadmin") return { started: false };
    if (meta?.trialConsumed === true) return { started: false };

    email = user.emailAddresses[0]?.emailAddress ?? "";

    // Enqueue the signup nurture sequence (welcome + tips + re-engagement)
    // BEFORE the trial eligibility gate: a user whose trial is denied (e.g.
    // a re-signup with a consumed email) must still get their welcome email.
    // Server-side so it can't be lost like the completion page's browser
    // call; idempotent per email type.
    try {
      await enqueueNurtureSequence(userId, email);
    } catch (err) {
      console.error("ENQUEUE NURTURE SEQUENCE ERROR:", err);
      Sentry.captureException(err);
    }

    const eligibility = await claimTrialEligibility(userId, email);
    if (!eligibility.eligible) return { started: false };

    const ipAllowed = await checkTrialIpAllowance(clientIpFromHeaders(headers));
    if (!ipAllowed) {
      await releaseTrialEligibility(userId, email);
      return { started: false };
    }

    const trial = await startCandidateTrialIfEligible(userId);
    if (!trial.started) {
      // Claim landed but no trial was granted — release the one-time email
      // slot so a transient miss doesn't burn it forever.
      await releaseTrialEligibility(userId, email);
      return { started: false };
    }

    if (trial.trialEndsAt) {
      try {
        await enqueueTrialEmails(userId, email, new Date(trial.trialEndsAt));
      } catch (err) {
        console.error("ENQUEUE TRIAL EMAILS ERROR:", err);
        Sentry.captureException(err);
      }
    }

    return { started: true };
  } catch (err) {
    console.error("TRIAL AUTO-START ERROR:", err);
    Sentry.captureException(err);
    if (email) await releaseTrialEligibility(userId, email);
    return { started: false };
  }
}
