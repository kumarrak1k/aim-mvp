import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { sendCandidateInvite } from "../../../lib/email";
import { assignmentCreateSchema, parseJsonBody } from "../../../lib/validation";
import {
  getPlan,
  isPlanActive,
  CORPORATE_TRIAL_INVITE_CAP,
} from "../../../lib/corporatePlan";

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

    const [template, company] = await Promise.all([
      prisma.assessmentTemplate.findFirst({
        where: { id: templateId, companyId: member.companyId, isActive: true },
      }),
      prisma.company.findUnique({ where: { id: member.companyId } }),
    ]);
    if (!template) return NextResponse.json({ error: "Template not found or inactive." }, { status: 404 });
    if (!company) return NextResponse.json({ error: "Company not found." }, { status: 404 });

    // Plan check — active trial or paid plan required to send candidate invites
    if (!isPlanActive(company)) {
      return NextResponse.json(
        { error: "Your workspace needs an active plan to send candidate invites. Choose a plan from the dashboard." },
        { status: 403 }
      );
    }

    // Trial fair-usage cap — limits invites (and therefore OpenAI cost) during
    // a free trial. Paid plans skip this and use the monthly limit below.
    const onTrial = company.planStatus === "trial";
    if (onTrial && (company.trialInvitesUsed ?? 0) >= CORPORATE_TRIAL_INVITE_CAP) {
      return NextResponse.json(
        {
          error: `Your free trial includes ${CORPORATE_TRIAL_INVITE_CAP} candidate invites. Upgrade your plan to send more.`,
        },
        { status: 403 }
      );
    }

    // Monthly invite limit check
    const plan = getPlan(company.planId);
    if (plan) {
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const inviteCount = await prisma.candidateAssignment.count({
        where: { companyId: member.companyId, createdAt: { gte: startOfMonth } },
      });
      if (inviteCount >= plan.invitesPerMonth) {
        return NextResponse.json(
          { error: `Monthly invite limit of ${plan.invitesPerMonth} reached for your ${plan.name} plan. Limit resets on the 1st of next month.` },
          { status: 403 }
        );
      }
    }

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

    // Count this invite against the trial fair-usage cap.
    if (onTrial) {
      await prisma.company.update({
        where: { id: member.companyId },
        data: { trialInvitesUsed: { increment: 1 } },
      });
    }

    // Send the invite email. Don't fail the request if email errors —
    // recruiters can still copy the link manually, and we record the
    // failure on the assignment so the UI can offer a Retry button.
    const sendResult = await sendCandidateInvite({
      to: candidateEmail,
      companyName: company.name,
      companyBrandColor: company.brandColor,
      templateName: template.name,
      roleTitle: template.role,
      inviteToken: assignment.inviteToken,
      expiresAt,
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
            emailSent: false,
            emailError: sendResult.error.slice(0, 500),
            emailSendCount: { increment: 1 },
          },
      include: { template: { select: { id: true, name: true, role: true } } },
    });

    if (!sendResult.ok) {
      console.error("ASSIGNMENT EMAIL SEND FAILED:", sendResult.error);
    }

    return NextResponse.json(
      {
        assignment: updated,
        emailSent: sendResult.ok,
        emailWarning: sendResult.ok ? undefined : sendResult.error,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("ASSIGNMENTS POST ERROR:", error);
    return NextResponse.json({ error: "Failed to create assignment." }, { status: 500 });
  }
}
