"use client";

/**
 * /auth/accept
 *
 * Minimal token-acceptance page for admin-issued sign-in links.
 *
 * Uses Clerk's <SignIn> component with routing="hash" — when the
 * component mounts and detects __clerk_ticket in the URL it
 * processes the token automatically (no form shown) and redirects
 * to /auth/redirect, which handles forcePasswordReset and sends
 * the user to the correct portal.
 *
 * Using the Clerk component (vs a custom useSignIn hook) is the
 * reliable approach — Clerk's own code handles ticket consumption
 * timing correctly without the finalize() race condition.
 */

import { SignIn } from "@clerk/nextjs";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

export default function AuthAcceptPage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-[#0b0918] px-4 text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-fuchsia-600/[0.10] blur-[120px]" />
      </div>

      <div className="relative flex w-full max-w-sm flex-col items-center gap-8">
        <SiteLogo href="" size="md" showText />

        {/* Clerk processes the __clerk_ticket param automatically.
            The user sees this for a fraction of a second before redirect. */}
        <SignIn
          routing="hash"
          forceRedirectUrl="/auth/redirect"
          fallbackRedirectUrl="/auth/redirect"
          appearance={{
            elements: {
              rootBox: "w-full",
              card: "bg-white/[0.04] border border-white/[0.08] shadow-2xl backdrop-blur-2xl rounded-[1.75rem]",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-400",
              socialButtonsBlockButton:
                "border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-white",
              formButtonPrimary:
                "bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 hover:scale-[1.01] shadow-lg text-white font-black normal-case",
              formFieldInput:
                "bg-black/30 border-white/[0.1] text-white placeholder-gray-500",
              formFieldLabel: "text-gray-300",
              footerActionText: "text-gray-400",
              footerActionLink: "text-purple-300 hover:text-purple-200",
              dividerLine: "bg-white/[0.1]",
              dividerText: "text-gray-500",
            },
            variables: {
              colorPrimary: "#a855f7",
              colorText: "#ffffff",
              colorBackground: "transparent",
              colorInputBackground: "rgba(0,0,0,0.3)",
              colorInputText: "#ffffff",
            },
          }}
        />
      </div>
    </main>
  );
}
