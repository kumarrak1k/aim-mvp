import Link from "next/link";
import { SiteLogo } from "@/app/components/brand/SiteLogo";
import { DataTrustStrip } from "@/app/components/DataTrustStrip";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.08] bg-black/20">
      {/* Data trust strip — visible on every page */}
      <div className="border-b border-white/[0.05] bg-white/[0.02] px-4 py-3">
        <DataTrustStrip />
      </div>
      <div className="mx-auto max-w-7xl xl:max-w-[clamp(80rem,95vw,105rem)] px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">

          {/* Brand */}
          <div>
            <SiteLogo href="/" size="sm" showText />
            <p className="mt-4 max-w-xs text-sm leading-6 text-gray-400">
              AI-powered interview coaching for candidates, hiring teams, and
              university careers services. Built in the UK.
            </p>
            <p className="mt-5 text-xs text-gray-400">
              © {new Date().getFullYear()}{" "}AI Career Mentor Ltd · England &amp; Wales · Company No. 17288119
            </p>
          </div>

          {/* For candidates */}
          <div>
            <p className="mb-4 text-[11px] font-bold tracking-wide text-gray-400">
              For candidates
            </p>
            <div className="space-y-3 text-sm text-gray-400">
              <Link href="/" className="block transition hover:text-white">Overview</Link>
              <Link href="/interview-practice" className="block transition hover:text-white">Interview practice</Link>
              <Link href="/mock-assessment-centre" className="block transition hover:text-white">Assessment centre</Link>
              <Link href="/pricing" className="block transition hover:text-white">Pricing</Link>
              <Link href="/for-candidates/sign-up" className="block transition hover:text-white">Start free</Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <p className="mb-4 text-[11px] font-bold tracking-wide text-gray-400">
              Free tools
            </p>
            <div className="space-y-3 text-sm text-gray-400">
              <Link href="/blog" className="block transition hover:text-white">Interview guides</Link>
              <Link href="/questions" className="block transition hover:text-white">Question library</Link>
              <Link href="/tools/star-scorer" className="block transition hover:text-white">Free STAR scorer</Link>
              {/*
                "For hiring teams" and "Universities" removed while those offers
                move to their own site. The pages still resolve for anyone sent
                a direct link, and the recruiter app under /company plus the
                emailed invite flows are untouched — existing customers are
                unaffected. Nothing here is deleted, only unadvertised.
              */}
            </div>
          </div>

          {/* Company */}
          <div>
            <p className="mb-4 text-[11px] font-bold tracking-wide text-gray-400">
              Company
            </p>
            <div className="space-y-3 text-sm text-gray-400">
              <Link href="/about" className="block transition hover:text-white">About</Link>
              <Link href="/contact" className="block transition hover:text-white">Contact</Link>
              <Link href="/press" className="block transition hover:text-white">Press</Link>
              <Link href="/security" className="block transition hover:text-white">Security</Link>
              <Link href="/privacy" className="block transition hover:text-white">Privacy</Link>
              <Link href="/terms" className="block transition hover:text-white">Terms</Link>
            </div>
          </div>

        </div>
      </div>
    </footer>
  );
}
