import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { isAssessmentLinkedSession } from "../../../lib/sessionScope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getSessionIdFromRequest(request: NextRequest) {
  const parts = request.nextUrl.pathname.split("/").filter(Boolean);
  return parts[parts.length - 1] || "";
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to view this practice session." },
        { status: 401 }
      );
    }

    const sessionId = getSessionIdFromRequest(request);

    if (!sessionId) {
      return NextResponse.json(
        { error: "Practice session ID is required." },
        { status: 400 }
      );
    }

    const session = await prisma.practiceSession.findFirst({
      where: {
        id: sessionId,
        clerkUserId: userId,
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
        updatedAt: true,
      },
    });

    if (!session) {
      return NextResponse.json(
        { error: "Practice session was not found." },
        { status: 404 }
      );
    }

    // If this session was completed as part of a company assessment, the
    // candidate doesn't get to see it via the personal endpoint. Return 404
    // (not 403) so the row is genuinely invisible to candidate-side UI.
    // The hiring team accesses it via /api/company/results/[id] instead.
    if (await isAssessmentLinkedSession(userId, sessionId)) {
      return NextResponse.json(
        { error: "Practice session was not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      session: {
        ...session,
        createdAt: session.createdAt.toISOString(),
        updatedAt: session.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("PRACTICE SESSION DETAIL GET ERROR:", error);

    return NextResponse.json(
      { error: "Failed to load practice session." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to delete this practice session." },
        { status: 401 }
      );
    }

    const sessionId = getSessionIdFromRequest(request);

    if (!sessionId) {
      return NextResponse.json(
        { error: "Practice session ID is required." },
        { status: 400 }
      );
    }

    // Same gating as GET: assessment-linked sessions are owned by the
    // hiring team. The candidate cannot delete a session that was
    // commissioned by a company — that would let them tamper with hiring
    // evidence.
    if (await isAssessmentLinkedSession(userId, sessionId)) {
      return NextResponse.json(
        { error: "Practice session was not found." },
        { status: 404 }
      );
    }

    const deleted = await prisma.practiceSession.deleteMany({
      where: {
        id: sessionId,
        clerkUserId: userId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Practice session was not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Practice session deleted.",
    });
  } catch (error) {
    console.error("PRACTICE SESSION DETAIL DELETE ERROR:", error);

    return NextResponse.json(
      { error: "Failed to delete practice session." },
      { status: 500 }
    );
  }
}