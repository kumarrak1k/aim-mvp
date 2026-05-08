import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { parseJsonBody, templateCreateSchema } from "../../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    const member = await prisma.companyMember.findFirst({ where: { clerkUserId: userId } });
    if (!member) return NextResponse.json({ error: "Not a company member." }, { status: 403 });

    const templates = await prisma.assessmentTemplate.findMany({
      where: { companyId: member.companyId },
      include: {
        _count: { select: { assignments: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error("TEMPLATES GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load templates." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    const member = await prisma.companyMember.findFirst({
      where: { clerkUserId: userId, role: { in: ["admin", "recruiter"] } },
    });
    if (!member) return NextResponse.json({ error: "Recruiter or admin access required." }, { status: 403 });

    const parsed = await parseJsonBody(request, templateCreateSchema);
    if ("response" in parsed) return parsed.response;
    const {
      name,
      role,
      description,
      experienceLevel,
      interviewType,
      difficulty,
      focusArea,
      questionCount,
      customInstructions,
      competencyFramework,
    } = parsed.data;

    const template = await prisma.assessmentTemplate.create({
      data: {
        companyId: member.companyId,
        name,
        role,
        description: description ?? null,
        experienceLevel,
        interviewType,
        difficulty,
        focusArea,
        questionCount,
        customInstructions: customInstructions ?? null,
        competencyFramework: competencyFramework ?? null,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("TEMPLATES POST ERROR:", error);
    return NextResponse.json({ error: "Failed to create template." }, { status: 500 });
  }
}
