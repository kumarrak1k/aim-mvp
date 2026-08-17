"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Legacy URL stub. The real completion page moved to
 * /for-candidates/auth-complete because this URL sits INSIDE Clerk's
 * <SignUp path="/for-candidates/sign-up"> territory: Clerk's virtual router
 * treated "complete" as one of its own steps, pushed the URL without a real
 * navigation and looped (the post-signup "flashing screens"). Kept only so
 * stale cached clients mid-flow still land somewhere sensible.
 */
export default function LegacySignUpCompleteRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/for-candidates/auth-complete");
  }, [router]);
  return null;
}
