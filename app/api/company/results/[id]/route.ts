import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/company/results/[id]
 *
 * Returns the full evaluation for a single completed assignment in this
 * company — assignment metadata + the linked PracticeSession's per-question
 * results (transcripts, feedback, voice/video analysis) and the AI
 * summary. Drives the /company/results/[id] candidate detail view.
 *
 * Auth: must be a member of the same company that owns the assignment.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }

    const { id } = await params;

    const member = await prisma.companyMember.findFirst({
      where: { clerkUserId: userId },
    });
    if (!member) {
      return NextResponse.json(
        { error: "Not a company member." },
        { status: 403 }
      );
    }

    const assignment = await prisma.candidateAssignment.findFirst({
      where: { id, companyId: member.companyId },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            role: true,
            description: true,
            experienceLevel: true,
            interviewType: true,
            difficulty: true,
            focusArea: true,
            questionCount: true,
            customInstructions: true,
            competencyFramework: true,
          },
        },
      },
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found." },
        { status: 404 }
      );
    }

    const session = assignment.sessionId
      ? await prisma.practiceSession.findUnique({
          where: { id: assignment.sessionId },
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
            createdAt: true,
          },
        })
      : null;

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        candidateEmail: assignment.candidateEmail,
        status: assignment.status,
        createdAt: assignment.createdAt.toISOString(),
        startedAt: assignment.startedAt
          ? assignment.startedAt.toISOString()
          : null,
        completedAt: assignment.completedAt
          ? assignment.completedAt.toISOString()
          : null,
        expiresAt: assignment.expiresAt.toISOString(),
        emailSent: assignment.emailSent,
        emailSentAt: assignment.emailSentAt
          ? assignment.emailSentAt.toISOString()
          : null,
        emailSendCount: assignment.emailSendCount,
        emailError: assignment.emailError,
        template: assignment.template,
      },
      session: session
        ? {
            id: session.id,
            role: session.role,
            experienceLevel: session.experienceLevel,
            interviewType: session.interviewType,
            difficulty: session.difficulty,
            focusArea: session.focusArea,
            practiceMode: session.practiceMode,
            totalQuestions: session.totalQuestions,
            overallScore: session.overallScore,
            hireSignal: session.hireSignal,
            summary: session.summary,
            results: session.results,
            completedAt: session.createdAt.toISOString(),
          }
        : null,
    });
  } catch (error) {
    console.error("COMPANY RESULT DETAIL ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load result." },
      { status: 500 }
    );
  }
}
