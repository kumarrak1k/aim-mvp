/**
 * Schedules the two trial lifecycle emails for an existing candidate who
 * starts a trial outside the normal sign-up flow (the sign-up nurture sequence
 * already includes them for brand-new accounts).
 *
 *   trial_midway — 5 days in, "a few days left" value nudge (marketing)
 *   trial_ended  — at trial end, "your trial has ended" notice (transactional)
 *
 * Idempotent: skips if a trial_ended job already exists for the user.
 */

import { prisma } from "./prisma";

export async function enqueueTrialEmails(
  userId: string,
  email: string,
  trialEndsAt: Date
): Promise<void> {
  if (!email) return;

  const existing = await prisma.emailJob.findFirst({
    where: { userId, type: "trial_ended" },
    select: { id: true },
  });
  if (existing) return;

  const midway = new Date();
  midway.setDate(midway.getDate() + 5);

  const jobs: Array<{ userId: string; email: string; type: string; scheduledAt: Date }> = [];
  // Only schedule the midway nudge if it lands before the trial actually ends.
  if (midway < trialEndsAt) {
    jobs.push({ userId, email, type: "trial_midway", scheduledAt: midway });
  }
  jobs.push({ userId, email, type: "trial_ended", scheduledAt: trialEndsAt });

  await prisma.emailJob.createMany({ data: jobs });
}
