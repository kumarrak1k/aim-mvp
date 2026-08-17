"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy URL stub — see app/for-candidates/sign-up/complete/page.tsx.
 * The real completion page moved to /for-business/auth-complete, outside
 * Clerk's <SignUp path="/for-business/sign-up"> virtual-router territory.
 */
export default function LegacyBusinessSignUpCompleteRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/for-business/auth-complete");
  }, [router]);
  return null;
}
