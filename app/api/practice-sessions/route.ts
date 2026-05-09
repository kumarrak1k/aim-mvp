import { auth, clerkClient } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";
import { getAssessmentLinkedSessionIds } from "../../lib/sessionScope";
import { parseJsonBody, practiceSessionCreateSchema } from "../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FREE_DAILY_LIMIT = 3;

type PlanInfo = { planName: string; isUnlimited: boolean };

async function getUserPlanInfo(userId: string): Promise<PlanInfo> {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const meta = user.privateMetadata as {
      subscriptionStatus?: string;
      stripePlanId?: string;
    };
    const isActive = meta?.subscriptionStatus === "active";
    const planId = (meta?.stripePlanId ?? "").toLowerCase();

    if (!isActive) return { planName: "Free", isUnlimited: false };
    if (planId.includes("advanced")) return { planName: "Advanced", isUnlimited: true };
    if (planId.includes("professional")) return { planName: "Professional", isUnlimited: true };
    return { planName: "Free", isUnlimited: false };
  } catch {
    return { planName: "Free", isUnlimited: false };
  }
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

function getTodayRange() {
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

async function getDailyUsage(clerkUserId: string, planInfo: PlanInfo) {
  const { start, end } = getTodayRange();

  const usedToday = await prisma.practiceSession.count({
    where: {
      clerkUserId,
      createdAt: { gte: start, lt: end },
    },
  });

  const dailyLimit = planInfo.isUnlimited ? null : FREE_DAILY_LIMIT;
  const remainingToday = dailyLimit === null ? null : Math.max(0, dailyLimit - usedToday);
  const limitReached = dailyLimit !== null && usedToday >= dailyLimit;

  return {
    planName: planInfo.planName,
    dailyLimit,
    usedToday,
    remainingToday,
    limitReached,
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

    const planInfo = await getUserPlanInfo(userId);

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
      getDailyUsage(userId, planInfo),
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

    const planInfo = await getUserPlanInfo(userId);
    const usage = await getDailyUsage(userId, planInfo);

    if (usage.limitReached) {
      return NextResponse.json(
        {
          error:
            "You have reached your daily session limit. Upgrade to Professional for unlimited sessions.",
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

    const updatedUsage = await getDailyUsage(userId, planInfo);

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
