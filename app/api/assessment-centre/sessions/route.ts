import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/assessment-centre/sessions
 * Returns all completed assessment centre sessions for the signed-in user.
 * Used by the My Progress page to populate the Assessment Centre tab.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const sessions = await prisma.assessmentCentreSession.findMany({
    where: { clerkUserId: userId, status: "complete" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      role: true,
      sector: true,
      experienceLevel: true,
      selectedStages: true,
      overallScore: true,
      caseStudyScore: true,
      interviewScore: true,
      presentationScore: true,
      report: true,
      completedAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ sessions });
}
