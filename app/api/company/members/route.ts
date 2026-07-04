import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { cleanStr } from "../../../lib/company";
import { getPlan, isPlanActive } from "../../../lib/corporatePlan";
import { checkRateLimit } from "../../../lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    const member = await prisma.companyMember.findFirst({ where: { clerkUserId: userId } });
    if (!member) return NextResponse.json({ error: "Not a company member." }, { status: 403 });

    const [members, invites] = await Promise.all([
      prisma.companyMember.findMany({
        where: { companyId: member.companyId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.companyInvite.findMany({
        where: { companyId: member.companyId, used: false, expiresAt: { gt: new Date() } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return NextResponse.json({ members, invites });
  } catch (error) {
    console.error("COMPANY MEMBERS GET ERROR:", error);
    return NextResponse.json({ error: "Failed to load members." }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    const rl = await checkRateLimit(userId, "company-members-invite", 20, 3600);
    if (!rl.allowed) {
      return NextResponse.json({ error: "Too many requests. Please wait." }, { status: 429 });
    }

    const admin = await prisma.companyMember.findFirst({
      where: { clerkUserId: userId, role: "admin" },
    });
    if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const email = cleanStr(body?.email).toLowerCase();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const role = ["admin", "recruiter", "viewer"].includes(body?.role) ? body.role : "recruiter";

    // Plan check — must be on an active trial or paid plan to invite team members
    const company = await prisma.company.findUnique({ where: { id: admin.companyId } });
    if (!company || !isPlanActive(company)) {
      return NextResponse.json(
        { error: "Your workspace needs an active plan to invite team members. Choose a plan from the dashboard." },
        { status: 403 }
      );
    }

    // Seat check — count current active members vs plan limit
    const plan = getPlan(company.planId);
    if (plan) {
      const currentSeats = await prisma.companyMember.count({ where: { companyId: admin.companyId } });
      if (currentSeats >= plan.seats) {
        return NextResponse.json(
          { error: `Your ${plan.name} plan allows up to ${plan.seats} recruiter seats. Remove a member or upgrade your plan.` },
          { status: 403 }
        );
      }
    }

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const invite = await prisma.companyInvite.create({
      data: {
        companyId: admin.companyId,
        email,
        role,
        expiresAt,
      },
    });

    return NextResponse.json({ invite }, { status: 201 });
  } catch (error) {
    console.error("COMPANY MEMBERS POST ERROR:", error);
    return NextResponse.json({ error: "Failed to create invite." }, { status: 500 });
  }
}

/**
 * DELETE — remove a team member from the workspace.
 * Only admins can remove members. Admins cannot remove themselves
 * (the workspace must always have at least one admin).
 * Body: { memberId: string }
 */
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    const admin = await prisma.companyMember.findFirst({
      where: { clerkUserId: userId, role: "admin" },
    });
    if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const memberId = body?.memberId as string | undefined;
    if (!memberId) return NextResponse.json({ error: "memberId is required." }, { status: 400 });

    // Target must be in the same company
    const target = await prisma.companyMember.findFirst({
      where: { id: memberId, companyId: admin.companyId },
    });
    if (!target) return NextResponse.json({ error: "Member not found." }, { status: 404 });

    // Cannot remove yourself — admin always stays
    if (target.clerkUserId === userId) {
      return NextResponse.json(
        { error: "You cannot remove yourself from the workspace." },
        { status: 400 }
      );
    }

    await prisma.companyMember.delete({ where: { id: memberId } });

    return NextResponse.json({ success: true, removedMemberId: memberId });
  } catch (error) {
    console.error("COMPANY MEMBERS DELETE ERROR:", error);
    return NextResponse.json({ error: "Failed to remove member." }, { status: 500 });
  }
}
