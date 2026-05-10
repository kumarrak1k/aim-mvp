"use client";

import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
import { SiteLogo } from "@/app/components/brand/SiteLogo";

/**
 * Header for /practice/session — the live interview screen.
 *
 * Two visual modes:
 *
 * 1. Assessment mode (the candidate clicked through from a company invite
 *    email and `assessmentMode` is set in session config). The header is
 *    branded with the company's name + brand colour, with "Powered by AI
 *    Career Mentor" attribution. There's no nav, no marketing links, no
 *    sign-out — the candidate is in the middle of a hiring assessment and
 *    must feel like they're inside the company's own process.
 *
 * 2. Personal practice mode (a candidate running their own practice, no
 *    invite link). Minimal AI Career Mentor chrome — logo + "Exit
 *    practice" link back to /practice + UserButton. Still no marketing
 *    nav: this is an active interview screen.
 *
 * The legacy PracticeHeader (with Home / Platform / How it works /
 * Candidates / Pricing) was wrong for both modes and is now retired.
 */

type SessionHeaderProps = {
  assessmentMode: boolean;
  companyName?: string;
  companyBrandColor?: string;
  companyLogoUrl?: string;
  templateName?: string;
};

export function SessionHeader({
  assessmentMode,
  companyName,
  companyBrandColor,
  companyLogoUrl,
  templateName,
}: SessionHeaderProps) {
  if (assessmentMode) {
    return (
      <CompanyBrandedHeader
        companyName={companyName}
        companyBrandColor={companyBrandColor}
        companyLogoUrl={companyLogoUrl}
        templateName={templateName}
      />
    );
  }

  return <PersonalPracticeHeader />;
}

// ─── Company-branded header (assessment mode) ────────────────────────────────

function CompanyBrandedHeader({
  companyName,
  companyBrandColor,
  companyLogoUrl,
  templateName,
}: {
  companyName?: string;
  companyBrandColor?: string;
  companyLogoUrl?: string;
  templateName?: string;
}) {
  const brandColor =
    companyBrandColor && /^#[0-9a-fA-F]{6}$/.test(companyBrandColor)
      ? companyBrandColor
      : "#8c5cff";
  const safeCompany = companyName || "Hiring company";

  return (
    <header className="sticky top-0 z-50 bg-[#0d0520] shadow-[0_1px_0_0_rgba(255,255,255,0.07)]">
      {/* Brand colour stripe — visually anchors this as the company's process */}
      <div className="h-1.5" style={{ background: brandColor }} />

      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6 lg:px-8 lg:py-3">
        {/* Company identity (left) */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl text-base font-black text-white shadow-md"
            style={{ background: brandColor }}
          >
            {companyLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={companyLogoUrl}
                alt={safeCompany}
                className="h-full w-full object-cover"
              />
            ) : (
              safeCompany.charAt(0).toUpperCase()
            )}
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.20em] text-gray-400">
              Assessment from
            </p>
            <p className="truncate text-sm font-black tracking-[-0.02em] text-white sm:text-base">
              {safeCompany}
            </p>
            {templateName && (
              <p className="hidden truncate text-xs text-gray-500 sm:block">
                {templateName}
              </p>
            )}
          </div>
        </div>

        {/* Right: in-progress badge + powered-by */}
        <div className="flex shrink-0 items-center gap-3">
          <span className="hidden rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-[11px] font-black text-emerald-100 sm:inline-flex">
            <span className="relative mr-2 inline-flex h-2 w-2 self-center">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            In progress
          </span>

          <div className="hidden text-right text-[10px] leading-tight text-gray-500 sm:block">
            <p className="font-black uppercase tracking-[0.16em]">Powered by</p>
            <p className="text-gray-300">AI Career Mentor</p>
          </div>
        </div>
      </div>
    </header>
  );
}

// ─── Personal practice header (no assessment) ────────────────────────────────

function PersonalPracticeHeader() {
  return (
    <header className="sticky top-0 z-50 bg-[#0d0a1a] shadow-[0_1px_0_0_rgba(255,255,255,0.07)]">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:gap-6 lg:px-8 lg:py-3">
        {/* Logo */}
        <div className="shrink-0">
          <SiteLogo href="/practice" size="md" showText />
        </div>

        {/* Right actions */}
        <div className="ml-auto flex shrink-0 items-center gap-2">
          <Link href="/practice" className="hidden sm:block">
            <button className="rounded-full border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-xs font-bold text-gray-300 transition hover:bg-white/[0.08] hover:text-white">
              Exit to practice setup
            </button>
          </Link>

          <Show when="signed-in">
            <div className="shrink-0 px-1">
              <UserButton />
            </div>
          </Show>
        </div>
      </div>
    </header>
  );
}
