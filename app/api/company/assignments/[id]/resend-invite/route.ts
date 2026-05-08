import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../../../lib/prisma";
import { sendCandidateInvite } from "../../../../../lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/company/assignments/[id]/resend-invite
 *
 * Re-sends the candidate invite email for an existing assignment. Useful
 * when:
 *   - the original send failed (Resend was down, candidate's mailbox bounced)
 *   - the candidate lost the email and asks for a fresh copy
 *   - the recruiter wants to nudge an unfinished assessment
 *
 * Limits:
 *   - admin or recruiter only
 *   - cannot re-send a completed assessment
 *   - hard cap of 5 sends per assignment to stop accidental loops
 */
export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    const { id } = await params;

    const member = await prisma.companyMember.findFirst({
      where: { clerkUserId: userId, role: { in: ["admin", "recruiter"] } },
    });
    if (!member) {
      return NextResponse.json(
        { error: "Recruiter or admin access required." },
        { status: 403 }
      );
    }

    const assignment = await prisma.candidateAssignment.findFirst({
      where: { id, companyId: member.companyId },
      include: {
        template: { select: { name: true, role: true } },
        company: { select: { name: true, brandColor: true } },
      },
    });
    if (!assignment) {
      return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
    }

    if (assignment.status === "completed") {
      return NextResponse.json(
        { error: "This assessment is already completed." },
        { status: 400 }
      );
    }

    if (assignment.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "This invite has expired. Create a new assignment instead." },
        { status: 410 }
      );
    }

    if (assignment.emailSendCount >= 5) {
      return NextResponse.json(
        { error: "This invite has already been resent the maximum number of times (5)." },
        { status: 429 }
      );
    }

    const sendResult = await sendCandidateInvite({
      to: assignment.candidateEmail,
      companyName: assignment.company.name,
      companyBrandColor: assignment.company.brandColor,
      templateName: assignment.template.name,
      roleTitle: assignment.template.role,
      inviteToken: assignment.inviteToken,
      expiresAt: assignment.expiresAt,
    });

    const updated = await prisma.candidateAssignment.update({
      where: { id: assignment.id },
      data: sendResult.ok
        ? {
            emailSent: true,
            emailSentAt: new Date(),
            emailMessageId: sendResult.id,
            emailError: null,
            emailSendCount: { increment: 1 },
          }
        : {
            emailSent: assignment.emailSent, // preserve any earlier success
            emailError: sendResult.error.slice(0, 500),
            emailSendCount: { increment: 1 },
          },
      include: { template: { select: { id: true, name: true, role: true } } },
    });

    if (!sendResult.ok) {
      console.error("RESEND INVITE FAILED:", sendResult.error);
      return NextResponse.json(
        {
          assignment: updated,
          emailSent: false,
          error: sendResult.error,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      assignment: updated,
      emailSent: true,
    });
  } catch (error) {
    console.error("RESEND INVITE ROUTE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to resend invite." },
      { status: 500 }
    );
  }
}
