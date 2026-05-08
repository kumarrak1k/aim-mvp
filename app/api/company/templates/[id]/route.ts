import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { cleanStr } from "../../../../lib/company";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const EXPERIENCE_LEVELS = ["Graduate / entry level", "Junior (1-3 years)", "Mid-level (3-5 years)", "Senior (5-8 years)", "Lead / Principal (8+ years)"];
const INTERVIEW_TYPES = ["Competency / behavioural", "Technical / skills-based", "Situational / case study", "Values / culture fit", "Mixed / general"];
const DIFFICULTIES = ["Standard", "Challenging", "Executive"];
const FOCUS_AREAS = ["Balanced", "Communication", "Problem solving", "Leadership", "Technical depth", "Stakeholder management"];

async function getMemberAndTemplate(userId: string, templateId: string) {
  const member = await prisma.companyMember.findFirst({ where: { clerkUserId: userId } });
  if (!member) return { error: "Not a company member.", status: 403 };

  const template = await prisma.assessmentTemplate.findFirst({
    where: { id: templateId, companyId: member.companyId },
    include: { _count: { select: { assignments: true } } },
  });
  if (!template) return { error: "Template not found.", status: 404 };

  return { member, template };
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    const { id } = await params;
    const result = await getMemberAndTemplate(userId, id);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

    return NextResponse.json({ template: result.template });
  } catch (error) {
    console.error("TEMPLATE GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load template." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    const { id } = await params;
    const result = await getMemberAndTemplate(userId, id);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

    if (!["admin", "recruiter"].includes(result.member.role)) {
      return NextResponse.json({ error: "Recruiter or admin access required." }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const updates: Record<string, unknown> = {};

    const name = cleanStr(body?.name);
    if (name) updates.name = name;

    const role = cleanStr(body?.role);
    if (role) updates.role = role;

    const description = cleanStr(body?.description);
    if ("description" in body) updates.description = description || null;

    if (EXPERIENCE_LEVELS.includes(body?.experienceLevel)) updates.experienceLevel = body.experienceLevel;
    if (INTERVIEW_TYPES.includes(body?.interviewType)) updates.interviewType = body.interviewType;
    if (DIFFICULTIES.includes(body?.difficulty)) updates.difficulty = body.difficulty;
    if (FOCUS_AREAS.includes(body?.focusArea)) updates.focusArea = body.focusArea;

    if (Number.isInteger(body?.questionCount) && body.questionCount >= 3 && body.questionCount <= 10) {
      updates.questionCount = body.questionCount;
    }

    if ("customInstructions" in body) {
      updates.customInstructions = cleanStr(body.customInstructions, "").slice(0, 2000) || null;
    }
    if ("competencyFramework" in body) {
      updates.competencyFramework = cleanStr(body.competencyFramework, "").slice(0, 2000) || null;
    }
    if ("isActive" in body) {
      updates.isActive = Boolean(body.isActive);
    }

    const template = await prisma.assessmentTemplate.update({
      where: { id },
      data: updates,
    });

    return NextResponse.json({ template });
  } catch (error) {
    console.error("TEMPLATE PATCH ERROR:", error);
    return NextResponse.json({ error: "Failed to update template." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    const { id } = await params;
    const result = await getMemberAndTemplate(userId, id);
    if ("error" in result) return NextResponse.json({ error: result.error }, { status: result.status });

    if (result.member.role !== "admin") {
      return NextResponse.json({ error: "Admin access required." }, { status: 403 });
    }

    if (result.template._count.assignments > 0) {
      // Soft-delete: deactivate rather than destroy to preserve assignment history
      await prisma.assessmentTemplate.update({ where: { id }, data: { isActive: false } });
      return NextResponse.json({ deleted: false, deactivated: true });
    }

    await prisma.assessmentTemplate.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("TEMPLATE DELETE ERROR:", error);
    return NextResponse.json({ error: "Failed to delete template." }, { status: 500 });
  }
}
