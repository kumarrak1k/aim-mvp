import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { authenticateApiKey } from "../../../../lib/apiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteParams = { params: Promise<{ id: string }> };

// GET /api/v1/candidates/[id] — get one assignment with result
export async function GET(request: NextRequest, { params }: RouteParams) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  const assignment = await prisma.candidateAssignment.findFirst({
    where: { id, companyId: auth.companyId },
    include: {
      template: { select: { id: true, name: true, role: true, questionCount: true } },
    },
  });

  if (!assignment) {
    return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  }

  let result = null;
  if (assignment.sessionId) {
    const session = await prisma.practiceSession.findUnique({
      where: { id: assignment.sessionId },
      select: {
        id: true,
        overallScore: true,
        hireSignal: true,
        totalQuestions: true,
        summary: true,
        createdAt: true,
      },
    });
    if (session) {
      const summary = session.summary as Record<string, unknown> | null;
      result = {
        sessionId: session.id,
        overallScore: session.overallScore,
        hireSignal: session.hireSignal,
        totalQuestions: session.totalQuestions,
        recommendation:
          typeof summary?.final_recommendation === "string"
            ? summary.final_recommendation
            : null,
        topStrengths: Array.isArray(summary?.top_strengths) ? summary.top_strengths : [],
        priorityImprovements: Array.isArray(summary?.priority_improvements)
          ? summary.priority_improvements
          : [],
        completedAt: session.createdAt.toISOString(),
      };
    }
  }

  return NextResponse.json({
    id: assignment.id,
    candidateEmail: assignment.candidateEmail,
    status: assignment.status,
    createdAt: assignment.createdAt.toISOString(),
    startedAt: assignment.startedAt?.toISOString() ?? null,
    completedAt: assignment.completedAt?.toISOString() ?? null,
    expiresAt: assignment.expiresAt.toISOString(),
    template: assignment.template,
    result,
  });
}
