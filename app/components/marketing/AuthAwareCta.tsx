"use client";

/**
 * Session-aware wrappers for marketing-page CTAs.
 *
 * Clerk v7 removed the <SignedIn>/<SignedOut> control components, and its
 * replacement (<Show/>) is a server component that reads cookies, which would
 * opt every static marketing page into per-request rendering. These wrappers
 * read the CLIENT session instead, so pages stay statically prerendered.
 *
 * Rendering is optimistic-signed-out: until Clerk hydrates, children of
 * WhenSignedOut render (what crawlers and most visitors should see) and
 * WhenSignedIn renders nothing; signed-in visitors see the swap right after
 * hydration.
 */

import type { ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";

export function WhenSignedOut({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (isLoaded && isSignedIn) return null;
  return <>{children}</>;
}

export function WhenSignedIn({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn } = useAuth();
  if (!isLoaded || !isSignedIn) return null;
  return <>{children}</>;
}
