import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import {
  sendNurtureEmail,
  TRANSACTIONAL_NURTURE_TYPES,
  type NurtureType,
} from "@/app/lib/email";
import { getOrCreateEmailPreference } from "@/app/lib/emailPreferences";
import { isEmailSuppressed } from "@/app/lib/emailSuppression";
import { getCandidatePlan } from "@/app/lib/candidatePlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Fail CLOSED: a missing CRON_SECRET must not leave this email-sending
  // endpoint publicly triggerable. Vercel Cron injects this Authorization
  // header automatically when CRON_SECRET is set in the project env.
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  if (!secret || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const due = await prisma.emailJob.findMany({
    where: {
      status: "pending",
      scheduledAt: { lte: new Date() },
      attempts: { lt: 3 },
    },
    take: 200,
    orderBy: { scheduledAt: "asc" },
  });

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const job of due) {
    const type = job.type as NurtureType;
    // Per-job try/catch so one bad job can't abort the whole batch.
    try {
      await prisma.emailJob.update({
        where: { id: job.id },
        data: { attempts: { increment: 1 } },
      });

      // Never send to a hard-bounced / complained address (sender reputation).
      if (await isEmailSuppressed(job.email)) {
        await prisma.emailJob.update({
          where: { id: job.id },
          data: { status: "skipped", error: "suppressed (bounce/complaint)", sentAt: new Date() },
        });
        skipped++;
        continue;
      }

      // Trial emails are state-sensitive: never tell a converted/paid user their
      // trial ended, and don't nudge someone who already upgraded.
      if (type === "trial_midway" || type === "trial_ended") {
        let stillRelevant = false;
        try {
          const plan = await getCandidatePlan(job.userId);
          stillRelevant =
            type === "trial_midway" ? plan.isTrial : !plan.isPaid && !plan.isTrial;
        } catch {
          stillRelevant = false; // can't resolve → skip to stay safe
        }
        if (!stillRelevant) {
          await prisma.emailJob.update({
            where: { id: job.id },
            data: { status: "skipped", error: "trial state changed", sentAt: new Date() },
          });
          skipped++;
          continue;
        }
      }

      // Resolve consent + unsubscribe token. Marketing is suppressed for opted-out
      // users; transactional trial-status notices always send.
      let unsubscribeToken: string | undefined;
      let prefResolved = true;
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
        prefResolved = false;
      }

      // PECR: never send MARKETING without a verified consent + one-click
      // unsubscribe token. On lookup failure, only transactional notices proceed;
      // marketing is left pending to retry next run.
      if (!prefResolved && !TRANSACTIONAL_NURTURE_TYPES.has(type)) {
        skipped++;
        continue;
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
          data: { status: isFinal ? "failed" : "pending", error: result.error },
        });
        failed++;
      }
    } catch (err) {
      console.error("NURTURE CRON: job failed", job.id, err);
      failed++;
    }
  }

  // Housekeeping: prune terminal jobs older than 30 days. Each signup enqueues
  // ~8–10 jobs that are never queried again once sent/skipped/failed, so this
  // keeps the table (and its [status, scheduledAt] index) from growing forever.
  let purged = 0;
  try {
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const res = await prisma.emailJob.deleteMany({
      where: { status: { not: "pending" }, scheduledAt: { lt: cutoff } },
    });
    purged = res.count;
  } catch (err) {
    console.error("NURTURE CRON: purge failed", err);
  }

  return NextResponse.json({ ok: true, sent, failed, skipped, purged, processed: due.length });
}
