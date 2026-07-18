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
}
