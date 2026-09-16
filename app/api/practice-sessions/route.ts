import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { getAssessmentLinkedSessionIds } from "../../lib/sessionScope";
import { parseJsonBody, practiceSessionCreateSchema } from "../../lib/validation";
import {
  getCandidatePlan,
  type CandidatePlan,
  TRIAL_USAGE_CAPS,
  FREE_TIER,
} from "../../lib/candidatePlan";
import { recordActivity, ACTIVITY_EVENTS } from "../../lib/activity";
import {
  LISTED_STATUS_FILTER,
  PRACTICE_SESSION_STATUS,
  USAGE_COUNT_FILTER,
  isStale,
} from "../../lib/practiceSessionStatus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Start of the rolling free-tier window. */
function freeWindowStart(): Date {
  return new Date(Date.now() - FREE_TIER.windowDays * 24 * 60 * 60 * 1000);
}

function getSummaryScore(summary: Record<string, unknown>): number {
  const value = summary.overall_score;
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.round(value);
}

function getHireSignal(summary: Record<string, unknown>): string {
  const value = summary.hire_signal;
  if (typeof value !== "string") return "Moderate";
  return value.replace(/\s+/g, " ").trim().slice(0, 40) || "Moderate";
}

async function getUsageInfo(clerkUserId: string, plan: CandidatePlan) {
  // Free trial: fair-usage cap on saved practice interviews (cost control).
  // Real paid plans below are genuinely unlimited — the cap only applies
  // while the access is coming from the no-card trial.
  if (plan.isTrial) {
    const cap = TRIAL_USAGE_CAPS.practiceSessions;
    const since = plan.trialStartedAt ? new Date(plan.trialStartedAt) : undefined;
    const used = await prisma.practiceSession.count({
      where: {
        clerkUserId,
        ...USAGE_COUNT_FILTER,
        ...(since && { createdAt: { gte: since } }),
      },
    });
    return {
      planName: plan.planName,
      isTrial: true,
      dailyLimit: cap,
      usedToday: used,
      remainingToday: Math.max(0, cap - used),
      limitReached: used >= cap,
      resetsAt: "",
    };
  }

  if (plan.isUnlimited) {
    return {
      planName: plan.planName,
      isTrial: false,
      dailyLimit: null as null,
      usedToday: 0,
      remainingToday: null as null,
      limitReached: false,
      resetsAt: "",
    };
  }

  // Free tier: sessions saved inside the rolling window. Counting all-time
  // meant a free user hit a wall they could never get past, so there was never
  // a reason to return; the allowance now refills.
  const windowStart = freeWindowStart();
  // An interview counts once one answer has been scored, whether or not it was
  // finished, so the cap cannot be dodged by abandoning every interview.
  const usedInWindow = await prisma.practiceSession.count({
    where: { clerkUserId, createdAt: { gte: windowStart }, ...USAGE_COUNT_FILTER },
  });

  const remaining = Math.max(0, FREE_TIER.practiceSessionsPerWindow - usedInWindow);
  const limitReached = usedInWindow >= FREE_TIER.practiceSessionsPerWindow;

  // When the allowance is spent, the oldest session inside the window is the
  // one whose expiry frees up the next slot.
  let resetsAt = "";
  if (limitReached) {
    const oldest = await prisma.practiceSession.findFirst({
      where: { clerkUserId, createdAt: { gte: windowStart }, ...USAGE_COUNT_FILTER },
      orderBy: { createdAt: "asc" },
      select: { createdAt: true },
    });
    if (oldest) {
      resetsAt = new Date(
        oldest.createdAt.getTime() + FREE_TIER.windowDays * 24 * 60 * 60 * 1000
      ).toISOString();
    }
  }

  return {
    planName: plan.planName,
    isTrial: false,
    dailyLimit: FREE_TIER.practiceSessionsPerWindow,
    usedToday: usedInWindow,
    remainingToday: remaining,
    limitReached,
    resetsAt,
  };
}

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to view practice sessions." },
        { status: 401 }
      );
    }

    const plan = await getCandidatePlan(userId);

    const [sessions, unfinished, usage, assessmentLinkedIds] = await Promise.all([
      prisma.practiceSession.findMany({
        where: { clerkUserId: userId, ...LISTED_STATUS_FILTER },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          role: true,
          experienceLevel: true,
          interviewType: true,
          difficulty: true,
          focusArea: true,
          practiceMode: true,
          totalQuestions: true,
          overallScore: true,
          hireSignal: true,
          summary: true,
          results: true,
          speakerPreference: true,
          createdAt: true,
          status: true,
          answeredCount: true,
        },
      }),
      // The interview they walked away from, so the practice page can offer to
      // carry on instead of silently starting again from question 1.
      prisma.practiceSession.findFirst({
        where: {
          clerkUserId: userId,
          status: PRACTICE_SESSION_STATUS.IN_PROGRESS,
          ...USAGE_COUNT_FILTER,
        },
        orderBy: { updatedAt: "desc" },
        select: {
          id: true,
          attemptId: true,
          role: true,
          totalQuestions: true,
          answeredCount: true,
          practiceMode: true,
          config: true,
          // Needed to put the candidate back where they were, answers and all.
          results: true,
          status: true,
          lastActivityAt: true,
          updatedAt: true,
        },
      }),
      getUsageInfo(userId, plan),
      getAssessmentLinkedSessionIds(userId),
    ]);

    // Hide sessions completed as part of a company assessment —
    // those results belong to the hiring team.
    const personalSessions = sessions.filter(
      (session) => !assessmentLinkedIds.has(session.id)
    );

    return NextResponse.json({
      usage,
      sessions: personalSessions.map((session) => ({
        ...session,
        createdAt: session.createdAt.toISOString(),
      })),
      // Offered as "continue" only while it is fresh; a week-old attempt is
      // swept up rather than dangled in front of the candidate.
      inProgress:
        unfinished && !isStale(unfinished)
          ? {
              ...unfinished,
              lastActivityAt: unfinished.lastActivityAt.toISOString(),
              updatedAt: unfinished.updatedAt.toISOString(),
            }
          : null,
    });
  } catch (error) {
    console.error("PRACTICE SESSIONS GET ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load practice sessions." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to save practice sessions." },
        { status: 401 }
      );
    }

    const plan = await getCandidatePlan(userId);
    const usage = await getUsageInfo(userId, plan);

    if (usage.limitReached) {
      recordActivity(userId, ACTIVITY_EVENTS.PRACTICE_CAPPED, plan, {
        usedToday: usage.usedToday,
        dailyLimit: usage.dailyLimit,
      });
      const error = usage.isTrial
        ? `You've reached your free-trial fair-use limit of ${TRIAL_USAGE_CAPS.practiceSessions} practice interviews. Upgrade to Plus for unlimited practice.`
        : `You've used all ${FREE_TIER.practiceSessionsPerWindow} free sessions for this month. They refill ${
            usage.resetsAt
              ? `on ${new Date(usage.resetsAt).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`
              : `every ${FREE_TIER.windowDays} days`
          }, or upgrade to Plus for unlimited practice.`;
      return NextResponse.json({ error, usage }, { status: 429 });
    }

    const parsed = await parseJsonBody(request, practiceSessionCreateSchema);
    if ("response" in parsed) {
      // A completed interview failing validation means lost candidate work —
      // surface it in Sentry instead of returning a silent 400.
      Sentry.captureMessage("Practice session save rejected by validation", {
        level: "warning",
        extra: { userId },
      });
      return parsed.response;
    }
    const {
      role,
      experienceLevel,
      interviewType,
      difficulty,
      focusArea,
      practiceMode,
      totalQuestions,
      summary,
      results,
      speakerPreference,
      assignmentToken,
      attemptId,
      finishedEarly,
    } = parsed.data;

    // A company assessment must be answered in full: stopping early cannot
    // close the assignment.
    if (finishedEarly && assignmentToken) {
      return NextResponse.json(
        { error: "A company assessment cannot be finished early." },
        { status: 400 }
      );
    }

    const answeredCount = results.length;
    const status =
      finishedEarly && answeredCount < totalQuestions
        ? PRACTICE_SESSION_STATUS.FINISHED_EARLY
        : PRACTICE_SESSION_STATUS.COMPLETED;
    const finishedAt = new Date();

    // Save the session and (if it fulfils a company assessment invite) mark the
    // assignment complete atomically — so we never end up with a saved session
    // the hiring team can't see, or a completed assignment with no session.
    const session = await prisma.$transaction(async (tx) => {
      // Answers are saved as the interview runs, so the row usually exists
      // already. Finishing updates it; without an attempt id (older clients,
      // assessment centre) it is created here as before.
      const inProgressRow = attemptId
        ? await tx.practiceSession.findFirst({
            where: { clerkUserId: userId, attemptId },
            select: { id: true, status: true, answeredCount: true },
          })
        : null;

      const finalData = {
        role,
        experienceLevel,
        interviewType,
        difficulty,
        focusArea,
        practiceMode,
        totalQuestions,
        overallScore: getSummaryScore(summary),
        hireSignal: getHireSignal(summary),
        summary: summary as Prisma.InputJsonValue,
        results: results as Prisma.InputJsonValue,
        speakerPreference: (speakerPreference ?? null) as Prisma.InputJsonValue,
        status,
        answeredCount,
        completedAt: finishedAt,
        lastActivityAt: finishedAt,
      };

      const savedFields = {
        id: true,
        role: true,
        experienceLevel: true,
        interviewType: true,
        difficulty: true,
        focusArea: true,
        practiceMode: true,
        totalQuestions: true,
        overallScore: true,
        hireSignal: true,
        summary: true,
        results: true,
        speakerPreference: true,
        createdAt: true,
        status: true,
        answeredCount: true,
      } as const;

      const saved = inProgressRow
        ? await tx.practiceSession.update({
            where: { id: inProgressRow.id },
            data: finalData,
            select: savedFields,
          })
        : await tx.practiceSession.create({
            data: {
              clerkUserId: userId,
              attemptId: attemptId ?? null,
              ...finalData,
            },
            select: savedFields,
          });

      // A company assignment is only satisfied by a full interview, so an
      // early finish or a short answer set leaves it open.
      const fulfilsAssignment =
        status === PRACTICE_SESSION_STATUS.COMPLETED && answeredCount >= totalQuestions;

      if (assignmentToken && fulfilsAssignment) {
        const assignment = await tx.candidateAssignment.findUnique({
          where: { inviteToken: assignmentToken },
        });
        if (assignment && assignment.status !== "completed" && assignment.expiresAt > new Date()) {
          await tx.candidateAssignment.update({
            where: { inviteToken: assignmentToken },
            data: { status: "completed", clerkUserId: userId, sessionId: saved.id, completedAt: new Date() },
          });
        }
      }

      return saved;
    });

    recordActivity(userId, ACTIVITY_EVENTS.PRACTICE_COMPLETED, plan, {
      sessionId: session.id,
      role: session.role,
      overallScore: session.overallScore,
      attemptId: attemptId ?? null,
      answeredCount: results.length,
    });

    // Derive post-save usage locally — the pre-save check already counted, and
    // we just added exactly one session. Avoids a second count() per save.
    const updatedUsage =
      usage.dailyLimit === null
        ? usage
        : {
            ...usage,
            usedToday: usage.usedToday + 1,
            remainingToday: Math.max(0, (usage.remainingToday ?? 0) - 1),
            limitReached: usage.usedToday + 1 >= usage.dailyLimit,
          };

    return NextResponse.json({
      usage: updatedUsage,
      session: {
        ...session,
        createdAt: session.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("PRACTICE SESSIONS POST ERROR:", error);
    Sentry.captureException(error);
    return NextResponse.json(
      { error: "Failed to save practice session." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to delete practice sessions." },
        { status: 401 }
      );
    }

    // Bulk delete only personal sessions — assessment sessions are evidence
    // the hiring team relies on and cannot be wiped by the candidate.
    const assessmentLinkedIds = await getAssessmentLinkedSessionIds(userId);
    const deleted = await prisma.practiceSession.deleteMany({
      where: {
        clerkUserId: userId,
        ...(assessmentLinkedIds.size > 0 && {
          id: { notIn: Array.from(assessmentLinkedIds) },
        }),
      },
    });

    return NextResponse.json({
      success: true,
      deletedCount: deleted.count,
      message:
        deleted.count === 1
          ? "Deleted 1 saved practice session."
          : `Deleted ${deleted.count} saved practice sessions.`,
    });
  } catch (error) {
    console.error("PRACTICE SESSIONS DELETE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to delete saved practice sessions." },
      { status: 500 }
    );
  }
}
