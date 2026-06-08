import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import {
  AUDIENCE_PATHS,
  getAccountType,
  setAccountTypeIfUnset,
  type AccountType,
} from "@/app/lib/accountType";
import { startCandidateTrialIfEligible } from "@/app/lib/candidatePlan";
import { claimTrialEligibility, releaseTrialEligibility } from "@/app/lib/trialEligibility";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET — return the caller's account type. Used by client UIs that need to
 * know whether to send the user to /practice or /company/dashboard.
 */
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }

    // Superadmin accounts have no candidate/corporate type — return early
    // so getAccountType never throws and Sentry stays quiet.
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    if ((user.privateMetadata as { role?: string })?.role === "superadmin") {
      return NextResponse.json({ accountType: "superadmin" });
    }

    const accountType = await getAccountType(userId);
    return NextResponse.json({
      accountType,
      paths: AUDIENCE_PATHS[accountType],
    });
  } catch (error) {
    console.error("ACCOUNT TYPE GET ERROR:", error);
    return NextResponse.json(
      { error: "Failed to load account type." },
      { status: 500 }
    );
  }
}

/**
 * POST — called by the dedicated sign-up pages right after Clerk creates
 * the user. The request body has the audience baked in (set by the page
 * the user came through). We only ever set this for users who don't
 * already have one — never overwrite.
 *
 * Body: { accountType: "candidate" | "corporate" }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorised." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const requested = body?.accountType as AccountType | undefined;

    if (requested !== "candidate" && requested !== "corporate") {
      return NextResponse.json(
        { error: "accountType must be 'candidate' or 'corporate'." },
        { status: 400 }
      );
    }

    const result = await setAccountTypeIfUnset(userId, requested);

    // Superadmin accounts cannot be used as candidate/corporate — signal
    // this to the sign-up complete pages so they redirect to /admin.
    if (result.isSuperAdmin) {
      return NextResponse.json({ accountType: "superadmin" });
    }

    // Auto-start the 7-day reverse trial for new candidates — but only for a
    // genuine, not-already-trialed email (blocks disposable + plus-tag farming).
    let trialStarted = false;
    if (result.accountType === "candidate") {
      let trialEmail = "";
      try {
        const client = await clerkClient();
        const user = await client.users.getUser(userId);
        trialEmail = user.emailAddresses[0]?.emailAddress ?? "";
        const eligibility = await claimTrialEligibility(userId, trialEmail);
        if (eligibility.eligible) {
          const trial = await startCandidateTrialIfEligible(userId);
          trialStarted = trial.started;
          // claimTrialEligibility burns the email's one-time slot up-front. If
          // the trial didn't actually start, release it so the slot isn't lost.
          if (!trial.started) await releaseTrialEligibility(userId, trialEmail);
        }
      } catch (err) {
        // Non-fatal: a failed trial grant must not block sign-up completion.
        console.error("TRIAL START ERROR:", err);
        // The claim may have landed before the throw — release it so a later
        // retry (e.g. via /api/trial/start) can still succeed.
        if (trialEmail) await releaseTrialEligibility(userId, trialEmail);
      }
    }

    return NextResponse.json({
      accountType: result.accountType,
      alreadySet: result.alreadySet,
      trialStarted,
      paths: AUDIENCE_PATHS[result.accountType],
    });
  } catch (error) {
    console.error("ACCOUNT TYPE POST ERROR:", error);
    return NextResponse.json(
      { error: "Failed to set account type." },
      { status: 500 }
    );
  }
}
