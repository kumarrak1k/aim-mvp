import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getAccountType } from "@/app/lib/accountType";
import { startCandidateTrialIfEligible } from "@/app/lib/candidatePlan";
import { enqueueTrialEmails } from "@/app/lib/trialEmails";
import { claimTrialEligibility } from "@/app/lib/trialEligibility";

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
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const email = user.emailAddresses[0]?.emailAddress ?? "";

    // Block disposable / already-trialed emails (anti-farming).
    const eligibility = await claimTrialEligibility(userId, email);
    if (!eligibility.eligible) {
      const message =
        eligibility.reason === "disposable_email"
          ? "Please use a non-disposable email address to start a free trial."
          : "This email has already used a free trial.";
      return NextResponse.json(
        { started: false, reason: eligibility.reason, message },
        { status: 409 }
      );
    }

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

    // Schedule the trial reminder + expiry emails (idempotent).
    if (result.trialEndsAt) {
      try {
        await enqueueTrialEmails(userId, email, new Date(result.trialEndsAt));
      } catch (err) {
        console.error("ENQUEUE TRIAL EMAILS ERROR:", err);
      }
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
