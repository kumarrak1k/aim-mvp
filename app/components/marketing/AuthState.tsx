"use client";

/**
 * App-owned auth state for surfaces that must not load clerk-js.
 *
 * Marketing pages used to read Clerk's client session (useAuth), which forced
 * clerk.browser.js (~200KB of parse-and-execute) onto every marketing visit —
 * the main-thread cost behind the mobile blank-below-hero stall. Components
 * now read THIS context instead:
 *
 * - Under <ClerkAppProvider> (app + auth surfaces), <ClerkAuthBridge> feeds it
 *   live Clerk state, so behaviour there is unchanged.
 * - On clerkless dynamic marketing pages, CandidateShell provides the
 *   server-known value ("signed-out").
 * - On clerkless static pages nothing provides it, and the default "unknown"
 *   renders the optimistic signed-out view — the same thing those pages
 *   always showed before hydration.
 */

import { createContext, useContext, type ReactNode } from "react";
import { useAuth } from "@clerk/nextjs";

export type AuthState = {
  status: "unknown" | "signed-out" | "signed-in";
  userId: string | null;
};

const AuthStateContext = createContext<AuthState>({ status: "unknown", userId: null });

export function useAuthState(): AuthState {
  return useContext(AuthStateContext);
}

export function AuthStateProvider({
  value,
  children,
}: {
  value: AuthState;
  children: ReactNode;
}) {
  return <AuthStateContext.Provider value={value}>{children}</AuthStateContext.Provider>;
}

/** Rendered only inside ClerkProvider: mirrors live Clerk session state into
 *  the app-owned context so consumers never import Clerk hooks directly. */
export function ClerkAuthBridge({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const value: AuthState = !isLoaded
    ? { status: "unknown", userId: null }
    : isSignedIn
      ? { status: "signed-in", userId: userId ?? null }
      : { status: "signed-out", userId: null };
  return <AuthStateContext.Provider value={value}>{children}</AuthStateContext.Provider>;
}
