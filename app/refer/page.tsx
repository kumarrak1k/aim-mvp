"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SiteLogo } from "@/app/components/brand/SiteLogo";
import { siteConfig } from "@/app/config/site";

export default function ReferPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [code, setCode] = useState("");
  const [usedCount, setUsedCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.replace("/for-candidates/sign-in"); return; }

    fetch("/api/referral", { method: "POST" })
      .then((r) => r.json())
      .then((d) => { setCode(d.code ?? ""); setUsedCount(d.usedCount ?? 0); })
      .finally(() => setLoading(false));
  }, [isLoaded, isSignedIn, router]);

  const referralUrl = `${siteConfig.url}/for-candidates/sign-up?ref=${code}`;

  function copyLink() {
    navigator.clipboard.writeText(referralUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I've been using AI Career Mentor to practice interviews. AI feedback on your answers, voice, and camera presence. Try it free:`)}&url=${encodeURIComponent(referralUrl)}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`I've been using AI Career Mentor for interview prep. Try it free: ${referralUrl}`)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(referralUrl)}`;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0614] text-white">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_-10%,rgba(120,60,255,0.10),transparent)]" />
        <div className="absolute left-1/2 top-[-200px] h-[480px] w-[800px] -translate-x-1/2 rounded-full bg-purple-600/[0.14] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <div className="mb-10 flex items-center justify-between">
          <Link href="/practice"><SiteLogo href="" size="sm" showText /></Link>
          <Link href="/practice" className="text-sm text-gray-400 hover:text-gray-300">← Dashboard</Link>
        </div>

        <div className="mb-8 text-center">
          <p className="mb-3 text-[12px] font-bold tracking-wide text-purple-300/80">
            Refer a friend
          </p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Share AI Career Mentor
          </h1>
          <p className="mx-auto mt-4 max-w-md text-sm leading-6 text-gray-400">
            Share your personal link. Every person who signs up gets instant
            access to free AI interview coaching: voice feedback, camera
            presence scoring, and model answers.
          </p>
        </div>

        {/* Reward strip */}
        <div className="mb-6 grid grid-cols-3 gap-3 text-center">
          {[
            {
              svg: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><path d="M9 12l2 2 4-4" />
                </svg>
              ),
              label: "They get", detail: "Free AI coaching"
            },
            {
              svg: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" />
                </svg>
              ),
              label: "You get", detail: "Bragging rights"
            },
            {
              svg: (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
                </svg>
              ),
              label: "Together", detail: "Better interviews"
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-white/[0.07] bg-white/[0.03] px-3 py-4"
            >
              <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl border border-purple-400/20 bg-purple-400/[0.08] text-purple-300">
                {item.svg}
              </div>
              <p className="mt-2 text-[12px] font-bold tracking-wide text-gray-400">
                {item.label}
              </p>
              <p className="mt-0.5 text-xs font-bold text-gray-300">{item.detail}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="mb-6 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-6 py-5 text-center">
              <p className="text-4xl font-bold tracking-tight text-white">{usedCount}</p>
              <p className="mt-1 text-sm text-gray-400">
                {usedCount === 1 ? "person" : "people"} signed up via your link
              </p>
            </div>

            {/* Code display */}
            <div className="mb-6 rounded-[1.75rem] border border-purple-300/20 bg-purple-300/[0.05] p-6">
              <p className="mb-3 text-[12px] font-bold tracking-wide text-purple-300/70">
                Your referral code
              </p>
              <div className="flex items-center gap-3">
                <code className="flex-1 rounded-xl border border-white/[0.1] bg-black/30 px-4 py-3 font-mono text-lg font-bold tracking-[0.2em] text-white">
                  {code}
                </code>
                <button
                  onClick={copyLink}
                  className="rounded-xl border border-white/[0.1] bg-white/[0.06] px-4 py-3 text-sm font-bold text-white transition hover:bg-white/[0.1]"
                >
                  {copied ? "Copied!" : "Copy link"}
                </button>
              </div>
              <p className="mt-3 break-all text-xs text-gray-400">{referralUrl}</p>
            </div>

            {/* Share buttons */}
            <div className="grid grid-cols-3 gap-3">
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-4 text-xs font-bold text-gray-300 transition hover:bg-white/[0.07]"
              >
                <span className="text-xl">𝕏</span>
                Twitter / X
              </a>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-4 text-xs font-bold text-gray-300 transition hover:bg-white/[0.07]"
              >
                <span className="text-xl">💬</span>
                WhatsApp
              </a>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 rounded-2xl border border-white/[0.08] bg-white/[0.03] py-4 text-xs font-bold text-gray-300 transition hover:bg-white/[0.07]"
              >
                <span className="text-xl">in</span>
                LinkedIn
              </a>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
