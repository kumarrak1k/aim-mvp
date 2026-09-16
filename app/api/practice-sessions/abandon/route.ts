import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { PRACTICE_SESSION_STATUS } from "@/app/lib/practiceSessionStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/practice-sessions/abandon
 *
 * The candidate chose to throw an unfinished interview away, or to start a
 * fresh one instead of carrying on. The row is kept (it still counts towards
 * usage and tells us where people stop) but marked abandoned, so it is no
 * longer offered back to them or listed as a result.
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "You must be signed in." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { attemptId?: unknown } | null;
    const attemptId = typeof body?.attemptId === "string" ? body.attemptId.slice(0, 64) : "";
    if (!attemptId) {
      return NextResponse.json({ error: "Attempt id is required." }, { status: 400 });
    }

    const updated = await prisma.practiceSession.updateMany({
      where: {
        clerkUserId: userId,
        attemptId,
        status: PRACTICE_SESSION_STATUS.IN_PROGRESS,
      },
      data: { status: PRACTICE_SESSION_STATUS.ABANDONED, lastActivityAt: new Date() },
    });

    return NextResponse.json({ abandoned: updated.count });
  } catch (error) {
    console.error("PRACTICE SESSION ABANDON ERROR:", error);
    return NextResponse.json({ error: "Could not discard this interview." }, { status: 500 });
  }
}
