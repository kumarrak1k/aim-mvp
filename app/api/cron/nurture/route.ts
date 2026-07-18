import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma, warmDb } from "@/app/lib/prisma";
import {
  RECENT_ACTIVITY_DAYS,
  RE_ENGAGEMENT_TYPES,
  sendNurtureEmail,
  TRANSACTIONAL_NURTURE_TYPES,
  type NurtureType,
} from "@/app/lib/email";
import { getOrCreateEmailPreference } from "@/app/lib/emailPreferences";
import { isEmailSuppressed } from "@/app/lib/emailSuppression";
import { getCandidatePlan } from "@/app/lib/candidatePlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Headroom for warmDb's full retry window (~28s) plus the email batch.
export const maxDuration = 60;

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

  // Absorb Neon cold starts — this cron fires at quiet hours.
  await warmDb();

  const due = await prisma.emailJob.findMany({
    where: {
      status: "pending",
      scheduledAt: { lte: new Date() },
      attempts: { lt: 3 },
    },
    take: 200,
    orderBy: { scheduledAt: "asc" },
  });

  // ── Re-engagement targeting ─────────────────────────────────────────────
  // The day-N re-engagement nudges are scheduled off SIGNUP date, so without
  // this a happy daily user (or a paying subscriber) would be told "still
  // here?" and "your free practice sessions are waiting". Resolve who has
  // been active recently in ONE batch of queries rather than per job.
  const reengageUserIds = [
    ...new Set(due.filter((j) => RE_ENGAGEMENT_TYPES.has(j.type as NurtureType)).map((j) => j.userId)),
  ];
  const activeRecently = new Set<string>();
  if (reengageUserIds.length) {
    const cutoff = new Date(Date.now() - RECENT_ACTIVITY_DAYS * 24 * 60 * 60 * 1000);
    const scope = { clerkUserId: { in: reengageUserIds }, createdAt: { gte: cutoff } };
    const [practice, centres, docs] = await Promise.all([
      prisma.practiceSession.findMany({ where: scope, select: { clerkUserId: true }, distinct: ["clerkUserId"] }),
      prisma.assessmentCentreSession.findMany({ where: scope, select: { clerkUserId: true }, distinct: ["clerkUserId"] }),
      prisma.careerDocGeneration.findMany({ where: scope, select: { clerkUserId: true }, distinct: ["clerkUserId"] }),
    ]);
    for (const row of [...practice, ...centres, ...docs]) activeRecently.add(row.clerkUserId);
  }

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

      // Re-engagement nudges are for LAPSED free users only. A paying
      // subscriber, an active comp guest, or anyone who practised in the last
      // week must never be told their "free sessions are waiting".
      if (RE_ENGAGEMENT_TYPES.has(type)) {
        let skipReason = "";
        if (activeRecently.has(job.userId)) {
          skipReason = `active in last ${RECENT_ACTIVITY_DAYS} days`;
        } else {
          try {
            const plan = await getCandidatePlan(job.userId);
            if (plan.isPaid) skipReason = "paying subscriber";
            else if (plan.isComp) skipReason = "complimentary access";
          } catch {
            skipReason = "plan unresolved"; // fail closed: don't risk a wrong nudge
          }
        }
        if (skipReason) {
          await prisma.emailJob.update({
            where: { id: job.id },
            data: { status: "skipped", error: skipReason, sentAt: new Date() },
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
