import { redirect } from "next/navigation";
import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * Corporate workspace layout.
 * Blocks superadmin accounts from entering the corporate area —
 * they are redirected to /admin instead.
 */
export default async function CompanyLayout({
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
