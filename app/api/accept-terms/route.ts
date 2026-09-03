import { auth } from "@clerk/nextjs/server";
import { getAccountType } from "@/app/lib/accountType";
import { saveSignupAttributionIfUnset } from "@/app/lib/attribution";
import { sanitizeAttribution, classifyDevice } from "@/app/lib/attributionChannel";
import { CURRENT_TOS_VERSION, recordTosAcceptance } from "@/app/lib/legal";
import { autoStartCandidateTrial } from "@/app/lib/trialAutoStart";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json(
        { error: "You must be signed in to accept the terms." },
        { status: 401 }
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      version?: string;
      acceptTerms?: boolean;
      acceptPrivacy?: boolean;
      attribution?: unknown;
    };

    if (!body.acceptTerms || !body.acceptPrivacy) {
      return Response.json(
        { error: "You must confirm both the Terms of Use and the Privacy Policy." },
        { status: 400 }
      );
    }

    if (body.version !== CURRENT_TOS_VERSION) {
      return Response.json(
        { error: "The terms have been updated. Please reload the page." },
        { status: 409 }
      );
    }

    const forwarded = req.headers.get("x-forwarded-for");
    const ipAddress = forwarded ? forwarded.split(",")[0]!.trim() : null;
    const userAgent = req.headers.get("user-agent");

    await recordTosAcceptance({
      clerkUserId: userId,
      ipAddress,
      userAgent: userAgent ? userAgent.slice(0, 600) : null,
    });

    // Backup persistence of the first-touch acquisition snapshot (the main
    // path is the sign-up completion call; first write wins server-side).
    const attribution = sanitizeAttribution(body.attribution);
    if (attribution) {
      try {
        await saveSignupAttributionIfUnset(
          userId,
          attribution,
          req.headers.get("x-vercel-ip-country"),
          classifyDevice(req.headers.get("user-agent"))
        );
      } catch (err) {
        console.error("SAVE ATTRIBUTION ERROR:", err);
      }
    }

    // Backup initialisation: the normal trial + welcome-email auto-start
    // runs from the sign-up completion page, but that call is client-fired
    // and can be lost (OAuth redirect variations, tab closed on the splash).
    // Terms acceptance is the one server round-trip every new user makes,
    // so re-run the idempotent init here. getAccountType lazily stamps
    // unset accounts, which covers exactly the lost-completion case.
    // Non-fatal: acceptance must succeed even if the trial grant fails.
    try {
      const accountType = await getAccountType(userId);
      if (accountType === "candidate") {
        await autoStartCandidateTrial(userId, req.headers);
      }
    } catch {
      // Superadmin (throws by design) or a transient Clerk error — the
      // helper itself reports real failures to Sentry.
    }

    return Response.json({ ok: true, version: CURRENT_TOS_VERSION });
  } catch (error) {
    console.error("ACCEPT TERMS ERROR:", error);
    return Response.json({ error: "Could not record acceptance." }, { status: 500 });
  }
}
