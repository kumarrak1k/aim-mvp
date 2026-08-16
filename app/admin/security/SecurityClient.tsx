"use client";

/**
 * /admin/security — client half.
 *
 * Hosts Clerk's profile component, whose Security section carries the
 * authenticator-app (TOTP) and backup-code enrolment. The middleware sends
 * any admin session WITHOUT a second factor here (?mfa=required), and admin
 * MFA is mandatory, so this page is both the enrolment path and the only
 * admin page such a session can reach.
 */

import { UserProfile } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

export function SecurityClient() {
  const params = useSearchParams();
  const mfaRequired = params.get("mfa") === "required";

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#080412] px-4 py-10 text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/[0.10] blur-[120px]" />
      </div>

      <div className="relative flex w-full max-w-3xl flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <SiteLogo href="/admin" size="md" showText />
          <span className="rounded-full border border-purple-300/20 bg-white/[0.04] px-3 py-1 text-[12px] font-bold tracking-wide text-purple-300">
            Admin security
          </span>
        </div>

        {mfaRequired && (
          <div className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
            <p className="text-sm font-bold text-amber-300">
              Two-step verification required
            </p>
            <p className="mt-1 text-xs leading-5 text-amber-200/80">
              Admin pages require an authenticator app. Under Security below,
              choose <span className="font-bold">Add two-step verification</span>,
              scan the QR code with your authenticator app, and save the backup
              codes somewhere safe. Then sign out and back in &mdash; the admin
              area unlocks once your session carries the second factor.
            </p>
          </div>
        )}

        <UserProfile
          routing="hash"
          appearance={{
            elements: {
              rootBox: "w-full",
              cardBox: "w-full",
              card: "bg-white/[0.04] border border-white/[0.08] shadow-2xl backdrop-blur-2xl",
              navbar: "bg-transparent",
              navbarButton: "text-gray-300",
              headerTitle: "text-white",
              headerSubtitle: "text-gray-400",
              profileSectionTitleText: "text-white",
              formButtonPrimary:
                "min-h-[44px] bg-gradient-to-r from-violet-600 to-purple-600 text-white font-bold normal-case",
              formFieldInput:
                "min-h-[44px] bg-black/30 border-white/[0.1] text-white placeholder-gray-400",
              formFieldLabel: "text-gray-300",
            },
            variables: {
              colorPrimary: "#a855f7",
              colorBackground: "transparent",
              colorForeground: "#ffffff",
              colorMutedForeground: "#9ca3af",
            },
          }}
        />

        <Link
          href="/admin"
          className="text-sm font-bold text-purple-300 hover:text-purple-200"
        >
          &larr; Back to admin
        </Link>
      </div>
    </main>
  );
}
