import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

/**
 * Corporate workspace layout.
 * Blocks superadmin accounts from entering the corporate area using session
 * claims (JWT-based — no Clerk API call required, resilient to Clerk API 500s).
 */
export default async function CompanyLayout({
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
    // Auth error — render the page normally. Middleware edge guard is the
    // primary superadmin protection.
  }

  return <>{children}</>;
}
