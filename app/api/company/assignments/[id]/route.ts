import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    const { id } = await params;
    const member = await prisma.companyMember.findFirst({ where: { clerkUserId: userId } });
    if (!member) return NextResponse.json({ error: "Not a company member." }, { status: 403 });

    const assignment = await prisma.candidateAssignment.findFirst({
      where: { id, companyId: member.companyId },
      include: {
        template: { select: { id: true, name: true, role: true, experienceLevel: true, interviewType: true } },
      },
    });
    if (!assignment) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });

    return NextResponse.json({ assignment });
  } catch (error) {
    console.error("ASSIGNMENT GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load assignment." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    const { id } = await params;
    const member = await prisma.companyMember.findFirst({
      where: { clerkUserId: userId, role: { in: ["admin", "recruiter"] } },
    });
    if (!member) return NextResponse.json({ error: "Recruiter or admin access required." }, { status: 403 });

    const assignment = await prisma.candidateAssignment.findFirst({
      where: { id, companyId: member.companyId },
    });
    if (!assignment) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });

    if (assignment.status === "completed") {
      return NextResponse.json({ error: "Cannot delete a completed assessment." }, { status: 400 });
    }

    await prisma.candidateAssignment.delete({ where: { id } });
    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("ASSIGNMENT DELETE ERROR:", error);
    return NextResponse.json({ error: "Failed to delete assignment." }, { status: 500 });
  }
}
