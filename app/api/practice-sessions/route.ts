import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRACTICE_MODES = ["typed", "voice", "voice-camera"];

const DAILY_COMPLETED_SESSION_LIMIT = 3;
const BETA_PLAN_NAME = "Beta";

function cleanText(value: unknown, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.replace(/\s+/g, " ").trim() || fallback;
}

function cleanNumber(value: unknown, fallback = 0) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.round(value);
}

function cleanPracticeMode(value: unknown) {
  const mode = cleanText(value, "typed");
  return PRACTICE_MODES.includes(mode) ? mode : "typed";
}

function getSummaryScore(summary: unknown) {
  const input = summary as { overall_score?: unknown } | null;

  return cleanNumber(input?.overall_score, 0);
}

function getHireSignal(summary: unknown) {
  const input = summary as { hire_signal?: unknown } | null;

  return cleanText(input?.hire_signal, "Moderate").slice(0, 40);
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

    const [sessions, usage] = await Promise.all([
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
    ]);

    return NextResponse.json({
      usage,
      sessions: sessions.map((session) => ({
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

    const body = await request.json().catch(() => null);

    const role = cleanText(body?.role);
    const experienceLevel = cleanText(
      body?.experienceLevel,
      "Graduate / entry level"
    );
    const interviewType = cleanText(
      body?.interviewType,
      "Competency / behavioural"
    );
    const difficulty = cleanText(body?.difficulty, "Standard");
    const focusArea = cleanText(body?.focusArea, "Balanced");
    const practiceMode = cleanPracticeMode(body?.practiceMode);
    const totalQuestions = cleanNumber(body?.totalQuestions, 5);
    const summary = body?.summary;
    const results = body?.results;
    const speakerPreference = body?.speakerPreference ?? null;

    if (!role) {
      return NextResponse.json(
        { error: "Role is required to save a practice session." },
        { status: 400 }
      );
    }

    if (!summary || typeof summary !== "object") {
      return NextResponse.json(
        { error: "Session summary is required." },
        { status: 400 }
      );
    }

    if (!Array.isArray(results)) {
      return NextResponse.json(
        { error: "Session results are required." },
        { status: 400 }
      );
    }

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
        speakerPreference: speakerPreference as Prisma.InputJsonValue,
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