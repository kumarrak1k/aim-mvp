import type { ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { ClerkAuthBridge } from "@/app/components/marketing/AuthState";

/**
 * The one place ClerkProvider is configured. It no longer wraps the root
 * layout: marketing pages ship zero clerk-js (the mobile blank-below-hero
 * fix), so the provider mounts only where Clerk is actually used —
 * unconditional layouts on the app + auth directories, and CandidateShell's
 * signed-in branch on dynamic marketing pages.
 *
 * Global Clerk URLs: without these, fallback flows (sign-out bounces, expired
 * sessions, account-portal links) land on Clerk's HOSTED pages at
 * accounts.aicareermentor.co.uk, which carry default Clerk branding. The
 * admin area is unaffected (middleware sends it to /admin/sign-in).
 *
 * NOTE (2026-09-03): do NOT set prefetchUI={false} here. It looks like the
 * supported bundle-diet knob, but clerk-js then throws "Clerk was not loaded
 * with Ui components" the moment any prebuilt component mounts (UserButton in
 * the app shells crashed /practice to the error boundary). It is only safe
 * for apps built purely on control components.
 */
export function ClerkAppProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      signInUrl="/for-candidates/sign-in"
      signUpUrl="/for-candidates/sign-up"
      afterSignOutUrl="/"
    >
      <ClerkAuthBridge>{children}</ClerkAuthBridge>
    </ClerkProvider>
  );
}
