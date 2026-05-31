import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import {
  sendNurtureEmail,
  TRANSACTIONAL_NURTURE_TYPES,
  type NurtureType,
} from "@/app/lib/email";
import { getOrCreateEmailPreference } from "@/app/lib/emailPreferences";
import { getCandidatePlan } from "@/app/lib/candidatePlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
    }
  }

  const due = await prisma.emailJob.findMany({
    where: {
      status: "pending",
      scheduledAt: { lte: new Date() },
      attempts: { lt: 3 },
    },
    take: 50,
    orderBy: { scheduledAt: "asc" },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const job of due) {
    const type = job.type as NurtureType;

    await prisma.emailJob.update({
      where: { id: job.id },
      data: { attempts: { increment: 1 } },
    });

    // Trial emails are state-sensitive: never tell a converted/paid user their
    // trial ended, and don't nudge someone who already upgraded.
    if (type === "trial_midway" || type === "trial_ended") {
      try {
        const plan = await getCandidatePlan(job.userId);
        const stillRelevant =
          type === "trial_midway" ? plan.isTrial : !plan.isPaid && !plan.isTrial;
        if (!stillRelevant) {
          await prisma.emailJob.update({
            where: { id: job.id },
            data: { status: "skipped", error: "trial state changed", sentAt: new Date() },
          });
          skipped++;
          continue;
        }
      } catch {
        // If we can't resolve plan state, skip trial emails to stay safe.
        await prisma.emailJob.update({
          where: { id: job.id },
          data: { status: "skipped", error: "plan lookup failed", sentAt: new Date() },
        });
        skipped++;
        continue;
      }
    }

    // Resolve consent + unsubscribe token. Marketing emails are suppressed for
    // users who've opted out; transactional trial-status notices always send.
    let unsubscribeToken: string | undefined;
    try {
      const pref = await getOrCreateEmailPreference(job.userId, job.email);
      unsubscribeToken = pref.unsubscribeToken;
      if (!TRANSACTIONAL_NURTURE_TYPES.has(type) && pref.marketingConsent === false) {
        await prisma.emailJob.update({
          where: { id: job.id },
          data: { status: "skipped", error: "marketing opt-out", sentAt: new Date() },
        });
        skipped++;
        continue;
      }
    } catch {
      // Preference lookup failed — fall through and still send (legacy behaviour),
      // just without a one-click unsubscribe token.
    }

    const result = await sendNurtureEmail(job.email, type, { unsubscribeToken });

    if (result.ok) {
      await prisma.emailJob.update({
        where: { id: job.id },
        data: { status: "sent", sentAt: new Date(), messageId: result.id, error: null },
      });
      sent++;
    } else {
      const isFinal = job.attempts + 1 >= 3;
      await prisma.emailJob.update({
        where: { id: job.id },
        data: {
          status: isFinal ? "failed" : "pending",
          error: result.error,
        },
      });
      failed++;
    }
  }

  return NextResponse.json({ ok: true, sent, failed, skipped, processed: due.length });
}
