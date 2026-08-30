"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CAREER_STAGES,
  SECTORS,
  TARGET_ROLE_SUGGESTIONS,
  CHALLENGES,
  PROCESS_TYPES,
  ONBOARDING_STEPS,
  processTypeFor,
} from "@/app/lib/onboarding";
import { EquipmentCheck } from "./EquipmentCheck";
import { useSavedCV } from "@/app/career-docs/hooks/useSavedCV";

/**
 * Six steps: name+goal, tailoring, process, challenge, warm-up launch,
 * equipment check.
 *
 * The tailoring step (2) is a full step rather than a collapsed disclosure —
 * hidden behind "+ Add more detail" almost nobody opened it, and it is the
 * single biggest lever on question/feedback quality. Everything on it is
 * still skippable. The old "your plan" recap step was cut: it asked for a
 * click without asking a question.
 */

const CARD =
  "w-full rounded-[1.1rem] border px-4 py-3 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400/60";
const CARD_OFF =
  "border-white/[0.09] bg-white/[0.03] text-gray-200 hover:border-purple-300/40 hover:bg-white/[0.06]";
const CARD_ON =
  "border-purple-400/60 bg-purple-500/[0.14] text-white shadow-lg shadow-purple-950/30";

export type OnboardingResumeAnswers = {
  targetRole: string;
  careerStage: string;
  targetSector: string;
  biggestChallenge: string;
  processType: string;
};

