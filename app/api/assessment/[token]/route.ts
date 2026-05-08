import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { assessmentCompleteSchema, parseJsonBody } from "../../../lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ token: string }> };

/** Mask an email so the public GET response confirms identity to the
 *  intended recipient without leaking it to anyone who guesses a token. */
function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "•••@•••";
  const visible = local.length <= 2 ? local[0] : `${local[0]}${local[1]}`;
  return `${visible}${"•".repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}

/** Validate token format before hitting the database — stops obvious
 *  scraper traffic with a cheap response. */
function isValidTokenFormat(token: string): boolean {
  return /^[a-zA-Z0-9_-]{8,80}$/.test(token);
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const { token } = await params;

    if (!isValidTokenFormat(token)) {
      return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
    }

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
            customInstructions: true,
            competencyFramework: true,
          },
        },
      },
    });

    if (!assignment) return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });

    if (assignment.expiresAt < new Date()) {
      return NextResponse.json({ error: "This invite has expired." }, { status: 410 });
    }

    // For completed assignments we still return company/template so the
    // completion thank-you page can render branded copy. The 409 status is
    // preserved as the signal "this invite is no longer actionable".
    if (assignment.status === "completed") {
      return NextResponse.json(
        {
          error: "This assessment has already been completed.",
          assignment: {
            id: assignment.id,
            status: assignment.status,
            expiresAt: assignment.expiresAt,
            candidateEmailMasked: maskEmail(assignment.candidateEmail),
          },
          company: assignment.company,
          template: assignment.template,
        },
        { status: 409 }
      );
    }

    return NextResponse.json({
      assignment: {
        id: assignment.id,
        status: assignment.status,
        expiresAt: assignment.expiresAt,
        // Mask the candidate email so the public endpoint doesn't broadcast
        // the full address to anyone who lands on the link.
        candidateEmailMasked: maskEmail(assignment.candidateEmail),
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

    if (!isValidTokenFormat(token)) {
      return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
    }

    const assignment = await prisma.candidateAssignment.findUnique({
      where: { inviteToken: token },
    });

    if (!assignment) return NextResponse.json({ error: "Invalid invite link." }, { status: 404 });
    if (assignment.expiresAt < new Date())
      return NextResponse.json({ error: "This invite has expired." }, { status: 410 });
    if (assignment.status === "completed")
      return NextResponse.json({ error: "Already completed." }, { status: 409 });

    const parsed = await parseJsonBody(request, assessmentCompleteSchema);
    if ("response" in parsed) return parsed.response;
    const { sessionId } = parsed.data;

    // Confirm the session exists AND belongs to this user. The compound
    // where ensures user A cannot complete the assessment with user B's
    // session id — even if they somehow learn it.
    const session = await prisma.practiceSession.findFirst({
      where: { id: sessionId, clerkUserId: userId },
    });
    if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

    // Defence in depth: only accept sessions that were actually created
    // after this assignment was issued. Stops a user replaying a much
    // older session as the answer to a fresh assessment invite.
    if (session.createdAt < assignment.createdAt) {
      return NextResponse.json(
        { error: "Session must be completed after the assessment was issued." },
        { status: 400 }
      );
    }

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
