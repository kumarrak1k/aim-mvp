import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";
import { CandidatePricingPlans } from "@/app/components/marketing/CandidatePricingPlans";
import { getCandidatePlan } from "@/app/lib/candidatePlan";
import { detectCurrency } from "@/app/lib/pricingCurrency";

export const metadata: Metadata = {
  title: "Continue with Pro",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * The one place a signed-in candidate pays.
 *
 * There is one plan, so this is not a comparison page: it says where they
 * stand, shows the price for the billing period they pick, and takes them to
 * checkout. Every "pay" prompt in the product and in the trial emails comes
 * here, and a lapsed trial is sent here once per visit (see upgradePrompt).
 *
 * "Not now" always works. Saved interviews and reports are theirs whether or
 * not they subscribe, so this page must never be a wall.
 */

/** Only a same-site path, so ?next= cannot send anyone off the site. */
function safeNext(value: string | string[] | undefined): string {
  const next = Array.isArray(value) ? value[0] : value;
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/upgrade")) {
    return "/progress";
  }
  return next;
}

export default async function UpgradePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/for-candidates/sign-in");

  const plan = await getCandidatePlan(userId);
  // Already paying, or given access: nothing to buy here.
  if (plan.isPaid || plan.isComp) redirect("/practice");

  const params = await searchParams;
  const next = safeNext(params.next);
  const cancelled = params.payment === "cancelled";
  const currency = await detectCurrency();
  const trialRunning = plan.isTrial;

  return (
    <CandidateAppShell currentPath="/upgrade">
      <section className="mx-auto max-w-3xl px-4 pb-6 pt-2 text-center sm:px-6 sm:pt-4">
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {trialRunning ? "Keep Pro after your trial" : "Your free trial has ended"}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-gray-400">
          {trialRunning
            ? "Subscribe now and nothing changes when the trial ends: unlimited practice, voice and camera, the assessment centre and the CV Studio."
            : "Subscribe to Pro to keep practising. Everything you used in the trial is included, and your saved interviews and reports are still here."}
        </p>
        {cancelled && (
          <p className="mx-auto mt-4 max-w-xl rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-gray-300">
            Checkout was cancelled and nothing was charged. Pick a billing period to try again.
          </p>
        )}
      </section>

      <section className="mx-auto max-w-3xl px-4 pb-8 sm:px-6">
        <CandidatePricingPlans currency={currency} compact />
      </section>

      <p className="pb-16 text-center text-sm text-gray-400">
        <Link
          href={next}
          className="font-bold text-purple-200 underline underline-offset-4 transition hover:text-purple-100"
          data-testid="upgrade-not-now"
        >
          {trialRunning ? "Not now, back to practising" : "Not now, take me to my saved interviews"}
        </Link>
      </p>
    </CandidateAppShell>
  );
}
