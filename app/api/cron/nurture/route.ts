import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { sendNurtureEmail } from "@/app/lib/email";

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

  for (const job of due) {
    await prisma.emailJob.update({
      where: { id: job.id },
      data: { attempts: { increment: 1 } },
    });

    const result = await sendNurtureEmail(
      job.email,
      job.type as
        | "welcome"
        | "day2_tip"
        | "day4_social"
        | "day7_upgrade"
        | "day14_reengage"
        | "day21_nudge"
        | "day30_winback"
    );

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

  return NextResponse.json({ ok: true, sent, failed, processed: due.length });
}
