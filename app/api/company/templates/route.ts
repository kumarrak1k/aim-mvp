import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { cleanStr } from "../../../lib/company";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EXPERIENCE_LEVELS = ["Graduate / entry level", "Junior (1-3 years)", "Mid-level (3-5 years)", "Senior (5-8 years)", "Lead / Principal (8+ years)"];
const INTERVIEW_TYPES = ["Competency / behavioural", "Technical / skills-based", "Situational / case study", "Values / culture fit", "Mixed / general"];
const DIFFICULTIES = ["Standard", "Challenging", "Executive"];
const FOCUS_AREAS = ["Balanced", "Communication", "Problem solving", "Leadership", "Technical depth", "Stakeholder management"];

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

    const body = await request.json().catch(() => ({}));
    const name = cleanStr(body?.name);
    if (!name) return NextResponse.json({ error: "Template name is required." }, { status: 400 });

    const role = cleanStr(body?.role);
    if (!role) return NextResponse.json({ error: "Role is required." }, { status: 400 });

    const experienceLevel = EXPERIENCE_LEVELS.includes(body?.experienceLevel)
      ? body.experienceLevel
      : "Graduate / entry level";
    const interviewType = INTERVIEW_TYPES.includes(body?.interviewType)
      ? body.interviewType
      : "Competency / behavioural";
    const difficulty = DIFFICULTIES.includes(body?.difficulty) ? body.difficulty : "Standard";
    const focusArea = FOCUS_AREAS.includes(body?.focusArea) ? body.focusArea : "Balanced";
    const questionCount = Number.isInteger(body?.questionCount) && body.questionCount >= 3 && body.questionCount <= 10
      ? body.questionCount
      : 5;
    const description = cleanStr(body?.description);
    const customInstructions = cleanStr(body?.customInstructions, "").slice(0, 2000);
    const competencyFramework = cleanStr(body?.competencyFramework, "").slice(0, 2000);

    const template = await prisma.assessmentTemplate.create({
      data: {
        companyId: member.companyId,
        name,
        role,
        description: description || null,
        experienceLevel,
        interviewType,
        difficulty,
        focusArea,
        questionCount,
        customInstructions: customInstructions || null,
        competencyFramework: competencyFramework || null,
      },
    });

    return NextResponse.json({ template }, { status: 201 });
  } catch (error) {
    console.error("TEMPLATES POST ERROR:", error);
    return NextResponse.json({ error: "Failed to create template." }, { status: 500 });
  }
}
