import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * Candidate marketing area layout.
 * Blocks superadmin accounts from entering candidate pages —
 * they are redirected to /admin instead.
 *
 * This is the server-side fallback guard. The middleware in middleware.ts
 * also redirects superadmins once Clerk session-token customisation is in
 * place (Dashboard → Configure → Sessions → Customize session token →
 * add { "metadata": "{{user.private_metadata}}" }).
 */
export default async function ForCandidatesLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  if (userId) {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    if ((user.privateMetadata as { role?: string })?.role === "superadmin") {
      redirect("/admin");
    }
  }

  return <>{children}</>;
}
