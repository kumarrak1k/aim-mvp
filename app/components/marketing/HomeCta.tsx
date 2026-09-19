"use client";

import Link from "next/link";
import { useUser } from "@clerk/nextjs";

/**
 * The homepage calls to action, which have to know who is reading them.
 *
 * The page itself is static, so it was offering "Start free" and "3 days free,
 * no payment details required" to people who had already signed up and, in
 * some cases, already paid. That reads as though their account does not exist.
 *
 * Rendered signed-out by default and swapped after Clerk resolves: that keeps
 * the static HTML correct for crawlers and for the majority of visitors, and
 * means the buttons never disappear while the answer is being fetched.
 */
export function HomeCta({
  notePosition = "below",
  secondary: secondaryAction = "sign-in",
  align = "center",
}: {
  /** The trial note sits under the buttons in the hero, above them at the foot. */
  notePosition?: "above" | "below";
  /** The hero offers a way to read more; the foot offers a way back in. */
  secondary?: "how-it-works" | "sign-in";
  /** "start" lines the buttons up with left-aligned copy on wide screens. */
  align?: "center" | "start";
}) {
  const { isLoaded, isSignedIn } = useUser();
  const signedIn = isLoaded && isSignedIn;

  const primary =
    "w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-center text-base font-bold text-on-accent shadow-2xl shadow-purple-900/40 transition hover:scale-[1.02] sm:w-auto";
  const secondary =
    "w-full rounded-2xl border border-white/[0.1] bg-white/[0.04] px-8 py-4 text-center text-base font-bold text-white transition hover:bg-white/[0.08] sm:w-auto";

  const note = signedIn ? null : (
    <p
      className={
        notePosition === "above"
          ? "mx-auto mt-4 max-w-xl text-base leading-7 text-gray-400"
          : `mt-5 text-xs text-gray-400${align === "start" ? " lg:text-left" : ""}`
      }
    >
      3 days free. No payment details required.
    </p>
  );

  const buttons = (
    <div
      className={`mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row${
        align === "start" ? " lg:justify-start" : ""
      }`}
    >
      {signedIn ? (
        <>
          <Link href="/practice" className={primary}>
            Continue practising →
          </Link>
          <Link href="/progress" className={secondary}>
            My progress
          </Link>
        </>
      ) : (
        <>
          <Link href="/for-candidates/sign-up" className={primary}>
            Start free →
          </Link>
          {secondaryAction === "how-it-works" ? (
            <Link href="/interview-practice" className={secondary}>
              How it works
            </Link>
          ) : (
            <Link href="/for-candidates/sign-in" className={secondary}>
              Already have an account
            </Link>
          )}
        </>
      )}
    </div>
  );

  return (
    <>
      {notePosition === "above" && note}
      {buttons}
      {notePosition === "below" && note}
    </>
  );
}
