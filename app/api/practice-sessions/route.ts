import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { getAssessmentLinkedSessionIds } from "../../lib/sessionScope";
import { parseJsonBody, practiceSessionCreateSchema } from "../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DAILY_COMPLETED_SESSION_LIMIT = 3;
const BETA_PLAN_NAME = "Beta";

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

function getTodayRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return {
    start,
    end,
  };
}

async function getDailyUsage(clerkUserId: string) {
  const { start, end } = getTodayRange();

  const usedToday = await prisma.practiceSession.count({
    where: {
      clerkUserId,
      createdAt: {
        gte: start,
        lt: end,
      },
    },
  });

  const remainingToday = Math.max(0, DAILY_COMPLETED_SESSION_LIMIT - usedToday);

  return {
    planName: BETA_PLAN_NAME,
    dailyLimit: DAILY_COMPLETED_SESSION_LIMIT,
    usedToday,
    remainingToday,
    limitReached: usedToday >= DAILY_COMPLETED_SESSION_LIMIT,
    resetsAt: end.toISOString(),
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

    const [sessions, usage, assessmentLinkedIds] = await Promise.all([
      prisma.practiceSession.findMany({
        where: {
          clerkUserId: userId,
        },
        orderBy: {
          createdAt: "desc",
        },
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
      getDailyUsage(userId),
      getAssessmentLinkedSessionIds(userId),
    ]);

    // Hide sessions that were completed as part of a company assessment.
    // Those results belong to the hiring team — the candidate ran the
    // session but doesn't get to see their own scoring. Recruiters access
    // these via /api/company/results/* with company-membership auth.
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

    const usage = await getDailyUsage(userId);

    if (usage.limitReached) {
      return NextResponse.json(
        {
          error:
            "You have reached your daily beta limit for completed practice sessions.",
          usage,
        },
        { status: 429 }
      );
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

    const session = await prisma.practiceSession.create({
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

    // Link to company assessment assignment if token provided
    if (assignmentToken) {
      const assignment = await prisma.candidateAssignment.findUnique({
        where: { inviteToken: assignmentToken },
      });
      if (assignment && assignment.status !== "completed" && assignment.expiresAt > new Date()) {
        await prisma.candidateAssignment.update({
          where: { inviteToken: assignmentToken },
          data: { status: "completed", clerkUserId: userId, sessionId: session.id, completedAt: new Date() },
        });
      }
    }

    const updatedUsage = await getDailyUsage(userId);

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

    // Bulk delete only the candidate's PERSONAL sessions. Sessions linked
    // to a company assessment are evidence the hiring team relies on, so
    // the candidate cannot wipe them via "delete all my data".
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