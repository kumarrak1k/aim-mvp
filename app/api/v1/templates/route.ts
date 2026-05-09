import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { authenticateApiKey } from "../../../lib/apiAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// GET /api/v1/templates — list active assessment templates for the company
export async function GET(request: NextRequest) {
  const auth = await authenticateApiKey(request);
  if (!auth.ok) return auth.response;

  const templates = await prisma.assessmentTemplate.findMany({
    where: { companyId: auth.companyId, isActive: true },
    select: {
      id: true,
      name: true,
      description: true,
      role: true,
      experienceLevel: true,
      interviewType: true,
      difficulty: true,
      focusArea: true,
      questionCount: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    data: templates.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
    })),
    total: templates.length,
  });
}
