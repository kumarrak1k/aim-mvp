import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { getAssessmentLinkedSessionIds } from "../../lib/sessionScope";
import { parseJsonBody, practiceSessionCreateSchema } from "../../lib/validation";
import {
  getCandidatePlan,
  type CandidatePlan,
  TRIAL_USAGE_CAPS,
} from "../../lib/candidatePlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Total number of sessions a free-tier user can save (all-time, not per day). */
const FREE_TRIAL_LIMIT = 3;

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
      where: { clerkUserId, ...(since && { createdAt: { gte: since } }) },
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

  // Free tier: count all sessions ever saved (one-time trial of 3 sessions).
  const totalUsed = await prisma.practiceSession.count({
    where: { clerkUserId },
  });

  const remaining = Math.max(0, FREE_TRIAL_LIMIT - totalUsed);
  const limitReached = totalUsed >= FREE_TRIAL_LIMIT;

  return {
    planName: plan.planName,
    isTrial: false,
    dailyLimit: FREE_TRIAL_LIMIT,
    usedToday: totalUsed,
    remainingToday: remaining,
    limitReached,
    resetsAt: "",
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

    const [sessions, usage, assessmentLinkedIds] = await Promise.all([
      prisma.practiceSession.findMany({
        where: { clerkUserId: userId },
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
      const error = usage.isTrial
        ? `You've reached your free-trial fair-use limit of ${TRIAL_USAGE_CAPS.practiceSessions} practice interviews. Upgrade to Plus for unlimited practice.`
        : "You've used all 3 free sessions. Upgrade to Plus for unlimited practice.";
      return NextResponse.json({ error, usage }, { status: 429 });
    }

    const parsed = await parseJsonBody(request, practiceSessionCreateSchema);
    if ("response" in parsed) return parsed.response;
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
    } = parsed.data;

    // Save the session and (if it fulfils a company assessment invite) mark the
    // assignment complete atomically — so we never end up with a saved session
    // the hiring team can't see, or a completed assignment with no session.
    const session = await prisma.$transaction(async (tx) => {
      const created = await tx.practiceSession.create({
        data: {
          clerkUserId: userId,
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
        },
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
        },
      });

      if (assignmentToken) {
        const assignment = await tx.candidateAssignment.findUnique({
          where: { inviteToken: assignmentToken },
        });
        if (assignment && assignment.status !== "completed" && assignment.expiresAt > new Date()) {
          await tx.candidateAssignment.update({
            where: { inviteToken: assignmentToken },
            data: { status: "completed", clerkUserId: userId, sessionId: created.id, completedAt: new Date() },
          });
        }
      }

      return created;
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
