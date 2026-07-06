import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import { getAssessmentLinkedSessionIds } from "@/app/lib/sessionScope";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/account/delete — self-serve account deletion (UK GDPR Art. 17).
 *
 * Erases the user's personal data and their Clerk account. Sessions completed
 * as part of a company assessment are retained (the hiring team's evidence,
 * kept under legitimate interest) — matching the personal-data DELETE on
 * /api/practice-sessions. Company admins must delete their workspace first.
 *
 * Body: { confirm: "DELETE" }
 */
export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { confirm?: string };
  if (body.confirm !== "DELETE") {
    return NextResponse.json(
      { error: 'Confirmation required: send { "confirm": "DELETE" }.' },
      { status: 400 }
    );
  }

  // Block if the user administers a workspace — they must delete/transfer it
  // first so a company isn't left orphaned.
  const adminOf = await prisma.companyMember.findFirst({
    where: { clerkUserId: userId, role: "admin" },
  });
  if (adminOf) {
    return NextResponse.json(
      {
        error:
          "You administer a hiring workspace. Delete it first from the Company Dashboard → Danger zone, then delete your account.",
      },
      { status: 409 }
    );
  }

  try {
    const assessmentLinkedIds = await getAssessmentLinkedSessionIds(userId);

    // Purge personal data. Assessment-linked practice sessions are retained.
    await prisma.$transaction([
      prisma.practiceSession.deleteMany({
        where: {
          clerkUserId: userId,
          ...(assessmentLinkedIds.size > 0 && {
            id: { notIn: Array.from(assessmentLinkedIds) },
          }),
        },
      }),
      prisma.assessmentCentreSession.deleteMany({ where: { clerkUserId: userId } }),
      prisma.careerDocGeneration.deleteMany({ where: { clerkUserId: userId } }),
      prisma.emailJob.deleteMany({ where: { userId } }),
      prisma.emailPreference.deleteMany({ where: { clerkUserId: userId } }),
      prisma.userProfile.deleteMany({ where: { clerkUserId: userId } }),
      prisma.trialGrant.deleteMany({ where: { clerkUserId: userId } }),
      prisma.companyMember.deleteMany({ where: { clerkUserId: userId } }),
    ]);

    // Finally, delete the Clerk account (email, name, auth identities).
    const client = await clerkClient();
    await client.users.deleteUser(userId);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("ACCOUNT DELETE ERROR:", error);
    return NextResponse.json(
      { error: "Failed to delete account. Please contact privacy@aicareermentor.co.uk." },
      { status: 500 }
    );
  }
}
