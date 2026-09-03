import type { ReactNode } from "react";
import { auth } from "@clerk/nextjs/server";
import { AudienceShell } from "@/app/components/marketing/AudienceShell";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";

/**
 * Auth-aware candidate shell.
 *
 * Signed-in visitors get the app shell (account nav + avatar); signed-out
 * visitors get the marketing shell (Sign in / Start free). Every
 * candidate-facing marketing page should render this rather than picking a
 * shell directly.
 *
 * Why this exists: pages that hardcoded AudienceShell showed the signed-out
 * header to signed-in users, so following a link (e.g. a "Free tools" item)
 * looked like being logged out. Centralising the choice here means a page
 * can never drift out of sync with the visitor's auth state again.
 */
export async function CandidateShell({
  currentPath,
  children,
}: {
  currentPath: string;
  children: ReactNode;
}) {
  const { userId } = await auth();

  if (userId) {
    return (
      <CandidateAppShell currentPath={currentPath}>{children}</CandidateAppShell>
    );
  }

  return (
    <AudienceShell audience="candidate" currentPath={currentPath}>
      {children}
    </AudienceShell>
  );
}
