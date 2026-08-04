"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CAREER_STAGES,
  SECTORS,
  CHALLENGES,
  PROCESS_TYPES,
  ONBOARDING_STEPS,
  buildPlanIntro,
  buildPlanSteps,
  processTypeFor,
} from "@/app/lib/onboarding";

/**
 * Five steps: three ask, one gives back, one launches.
 *
 * The give-back at step 4 is the load-bearing part. Four questions followed by
 * an empty practice screen is what we do today, and it is why every profile in
 * the database is blank. The steps have to visibly buy something.
 */

const CARD =
  "w-full rounded-[1.25rem] border px-5 py-4 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60";
const CARD_OFF =
  "border-white/[0.09] bg-white/[0.03] text-gray-200 hover:border-purple-300/40 hover:bg-white/[0.06]";
const CARD_ON =
  "border-purple-400/60 bg-purple-500/[0.14] text-white shadow-lg shadow-purple-950/30";

export function OnboardingClient({ firstName }: { firstName: string }) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [targetRole, setTargetRole] = useState("");
  const [careerStage, setCareerStage] = useState<string>("");
  const [targetSector, setTargetSector] = useState<string>("");
  const [biggestChallenge, setBiggestChallenge] = useState<string>("");
  const [processType, setProcessType] = useState<string>("");

  const plan = useMemo(
    () =>
      buildPlanIntro({
        role: targetRole,
        sector: targetSector || "your sector",
        stage: careerStage,
        challenge: biggestChallenge || null,
      }),
    [targetRole, targetSector, careerStage, biggestChallenge]
  );
  const planSteps = useMemo(
    () => buildPlanSteps(biggestChallenge || null, processType || null),
    [biggestChallenge, processType]
  );

  const canAdvance =
    (step === 1 && targetRole.trim().length > 1 && careerStage && targetSector) ||
    (step === 2 && processType) ||
    (step === 3 && biggestChallenge) ||
    step >= 4;

  async function save(): Promise<boolean> {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole,
          careerStage,
          targetSector,
          biggestChallenge,
          processType,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Could not save. Please try again.");
        setSaving(false);
        return false;
      }
      return true;
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
      setSaving(false);
      return false;
    }
  }

  async function next() {
    // Saved on the way into step 4 so the plan reflects stored state, and so a
    // candidate who closes the tab there is not asked everything again.
    if (step === 3) {
      const ok = await save();
      setSaving(false);
      if (!ok) return;
    }
    setStep((s) => Math.min(ONBOARDING_STEPS, s + 1));
  }

  async function skip() {
    setSaving(true);
    await fetch("/api/onboarding", { method: "DELETE" }).catch(() => {});
    router.push("/practice");
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-10 sm:px-6">
      {/* Progress */}
      <div className="mb-8">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-600 transition-all duration-500"
            style={{ width: `${(step / ONBOARDING_STEPS) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-right text-[11px] font-bold tracking-wide text-gray-500">
          Step {step} of {ONBOARDING_STEPS}
        </p>
      </div>

      <div className="flex-1">
        {step === 1 && (
          <section>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              {firstName ? `Right ${firstName} — what are you preparing for?` : "What are you preparing for?"}
            </h1>
            <p className="mt-3 text-sm leading-7 text-gray-400">
              This is the one thing we need. Every question you practise is written for it.
            </p>

            <label className="mt-7 block text-[11px] font-bold tracking-wide text-purple-300/90">
              Target role
            </label>
            <input
              autoFocus
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Operations Analyst, Graduate Software Engineer"
              className="mt-2 w-full rounded-[1.25rem] border border-white/[0.09] bg-white/[0.03] px-5 py-4 text-base text-white placeholder:text-gray-600 focus:border-purple-400/60 focus:outline-none"
            />

            <p className="mt-7 text-[11px] font-bold tracking-wide text-purple-300/90">
              Where you are
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {CAREER_STAGES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setCareerStage(s.value)}
                  className={`${CARD} ${careerStage === s.value ? CARD_ON : CARD_OFF}`}
                >
                  <span className="block font-bold">{s.label}</span>
                  <span className="mt-0.5 block text-xs text-gray-400">{s.hint}</span>
                </button>
              ))}
            </div>

            <p className="mt-7 text-[11px] font-bold tracking-wide text-purple-300/90">
              Sector
            </p>
            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              {SECTORS.map((sec) => (
                <button
                  key={sec}
                  onClick={() => setTargetSector(sec)}
                  className={`${CARD} ${targetSector === sec ? CARD_ON : CARD_OFF} !py-3 text-sm font-bold`}
                >
                  {sec}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 2 && (
          <section>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              What are you actually facing?
            </h1>
            <p className="mt-3 text-sm leading-7 text-gray-400">
              These are very different processes. Knowing which one changes what we put in front of
              you.
            </p>
            <div className="mt-7 space-y-2">
              {PROCESS_TYPES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setProcessType(p.value)}
                  className={`${CARD} ${processType === p.value ? CARD_ON : CARD_OFF}`}
                >
                  <span className="block font-bold">{p.label}</span>
                  <span className="mt-0.5 block text-xs text-gray-400">{p.hint}</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              What is the hardest part for you?
            </h1>
            <p className="mt-3 text-sm leading-7 text-gray-400">
              Pick the one that stings most. Your sessions will lean on it.
            </p>
            <div className="mt-7 space-y-2">
              {CHALLENGES.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setBiggestChallenge(c.value)}
                  className={`${CARD} ${biggestChallenge === c.value ? CARD_ON : CARD_OFF} font-bold`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </section>
        )}

        {step === 4 && (
          <section>
            <p className="text-[11px] font-bold tracking-wide text-emerald-300">
              Your plan
            </p>
            <h1 className="mt-3 text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl">
              {plan.headline}
            </h1>
            <p className="mt-4 text-base leading-7 text-gray-300">{plan.body}</p>

            <div className="mt-8 space-y-3">
              {planSteps.map((s, i) => (
                <div
                  key={s.title}
                  className="flex gap-4 rounded-[1.25rem] border border-white/[0.08] bg-white/[0.03] p-5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-500 text-sm font-bold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-bold text-white">{s.title}</p>
                    <p className="mt-1 text-sm leading-6 text-gray-400">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {step === 5 && (
          <section className="text-center">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Start with a short warm-up?
            </h1>
            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-gray-300">
              Three questions rather than five. It is scored the same way, so you get a real
              starting point to improve on instead of an empty chart.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3">
              <button
                onClick={() => router.push("/practice?warmup=1")}
                className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-sm font-bold text-white shadow-2xl shadow-purple-900/40 transition hover:scale-[1.02]"
              >
                Start the warm-up →
              </button>
              <button
                onClick={() =>
                  router.push(processTypeFor(processType)?.destination ?? "/practice")
                }
                className="text-sm font-bold text-gray-400 transition hover:text-white"
              >
                {processTypeFor(processType)?.value === "assessment-centre"
                  ? "Skip — go straight to the assessment centre"
                  : "Skip — take me to full practice"}
              </button>
            </div>
          </section>
        )}
      </div>

      {error && (
        <p className="mt-6 rounded-[1rem] border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      {step < 5 && (
        <div className="mt-10 flex items-center justify-between gap-4">
          <button
            onClick={() => (step === 1 ? skip() : setStep((s) => s - 1))}
            disabled={saving}
            className="text-sm font-bold text-gray-500 transition hover:text-gray-300 disabled:opacity-40"
          >
            {step === 1 ? "Skip for now" : "← Back"}
          </button>
          <button
            onClick={next}
            disabled={!canAdvance || saving}
            className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-purple-950/40 transition hover:scale-[1.02] disabled:opacity-35 disabled:hover:scale-100"
          >
            {saving ? "Saving…" : step === 4 ? "Looks right" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
