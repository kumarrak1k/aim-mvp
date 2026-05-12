"use client";

/**
 * /admin/sign-in
 *
 * Minimal sign-in page used exclusively by the /admin route.
 * After signing in, Clerk redirects back to /admin where the
 * superadmin check runs — non-superadmins are bounced to "/".
 *
 * Not linked anywhere on the public site.
 */

import { SignIn } from "@clerk/nextjs";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

export default function AdminSignInPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#080412] px-4 text-white">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-600/[0.10] blur-[120px]" />
      </div>

      <div className="relative flex w-full max-w-sm flex-col items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <SiteLogo href="/" size="md" showText />
          <span className="rounded-full border border-purple-300/20 bg-white/[0.04] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-purple-300">
            Admin access
          </span>
        </div>

        <SignIn
          routing="path"
          path="/admin/sign-in"
          forceRedirectUrl="/admin"
          fallbackRedirectUrl="/admin"
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
