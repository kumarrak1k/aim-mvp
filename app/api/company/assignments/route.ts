import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { assignmentCreateSchema, parseJsonBody } from "../../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    const member = await prisma.companyMember.findFirst({ where: { clerkUserId: userId } });
    if (!member) return NextResponse.json({ error: "Not a company member." }, { status: 403 });

    const assignments = await prisma.candidateAssignment.findMany({
      where: { companyId: member.companyId },
      include: { template: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("ASSIGNMENTS GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load assignments." }, { status: 500 });
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

    const parsed = await parseJsonBody(request, assignmentCreateSchema);
    if ("response" in parsed) return parsed.response;
    const { candidateEmail, templateId, expiryDays } = parsed.data;

    const template = await prisma.assessmentTemplate.findFirst({
      where: { id: templateId, companyId: member.companyId, isActive: true },
    });
    if (!template) return NextResponse.json({ error: "Template not found or inactive." }, { status: 404 });

    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    const assignment = await prisma.candidateAssignment.create({
      data: {
        companyId: member.companyId,
        templateId,
        candidateEmail,
        expiresAt,
      },
      include: { template: { select: { id: true, name: true, role: true } } },
    });

    return NextResponse.json({ assignment }, { status: 201 });
  } catch (error) {
    console.error("ASSIGNMENTS POST ERROR:", error);
    return NextResponse.json({ error: "Failed to create assignment." }, { status: 500 });
  }
}