export function OnboardingClient({
  firstName,
  resumeAnswers,
}: {
  firstName: string;
  /** Saved answers from an interrupted run — resume at the warm-up (step 5)
      instead of asking everything again. */
  resumeAnswers?: OnboardingResumeAnswers | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState(resumeAnswers ? 5 : 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Where the candidate chose to go at step 5. Held so the equipment check
  // (step 6) can run first and then complete the journey they picked.
  const [pendingDestination, setPendingDestination] = useState("/practice");
  // The candidate's name leads step 1 — the product greets people throughout,
  // and Clerk's sign-up form doesn't ask for a name, so this is where it is
  // captured. Prefilled when Clerk does know it (e.g. Google sign-up).
  const [name, setName] = useState(firstName);
  const [targetRole, setTargetRole] = useState(resumeAnswers?.targetRole ?? "");
  const [careerStage, setCareerStage] = useState<string>(resumeAnswers?.careerStage ?? "");
  const [targetSector, setTargetSector] = useState<string>(resumeAnswers?.targetSector ?? "");
  const [biggestChallenge, setBiggestChallenge] = useState<string>(resumeAnswers?.biggestChallenge ?? "");
  const [processType, setProcessType] = useState<string>(resumeAnswers?.processType ?? "");

  // Optional context, gathered on the tailoring step (2). Empty means
  // "not given": the API never blanks an existing profile value from here.
  const [currentRole, setCurrentRole] = useState("");
  const [roleSpec, setRoleSpec] = useState("");
  const [roleSpecFileName, setRoleSpecFileName] = useState("");
  const [jdUploading, setJdUploading] = useState(false);
  const savedCV = useSavedCV();
  const cvInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);

  /** Job descriptions arrive as PDF/DOCX far more often than as pasted text. */
  async function uploadJobDescription(file: File) {
    setJdUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/extract-document", { method: "POST", body: form });
      const data = (await res.json()) as { text?: string; error?: string };
      if (!res.ok || data.error) {
        setError(data.error ?? "Could not read that file.");
        return;
      }
      setRoleSpec((data.text ?? "").trim());
      setRoleSpecFileName(file.name);
    } catch {
      setError("Could not read that file.");
    } finally {
      setJdUploading(false);
    }
  }

  const canAdvance =
    (step === 1 &&
      name.trim().length > 0 &&
      targetRole.trim().length > 1 &&
      careerStage &&
      targetSector) ||
    step === 2 || // tailoring — everything on it is optional
    (step === 3 && processType) ||
    (step === 4 && biggestChallenge) ||
    step >= 5;

  async function save(): Promise<boolean> {
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: name,
          targetRole,
          careerStage,
          targetSector,
          biggestChallenge,
          processType,
          currentRole,
          cvText: savedCV.cvText,
          cvFileName: savedCV.cvFileName,
          roleSpec,
          roleSpecFileName,
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
    // Saved on the way out of the last question (step 4) so a candidate who
    // closes the tab at the warm-up is not asked everything again.
    if (step === 4) {
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
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6 sm:px-6">
      {/* Progress */}
      <div className="mb-5">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.07]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-purple-600 transition-all duration-500"
            style={{ width: `${(step / ONBOARDING_STEPS) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-right text-[12px] font-bold tracking-wide text-gray-400">
          Step {step} of {ONBOARDING_STEPS}
        </p>
      </div>

      <div className="flex-1">
        {step === 1 && (
          <section>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              What are you preparing for?
            </h1>
            <p className="mt-3 text-sm leading-7 text-gray-400">
              Every question you practise is written for it.
            </p>

            <label className="mt-5 block text-[12px] font-bold tracking-wide text-purple-300">
              Your first name
            </label>
            <input
              autoFocus={!firstName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What should we call you?"
              className="mt-2 w-full rounded-[1.25rem] border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-base text-white placeholder:text-gray-400 focus:border-purple-400/60 focus:outline-none"
            />

            <label className="mt-5 block text-[12px] font-bold tracking-wide text-purple-300">
              Target role
            </label>
            <input
              autoFocus={!!firstName}
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              placeholder="e.g. Operations Analyst, Graduate Software Engineer"
              className="mt-2 w-full rounded-[1.25rem] border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-base text-white placeholder:text-gray-400 focus:border-purple-400/60 focus:outline-none"
            />

            <select
              value=""
              onChange={(e) => {
                if (e.target.value) setTargetRole(e.target.value);
              }}
              className="mt-2 w-full rounded-[1.25rem] border border-white/[0.09] bg-background px-4 py-3 text-sm text-gray-300 focus:border-purple-400/60 focus:outline-none"
            >
              <option value="">Or pick a common role…</option>
              {TARGET_ROLE_SUGGESTIONS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.roles.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>

            <p className="mt-5 text-[12px] font-bold tracking-wide text-purple-300">
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

            <p className="mt-5 text-[12px] font-bold tracking-wide text-purple-300">
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

        {/* Tailoring — a full step, not a disclosure. Everything on it is
            optional; each piece measurably sharpens the questions and the
            feedback. */}
        {step === 2 && (
          <section>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {name.trim()
                ? `${name.trim()}, let's tailor your interview and experience.`
                : "Let's tailor your interview and experience."}
            </h1>
            <p className="mt-3 text-sm leading-7 text-gray-400">
              None of this is required. Each piece makes the questions and the feedback more
              specific to you.
            </p>

            <div className="mt-5 space-y-5 rounded-[1.1rem] border border-white/[0.08] bg-white/[0.02] p-4">

                <div>
                  <label className="block text-[12px] font-bold tracking-wide text-purple-300">
                    What you do now
                  </label>
                  <input
                    value={currentRole}
                    onChange={(e) => setCurrentRole(e.target.value)}
                    placeholder="e.g. Retail supervisor, final-year student"
                    className="mt-2 w-full rounded-[1.25rem] border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-base text-white placeholder:text-gray-400 focus:border-purple-400/60 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold tracking-wide text-purple-300">
                    Your CV
                  </label>
                  <input
                    ref={cvInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void savedCV.uploadCV(f);
                      e.target.value = "";
                    }}
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => cvInputRef.current?.click()}
                      disabled={savedCV.uploading}
                      className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[0.12] disabled:opacity-50"
                    >
                      {savedCV.uploading ? "Uploading…" : savedCV.hasSavedCV ? "Replace CV" : "Upload CV"}
                    </button>
                    {savedCV.hasSavedCV && (
                      <span className="text-xs text-emerald-300">
                        {savedCV.cvFileName || "CV added"}
                      </span>
                    )}
                  </div>
                  {savedCV.error && (
                    <p className="mt-2 text-xs text-red-400">{savedCV.error}</p>
                  )}
                </div>

                <div>
                  <label className="block text-[12px] font-bold tracking-wide text-purple-300">
                    The job description
                  </label>
                  <input
                    ref={jdInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) void uploadJobDescription(f);
                      e.target.value = "";
                    }}
                  />
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => jdInputRef.current?.click()}
                      disabled={jdUploading}
                      className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-white/[0.12] bg-white/[0.06] px-4 py-2 text-xs font-bold text-white transition hover:bg-white/[0.12] disabled:opacity-50"
                    >
                      {jdUploading ? "Reading…" : "Upload job description"}
                    </button>
                    {roleSpecFileName && (
                      <span className="text-xs text-emerald-300">{roleSpecFileName}</span>
                    )}
                  </div>
                  <textarea
                    value={roleSpec}
                    onChange={(e) => setRoleSpec(e.target.value)}
                    placeholder="Paste the job description, or upload it above…"
                    rows={4}
                    maxLength={8000}
                    className="mt-2 w-full rounded-[1.25rem] border border-white/[0.09] bg-white/[0.03] px-4 py-3 text-base text-white placeholder:text-gray-400 focus:border-purple-400/60 focus:outline-none resize-y text-sm"
                  />
                </div>
              </div>

            <button
              type="button"
              onClick={() => void next()}
              className="mt-4 text-sm font-bold text-gray-400 transition hover:text-white"
            >
              Skip — you can add these any time from your profile
            </button>
          </section>
        )}

        {step === 3 && (
          <section>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              What are you actually facing?
            </h1>
            <p className="mt-3 text-sm leading-7 text-gray-400">
              These are very different processes. Knowing which one changes what we put in front of
              you.
            </p>
            <div className="mt-5 space-y-2">
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

        {step === 4 && (
          <section>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              What is the hardest part for you?
            </h1>
            <p className="mt-3 text-sm leading-7 text-gray-400">
              Pick the one that stings most. Your sessions will lean on it.
            </p>
            <div className="mt-5 space-y-2">
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

        {step === 5 && (
          <section className="text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {name.trim()
                ? `${name.trim()}, start with a short warm-up?`
                : "Start with a short warm-up?"}
            </h1>
            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-gray-300">
              Three questions rather than five. It is scored the same way, so you get a real
              starting point to improve on instead of an empty chart.
            </p>
            {/* Both choices pass through the equipment check (step 6) first,
                so mic/camera problems surface before the first question, not
                during it. */}
            <div className="mt-6 flex flex-col items-center gap-3">
              <button
                onClick={() => {
                  setPendingDestination("/practice?warmup=1");
                  setStep(6);
                }}
                className="w-full max-w-sm rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-4 text-sm font-bold text-on-accent shadow-2xl shadow-purple-900/40 transition hover:scale-[1.02]"
              >
                Start the warm-up →
              </button>
              <button
                onClick={() => {
                  setPendingDestination(
                    processTypeFor(processType)?.destination ?? "/practice"
                  );
                  setStep(6);
                }}
                className="text-sm font-bold text-gray-400 transition hover:text-white"
              >
                {processTypeFor(processType)?.value === "assessment-centre"
                  ? "Skip — go straight to the assessment centre"
                  : "Skip — take me to full practice"}
              </button>
            </div>
          </section>
        )}

        {step === 6 && (
          <EquipmentCheck
            onContinue={async (mode) => {
              // The check IS the mode decision: passing it means the hardware
              // for spoken practice works, so the first session opens in that
              // mode instead of defaulting to typed and quietly showing the
              // weakest version of the product.
              await fetch("/api/candidate-profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ preferredPracticeMode: mode }),
              }).catch(() => {});
              // The whole flow is now behind us — stamp completion, THEN
              // leave. Stamping any earlier lets a mid-flow refresh skip the
              // remaining steps.
              await fetch("/api/onboarding", { method: "PATCH" }).catch(() => {});
              router.push(pendingDestination);
            }}
            onBack={() => setStep(5)}
          />
        )}
      </div>

      {error && (
        <p className="mt-6 rounded-[1rem] border border-red-400/25 bg-red-500/10 p-4 text-sm text-red-300">
          {error}
        </p>
      )}

      {step < 5 && (
        <div className="mt-6 flex items-center justify-between gap-4">
          <button
            onClick={() => (step === 1 ? skip() : setStep((s) => s - 1))}
            disabled={saving}
            className="text-sm font-bold text-gray-400 transition hover:text-gray-300 disabled:opacity-40"
          >
            {step === 1 ? "Skip for now" : "← Back"}
          </button>
          <button
            onClick={next}
            disabled={!canAdvance || saving}
            className="rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-8 py-3.5 text-sm font-bold text-on-accent shadow-lg shadow-purple-950/40 transition hover:scale-[1.02] disabled:opacity-35 disabled:hover:scale-100"
          >
            {saving ? "Saving…" : "Continue"}
          </button>
        </div>
      )}
    </div>
  );
}
