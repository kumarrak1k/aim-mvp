import Link from "next/link";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t border-white/[0.08] bg-black/20">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">

          {/* Brand */}
          <div>
            <SiteLogo href="/" size="sm" showText />
            <p className="mt-4 max-w-xs text-sm leading-6 text-gray-500">
              AI-powered interview coaching for candidates, hiring teams, and
              university careers services. Built in the UK.
            </p>
            <p className="mt-5 text-xs text-gray-600">
              © {new Date().getFullYear()}{" "}AI Career Mentor Ltd · England &amp; Wales
            </p>
          </div>

          {/* For candidates */}
          <div>
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
              For candidates
            </p>
            <div className="space-y-3 text-sm text-gray-400">
              <Link href="/for-candidates" className="block transition hover:text-white">Overview</Link>
              <Link href="/for-candidates/interview-practice" className="block transition hover:text-white">Interview practice</Link>
              <Link href="/for-candidates/assessment-centre" className="block transition hover:text-white">Assessment centre</Link>
              <Link href="/for-candidates/pricing" className="block transition hover:text-white">Pricing</Link>
              <Link href="/for-candidates/sign-up" className="block transition hover:text-white">Start free</Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
              Free resources
            </p>
            <div className="space-y-3 text-sm text-gray-400">
              <Link href="/blog" className="block transition hover:text-white">Interview guides</Link>
              <Link href="/questions" className="block transition hover:text-white">Question library</Link>
              <Link href="/tools/star-scorer" className="block transition hover:text-white">STAR scorer</Link>
              <Link href="/for-business" className="block transition hover:text-white">For hiring teams</Link>
              <Link href="/universities" className="block transition hover:text-white">Universities</Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-gray-600">
              Company
            </p>
            <div className="space-y-3 text-sm text-gray-400">
              <Link href="/about" className="block transition hover:text-white">About</Link>
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
