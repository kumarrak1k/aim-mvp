import { sendNurtureEmail } from "./email";
import { getOrCreateEmailPreference } from "./emailPreferences";
import { isEmailSuppressed } from "./emailSuppression";
import { prisma } from "./prisma";

/**
 * The full candidate nurture sequence, relative to signup day. Trial-aware:
 * the day-1 "ends soon" nudge and day-3 "trial ended" notice track the 3-day
 * auto-trial; the cron skips them if the user's trial state has changed.
 */
const SEQUENCE: Array<{ type: string; delayDays: number }> = [
  { type: "welcome",        delayDays: 0  },
  { type: "trial_midway",   delayDays: 1  },
  { type: "day2_tip",       delayDays: 2  },
  { type: "trial_ended",    delayDays: 3  },
  { type: "day4_social",    delayDays: 5  },
  { type: "day14_reengage", delayDays: 14 },
  { type: "day21_nudge",    delayDays: 21 },
  { type: "day30_winback",  delayDays: 30 },
];

/**
 * Enqueue the signup nurture sequence for a candidate. Idempotent at the
 * EMAIL-TYPE level: only types the user doesn't already have a job for are
 * inserted, so it composes safely with enqueueTrialEmails (which may have
 * created the two trial jobs first) and with repeat calls from the sign-up
 * completion page AND the server-side backup paths.
 *
 * Runs server-side from the trial auto-start helper — the original design
 * relied solely on a fire-and-forget browser call from the completion page,
 * which was occasionally lost, leaving new users with no welcome email.
 */
export async function enqueueNurtureSequence(
  userId: string,
  email: string
): Promise<void> {
  if (!email) return;

  const existing = await prisma.emailJob.findMany({
    where: { userId },
    select: { type: true },
  });
  const have = new Set(existing.map((j) => j.type));

  const now = new Date();
  const data = SEQUENCE.filter((s) => !have.has(s.type)).map(({ type, delayDays }) => {
    const scheduledAt = new Date(now);
    scheduledAt.setDate(scheduledAt.getDate() + delayDays);
    return { userId, email, type, scheduledAt };
  });

  if (data.length) {
    await prisma.emailJob.createMany({ data });
  }

  // Deliver the welcome NOW rather than waiting for the hourly cron — a
  // welcome that lands an hour after signup reads like spam, not onboarding.
  await sendWelcomeImmediately(userId, email);
}

/**
 * Instant delivery of the pending welcome job, applying the same gates as
 * the nurture cron (suppression list + marketing consent). Any failure
 * leaves the job pending so the hourly cron retries with its normal
 * attempt budget — this is an acceleration, not a replacement.
 */
async function sendWelcomeImmediately(userId: string, email: string): Promise<void> {
  try {
    const job = await prisma.emailJob.findFirst({
      where: { userId, type: "welcome", status: "pending" },
      select: { id: true },
    });
    if (!job) return;

    if (await isEmailSuppressed(email)) {
      await prisma.emailJob.update({
        where: { id: job.id },
        data: { status: "skipped", error: "suppressed (bounce/complaint)", sentAt: new Date() },
      });
      return;
    }

    // No marketing-consent gate here: the welcome is a service communication
    // (TRANSACTIONAL_NURTURE_TYPES) for the account the user just created.
    // The preference row is still resolved for the unsubscribe token.
    const pref = await getOrCreateEmailPreference(userId, email);

    const result = await sendNurtureEmail(email, "welcome", {
      unsubscribeToken: pref.unsubscribeToken,
    });
    if (result.ok) {
      await prisma.emailJob.update({
        where: { id: job.id },
        data: { status: "sent", sentAt: new Date(), messageId: result.id, attempts: 1 },
      });
    }
    // Not ok → leave pending; the cron picks it up within the hour.
  } catch {
    // Leave pending for the cron — instant delivery is best-effort.
  }
}
