import type { ReactNode } from "react";
import { ClerkAppProvider } from "@/app/components/ClerkAppProvider";

/** This surface uses the full Clerk runtime (prebuilt components or client
 *  hooks), so the provider mounts here — the root layout no longer carries
 *  it, keeping marketing pages free of clerk-js. */
export default function ClerkBoundaryLayout({ children }: { children: ReactNode }) {
  return <ClerkAppProvider>{children}</ClerkAppProvider>;
}
