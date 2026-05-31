import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAccountType } from "@/app/lib/accountType";
import { startCandidateTrialIfEligible } from "@/app/lib/candidatePlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/trial/start — lets an existing free candidate begin their one-time
 * 7-day full-access trial (the auto-start at sign-up only fires for brand-new
 * accounts). Idempotent: returns started=false if a trial was already used or
 * the user is already paying.
 */
export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  // Candidate accounts only — corporate workspaces have their own trial.
  let accountType: "candidate" | "corporate";
  try {
    accountType = await getAccountType(userId);
  } catch {
    return NextResponse.json({ error: "Unavailable for this account." }, { status: 403 });
  }
  if (accountType !== "candidate") {
    return NextResponse.json(
      { error: "Trials are available on candidate accounts only." },
      { status: 403 }
    );
  }

  try {
    const result = await startCandidateTrialIfEligible(userId);
    if (!result.started) {
      const message =
        result.reason === "already_consumed"
          ? "You've already used your free trial."
          : result.reason === "already_paid"
          ? "You're already on a paid plan."
          : "Trial could not be started.";
      return NextResponse.json(
        { started: false, reason: result.reason, message },
        { status: 409 }
      );
    }
    return NextResponse.json({
      started: true,
      trialEndsAt: result.trialEndsAt,
    });
  } catch (error) {
    console.error("TRIAL START ROUTE ERROR:", error);
    return NextResponse.json({ error: "Failed to start trial." }, { status: 500 });
  }
}
