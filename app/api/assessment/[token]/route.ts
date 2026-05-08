import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { cleanStr } from "../../../lib/company";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { token } = await params;

    const assignment = await prisma.candidateAssignment.findUnique({
      where: { inviteToken: token },
      include: {
        company: { select: { name: true, slug: true, brandColor: true, logoUrl: true } },
        template: {
          select: {
            name: true,
            role: true,
            description: true,
            experienceLevel: true,
            interviewType: true,
            difficulty: true,
            focusArea: true,
            questionCount: true,
          },
        },
      },
    });

    if (!assignment) return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });

    if (assignment.expiresAt < new Date()) {
      return NextResponse.json({ error: "This invite has expired." }, { status: 410 });
    }

    if (assignment.status === "completed") {
      return NextResponse.json({ error: "This assessment has already been completed." }, { status: 409 });
    }

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        status: assignment.status,
        expiresAt: assignment.expiresAt,
        candidateEmail: assignment.candidateEmail,
      },
      company: assignment.company,
      template: assignment.template,
    });
  } catch (error) {
    console.error("ASSESSMENT TOKEN GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load assessment." }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    const { token } = await params;
    const assignment = await prisma.candidateAssignment.findUnique({ where: { inviteToken: token } });

    if (!assignment) return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
    if (assignment.expiresAt < new Date()) return NextResponse.json({ error: "This invite has expired." }, { status: 410 });
    if (assignment.status === "completed") return NextResponse.json({ error: "Already completed." }, { status: 409 });

    const body = await request.json().catch(() => ({}));
    const sessionId = cleanStr(body?.sessionId);
    if (!sessionId) return NextResponse.json({ error: "sessionId is required." }, { status: 400 });

    const session = await prisma.practiceSession.findFirst({ where: { id: sessionId, clerkUserId: userId } });
    if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

    const updated = await prisma.candidateAssignment.update({
      where: { inviteToken: token },
      data: {
        status: "completed",
        clerkUserId: userId,
        sessionId,
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ assignment: updated });
  } catch (error) {
    console.error("ASSESSMENT TOKEN POST ERROR:", error);
    return NextResponse.json({ error: "Failed to complete assessment." }, { status: 500 });
  }
}
