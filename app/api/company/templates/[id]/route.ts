import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";
import { parseJsonBody, templateUpdateSchema } from "../../../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

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

    const parsed = await parseJsonBody(request, templateUpdateSchema);
    if ("response" in parsed) return parsed.response;
    const data = parsed.data;

    const updates: Record<string, unknown> = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.role !== undefined) updates.role = data.role;
    if (data.description !== undefined) updates.description = data.description ?? null;
    if (data.templateType !== undefined) updates.templateType = data.templateType;
    if (data.acStages !== undefined) updates.acStages = data.acStages ?? [];
    if (data.questionMix !== undefined) updates.questionMix = data.questionMix ?? null;
    if (data.experienceLevel !== undefined) updates.experienceLevel = data.experienceLevel;
    if (data.interviewType !== undefined) updates.interviewType = data.interviewType;
    if (data.difficulty !== undefined) updates.difficulty = data.difficulty;
    if (data.focusArea !== undefined) updates.focusArea = data.focusArea;
    if (data.questionCount !== undefined) updates.questionCount = data.questionCount;
    if (data.customInstructions !== undefined) updates.customInstructions = data.customInstructions ?? null;
    if (data.competencyFramework !== undefined) updates.competencyFramework = data.competencyFramework ?? null;
    if (data.isActive !== undefined) updates.isActive = data.isActive;

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
