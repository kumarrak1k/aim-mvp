import { auth, clerkClient } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { siteConfig } from "@/app/config/site";

/**
 * GET /api/admin/reject
 *
 * Called by /admin when a signed-in user is NOT a superadmin.
 * Revokes the active Clerk session so the user is fully signed out,
 * then redirects back to /admin/sign-in with an error flag.
 *
 * This prevents non-admin accounts from silently landing on the
 * candidate app after attempting to access /admin/sign-in.
 */
export async function GET(req: NextRequest) {
  const { sessionId } = await auth();

  if (sessionId) {
    try {
      const client = await clerkClient();
      await client.sessions.revokeSession(sessionId);
    } catch {
      // Session may already be invalid — safe to ignore.
    }
  }

  const target = new URL("/admin/sign-in?error=unauthorized", siteConfig.url);
  return NextResponse.redirect(target);
}
