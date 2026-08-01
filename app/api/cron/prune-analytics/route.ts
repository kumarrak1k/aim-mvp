import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma, warmDb } from "@/app/lib/prisma";
import { ANALYTICS_RETENTION_DAYS, ANALYTICS_EVENTS } from "@/app/lib/activity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Deletes in batches and may have a large backlog on its first run.
export const maxDuration = 60;

/**
 * GET /api/cron/prune-analytics
 *
 * Enforces the retention period the privacy policy promises. The policy states
 * that analytics records are deleted after 12 months, which is a commitment
 * rather than a description until something actually deletes them — this is
 * that something.
 *
 * Scope is deliberately narrow: ONLY consent-based behavioural telemetry
 * (page views, interactions, tool use, chat questions). The service-side
 * events in the same table — practice starts and completions, assessment
 * centre progress, plan-blocked attempts — are records of what the product did
 * for a user, are covered by the service data retention terms, and are what
 * makes historical funnel analysis possible. Deleting those would quietly
 * destroy the drop-off history this table exists to provide.
 *
 * Batched because a single unbounded deleteMany over a year of page views can
 * exceed the function budget and hold a long transaction on a serverless
 * Postgres connection.
 */
const BATCH_SIZE = 5000;
const MAX_BATCHES = 10;

export async function GET(req: NextRequest) {
  // Fail CLOSED: without CRON_SECRET this destructive endpoint must not be
  // publicly triggerable. Vercel Cron injects this header automatically.
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  if (!secret || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  const cutoff = new Date(
    Date.now() - ANALYTICS_RETENTION_DAYS * 24 * 60 * 60 * 1000
  );

  try {
    await warmDb();

    let deleted = 0;
    let batches = 0;

    for (; batches < MAX_BATCHES; batches++) {
      // Select ids first, then delete by id: deleteMany has no LIMIT, and an
      // unbounded delete is exactly what the batching is here to avoid.
      const doomed = await prisma.activityEvent.findMany({
        where: { event: { in: [...ANALYTICS_EVENTS] }, createdAt: { lt: cutoff } },
        select: { id: true },
        take: BATCH_SIZE,
      });
      if (doomed.length === 0) break;

      const result = await prisma.activityEvent.deleteMany({
        where: { id: { in: doomed.map((d) => d.id) } },
      });
      deleted += result.count;

      if (doomed.length < BATCH_SIZE) break;
    }

    // More left than one run could clear — the next scheduled run continues.
    // Surfaced rather than silently truncated so a persistent backlog is
    // visible instead of looking like a completed prune.
    const moreRemaining = batches >= MAX_BATCHES;

    return NextResponse.json({
      ok: true,
      deleted,
      cutoff: cutoff.toISOString(),
      retentionDays: ANALYTICS_RETENTION_DAYS,
      moreRemaining,
    });
  } catch (error) {
    console.error("PRUNE ANALYTICS ERROR:", error);
    return NextResponse.json(
      { ok: false, error: "Prune failed" },
      { status: 500 }
    );
  }
}
