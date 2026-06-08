import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/prisma";
import { PLAN_CONFIG } from "../../../lib/corporatePlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST — start a 14-day free trial on the chosen plan.
 * Only callable by the workspace admin. Idempotent: calling again
 * on the same plan while still in trial is a no-op and returns success.
 * Switching plan during trial replaces the planId (trial clock resets).
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorised." }, { status: 401 });

    const admin = await prisma.companyMember.findFirst({
      where: { clerkUserId: userId, role: "admin" },
    });
    if (!admin) return NextResponse.json({ error: "Admin access required." }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const planId = body?.planId as string | undefined;

    if (!planId || !(planId in PLAN_CONFIG)) {
      return NextResponse.json(
        { error: "planId must be 'team' or 'business'." },
        { status: 400 }
      );
    }

    const plan = PLAN_CONFIG[planId as keyof typeof PLAN_CONFIG];

    const existing = await prisma.company.findUnique({
      where: { id: admin.companyId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Company not found." }, { status: 404 });
    }

    // A free trial may be started only ONCE per workspace. If one has already
    // been used (or the workspace is/was on a paid plan), allow switching the
    // selected plan but never reset the trial clock or the invite counter —
    // otherwise an admin could re-POST to renew the trial forever.
    const trialAlreadyUsed =
      existing.trialStartedAt != null ||
      ["active", "expired", "cancelled"].includes(existing.planStatus);

    if (trialAlreadyUsed) {
      // While a Team trial is still LIVE, the plan must not be switched up to
      // Business here — that would hand a workspace Business seats/invites for
      // free. Business is a paid upgrade and must go through Stripe checkout.
      if (existing.planStatus === "trial" && planId !== "team") {
        return NextResponse.json(
          {
            error:
              "Business isn't part of the free trial. Upgrade to Business from the billing page to unlock its seats and invites.",
          },
          { status: 400 }
        );
      }
      const company = await prisma.company.update({
        where: { id: admin.companyId },
        data: { planId },
      });
      return NextResponse.json({ company, trialStarted: false });
    }

    // Free trials run on the Team plan only — Business is a paid upgrade.
    if (planId !== "team") {
      return NextResponse.json(
        {
          error:
            "Free trials run on the Team plan. Start a Team trial — you can upgrade to Business anytime.",
        },
        { status: 400 }
      );
    }

    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + plan.trialDays * 24 * 60 * 60 * 1000);

    const company = await prisma.company.update({
      where: { id: admin.companyId },
      data: {
        planId,
        planStatus: "trial",
        trialStartedAt: now,
        trialEndsAt,
        trialInvitesUsed: 0,
      },
    });

    return NextResponse.json({ company, trialStarted: true });
  } catch (error) {
    console.error("COMPANY PLAN POST ERROR:", error);
    return NextResponse.json({ error: "Failed to start trial." }, { status: 500 });
  }
}
