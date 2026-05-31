import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/company/results
 *
 * Returns a recruiter-facing list of every assessment assignment for the
 * caller's company, with score data joined in for completed ones. Drives
 * the /company/results summary table.
 *
 * The shape is deliberately wide enough to power sorting and filtering
 * client-side — most companies won't have hundreds of assignments and
 * doing it all in one round-trip keeps the page snappy.
 */

type SummaryShape = {
  overall_score?: number;
  readiness_score?: number;
  hire_signal?: string;
  category_breakdown?: Record<string, number>;
  top_strengths?: string[];
  priority_improvements?: string[];
  final_recommendation?: string;
};

function pickNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.round(value * 10) / 10;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }

    const member = await prisma.companyMember.findFirst({
      where: { clerkUserId: userId },
    });
    if (!member) {
      return NextResponse.json(
        { error: "Not a company member." },
        { status: 403 }
      );
    }

    const assignments = await prisma.candidateAssignment.findMany({
      where: { companyId: member.companyId },
      include: {
        template: {
          select: { id: true, name: true, role: true, questionCount: true },
        },
      },
      orderBy: { createdAt: "desc" },
      // Bound the response — newest 200 assessments (each pulls a session blob).
      take: 200,
    });

    // Pull all linked sessions in one go to avoid N+1.
    const sessionIds = assignments
      .map((a) => a.sessionId)
      .filter((id): id is string => Boolean(id));

    const sessions = sessionIds.length
      ? await prisma.practiceSession.findMany({
          where: { id: { in: sessionIds } },
          select: {
            id: true,
            overallScore: true,
            hireSignal: true,
            practiceMode: true,
            totalQuestions: true,
            summary: true,
            createdAt: true,
          },
        })
      : [];

    const sessionMap = new Map(sessions.map((s) => [s.id, s]));

    const rows = assignments.map((assignment) => {
      const session = assignment.sessionId
        ? sessionMap.get(assignment.sessionId)
        : null;
      const summary = (session?.summary || null) as SummaryShape | null;

      return {
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
        template: {
          id: assignment.template.id,
          name: assignment.template.name,
          role: assignment.template.role,
          questionCount: assignment.template.questionCount,
        },
        session: session
          ? {
              id: session.id,
              overallScore: session.overallScore,
              readinessScore: pickNumber(summary?.readiness_score),
              hireSignal: session.hireSignal,
              practiceMode: session.practiceMode,
              totalQuestions: session.totalQuestions,
              recommendation: summary?.final_recommendation || null,
              completedAt: session.createdAt.toISOString(),
            }
          : null,
      };
    });

    const completed = rows.filter((r) => r.session);
    const stats = {
      total: rows.length,
      completed: completed.length,
      pending: rows.filter((r) => r.status === "pending").length,
      averageScore: completed.length
        ? Math.round(
            (completed.reduce(
              (sum, r) => sum + (r.session?.overallScore ?? 0),
              0
            ) /
              completed.length) *
              10
          ) / 10
        : null,
      strongCount: completed.filter(
        (r) => r.session?.hireSignal?.toLowerCase() === "strong"
      ).length,
    };

    return NextResponse.json({ rows, stats });
  } catch (error) {
    console.error("COMPANY RESULTS GET ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load results." },
      { status: 500 }
    );
  }
}
