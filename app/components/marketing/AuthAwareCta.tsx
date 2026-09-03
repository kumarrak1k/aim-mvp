"use client";

/**
 * Session-aware wrappers for marketing-page CTAs.
 *
 * These read the app-owned auth context (AuthState), never Clerk's client
 * hooks — marketing pages ship zero clerk-js, and static pages stay
 * statically prerendered. Under ClerkAppProvider the context carries live
 * session state; on clerkless dynamic pages it carries the server-known
 * value; on static pages it stays "unknown".
 *
 * Rendering is optimistic-signed-out: while the state is unknown, children of
 * WhenSignedOut render (what crawlers and most visitors should see) and
 * WhenSignedIn renders nothing.
 */

import type { ReactNode } from "react";
import { useAuthState } from "@/app/components/marketing/AuthState";

export function WhenSignedOut({ children }: { children: ReactNode }) {
  const { status } = useAuthState();
  if (status === "signed-in") return null;
  return <>{children}</>;
}

export function WhenSignedIn({ children }: { children: ReactNode }) {
  const { status } = useAuthState();
  if (status !== "signed-in") return null;
  return <>{children}</>;
}
