import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { getAccountType, AUDIENCE_PATHS } from "@/app/lib/accountType";
import { resolvePostAuthDestination } from "@/app/lib/postAuthDestination";

/**
 * Post-sign-in dispatcher.
 *
 * Both sign-in pages (candidate and business) point their
 * forceRedirectUrl here instead of hardcoding a destination.
 * This page reads the user's real accountType from Clerk
 * privateMetadata and redirects to the correct home — so a
 * candidate who accidentally uses the business sign-in URL
 * still ends up at /practice, not /company/dashboard.
 *
 * Admin-created accounts have forcePasswordReset = true in
 * privateMetadata — they are bounced to /change-password first
 * and only reach their portal after setting a new password.
 *
 * Sign-up complete pages keep their own redirect logic because
 * they also handle nurture emails, referral credits, and
 * Stripe checkout. This page is sign-in only.
 */
export default async function AuthRedirectPage() {
  const { userId } = await auth();

  if (!userId) {
    // Not signed in — send back to the main site
    redirect("/");
  }

  // Check for admin-created accounts that must set a new password first
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const meta = (user.privateMetadata ?? {}) as { forcePasswordReset?: boolean; role?: string };

  // Superadmin accounts belong in /admin — never in candidate/corporate flows.
  if (meta.role === "superadmin") {
    redirect("/admin");
  }

  if (meta.forcePasswordReset) {
    redirect("/change-password");
  }

  const accountType = await getAccountType(userId);

  // Candidates go through the post-auth resolver so anyone who has never
  // completed (or skipped) onboarding gets routed there once — including
  // accounts created while the signup path was bypassing it. Everyone else
  // goes straight to practice.
  if (accountType === "candidate") {
    redirect(await resolvePostAuthDestination(userId));
  }

  redirect(AUDIENCE_PATHS[accountType].authedHome);
}
