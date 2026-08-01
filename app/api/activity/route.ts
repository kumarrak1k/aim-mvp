import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { recordActivity, ACTIVITY_EVENTS } from "@/app/lib/activity";
import {
  resolveCandidatePlanFromClaims,
  type CandidateBillingMeta,
} from "@/app/lib/candidatePlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Client-reported behavioural telemetry.
 *
 * Signed-in users only — anonymous traffic is Vercel Analytics' job, and
 * attaching a person to an event is the entire point of this endpoint. Anything
 * arriving without a session is dropped rather than stored under a null user.
 *
 * The client is untrusted: every field is length-capped and the path is
 * normalised before storage so a hostile or buggy caller cannot use this as
 * free-text storage. `plan` comes from JWT claims (no network call) and is
 * labelled as such — see the note in /api/interview.
 *
 * Fire-and-forget by design: it always returns 204 and never reports a storage
 * failure back to the page. Telemetry must not be able to break a session.
 */

/** Paths can carry ids; keep them but bound the length. */
const pathSchema = z.string().trim().min(1).max(300);
const visitSchema = z.string().trim().min(8).max(64);

const bodySchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("page_view"),
    path: pathSchema,
    visitId: visitSchema,
    referrer: z.string().trim().max(300).optional(),
    /** Sent on the *next* view or on unload, so it can lag its own event. */
    dwellMs: z.number().int().min(0).max(6 * 60 * 60 * 1000).optional(),
    locale: z.string().trim().max(10).optional(),
  }),
  z.object({
    type: z.literal("interaction"),
    action: z.string().trim().min(1).max(80),
    path: pathSchema,
    visitId: visitSchema,
    meta: z.record(z.string(), z.union([z.string().max(200), z.number(), z.boolean()])).optional(),
  }),
]);

export async function POST(request: NextRequest) {
  const { userId, sessionClaims } = await auth();
  if (!userId) return new NextResponse(null, { status: 204 });

  // Generous: a busy session legitimately fires a view per navigation. This is
  // an abuse ceiling, not a usage budget.
  const rl = await checkRateLimit(userId, "activity", 300, 60);
  if (!rl.allowed) return new NextResponse(null, { status: 204 });

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return new NextResponse(null, { status: 204 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return new NextResponse(null, { status: 204 });

  const plan = resolveCandidatePlanFromClaims(
    sessionClaims as { metadata?: CandidateBillingMeta } | null
  );
  const data = parsed.data;

  if (data.type === "page_view") {
    recordActivity(userId, ACTIVITY_EVENTS.PAGE_VIEW, plan, {
      planSource: "claims",
      path: data.path,
      visitId: data.visitId,
      ...(data.dwellMs !== undefined ? { dwellMs: data.dwellMs } : {}),
      ...(data.referrer ? { referrer: data.referrer } : {}),
      ...(data.locale ? { locale: data.locale } : {}),
    });
  } else {
    recordActivity(userId, ACTIVITY_EVENTS.INTERACTION, plan, {
      planSource: "claims",
      action: data.action,
      path: data.path,
      visitId: data.visitId,
      ...(data.meta ? { meta: data.meta } : {}),
    });
  }

  return new NextResponse(null, { status: 204 });
}
