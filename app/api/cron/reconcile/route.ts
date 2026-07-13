import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { runStripeReconcile } from "@/app/lib/stripeReconcile";
import { warmDb } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Reconcile pages through Stripe subscriptions and calls Clerk/Prisma per
// drifted record — give it more than the default function budget.
export const maxDuration = 60;

/**
 * GET /api/cron/reconcile
 *
 * Nightly Stripe ↔ DB reconciliation (see app/lib/stripeReconcile.ts). Catches
 * any subscription webhook Stripe couldn't deliver. Scheduled daily in
 * vercel.json (03:00 UTC); on Hobby it can also be driven by an external
 * scheduler for sub-daily runs (same Bearer-token contract as the nurture cron).
 */
export async function GET(req: NextRequest) {
  // Fail CLOSED: without CRON_SECRET this state-mutating endpoint must not be
  // publicly triggerable. Vercel Cron injects this header automatically.
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;
  const a = Buffer.from(authHeader);
  const b = Buffer.from(expected);
  if (!secret || a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { ok: false, error: "Stripe not configured" },
      { status: 503 },
    );
  }

  try {
    // Absorb Neon cold starts — this cron fires at 03:00 UTC, always cold.
    await warmDb();
    const summary = await runStripeReconcile();
    if (summary.candidateFixed > 0 || summary.corporateFixed > 0 || summary.errors > 0) {
      console.warn("RECONCILE CRON: drift repaired", JSON.stringify(summary));
    }
    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("RECONCILE CRON: failed", err);
    return NextResponse.json(
      { ok: false, error: "reconcile failed" },
      { status: 500 },
    );
  }
}
