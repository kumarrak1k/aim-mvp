import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

/**
 * Not indexed while the corporate offer moves to its own site.
 *
 * The pages still resolve for anyone following a direct link, and the recruiter
 * app under /company plus the emailed invite flows are untouched. This only
 * stops search engines surfacing an offer the main site no longer advertises,
 * which would otherwise send graduates to a recruiter page.
 */
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};


/**
 * Business marketing area layout.
 * Blocks superadmin accounts from entering business pages —
 * they are redirected to /admin instead.
 *
 * Uses session claims (JWT) instead of a Clerk API call so this never
 * fails due to a Clerk API 500, and adds no latency for regular users.
 * Requires Clerk JWT customisation: Dashboard → Sessions → Customize
 * session token → add { "metadata": "{{user.private_metadata}}" }.
 */
export default async function ForBusinessLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  try {
    const { userId, sessionClaims } = await auth();
    if (userId) {
      const role = (sessionClaims as { metadata?: { role?: string } } | null)
        ?.metadata?.role;
      if (role === "superadmin") {
        redirect("/admin");
      }
    }
  } catch {
    // Auth error — render the page normally rather than crashing.
    // The middleware edge guard still covers the superadmin redirect.
  }

  return <>{children}</>;
}
