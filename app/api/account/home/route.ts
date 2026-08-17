import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { AUDIENCE_PATHS, getAccountType } from "@/app/lib/accountType";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/account/home — send a signed-in user to their account's home.
 *
 * Used by the "My dashboard" header button, which replaces the per-audience
 * Sign in links once a session exists (a signed-in candidate clicking the
 * corporate Sign in used to be silently bounced to /practice, which read as
 * a bug). Candidates land on /practice, corporate members on their company
 * dashboard; superadmins never reach this route because the middleware
 * already redirects them to /admin.
 */
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/", req.url));

  try {
    const accountType = await getAccountType(userId);
    const home = AUDIENCE_PATHS[accountType]?.authedHome ?? "/";
    return NextResponse.redirect(new URL(home, req.url));
  } catch {
    // Account type not set yet (mid-onboarding) or Clerk hiccup — the
    // completion page can finish setup; worst case it forwards them on.
    return NextResponse.redirect(
      new URL("/for-candidates/auth-complete", req.url)
    );
  }
}
