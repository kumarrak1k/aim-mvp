import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PRACTICE_MODES = ["typed", "voice", "voice-camera"];

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

export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to view practice sessions." },
        { status: 401 }
      );
    }

    const sessions = await prisma.practiceSession.findMany({
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
    });

    return NextResponse.json({
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

    return NextResponse.json({
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