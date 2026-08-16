import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { SecurityClient } from "./SecurityClient";

/**
 * /admin/security — MFA enrolment for the admin account.
 *
 * The middleware lets a signed-in admin session WITHOUT a second factor reach
 * only this page; every other /admin route redirects here until an
 * authenticator app is enrolled. The role check below keeps signed-in
 * non-admin accounts out (the middleware's MFA logic alone would otherwise
 * let any signed-in user render their own profile under an /admin URL).
 */
export const metadata = { robots: { index: false, follow: false } };

export default async function AdminSecurityPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/admin/sign-in");
  const role = (sessionClaims as { metadata?: { role?: string } } | null)
    ?.metadata?.role;
  if (role !== "superadmin") redirect("/");
  return <SecurityClient />;
}
