"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth, SignInButton } from "@clerk/nextjs";
import Link from "next/link";
import {
  PRACTICE_SESSION_CONFIG_KEY,
  clampTotalQuestions,
  cleanQuestionMix,
  type PracticeSessionConfig,
} from "@/app/practice/session/utils";
import type { SpeakerPreference } from "@/app/practice/types";
import { DataTrustStrip } from "@/app/components/DataTrustStrip";

type AssessmentData = {
  assignment: {
    id: string;
    status: string;
    expiresAt: string;
    candidateEmailMasked: string;
  };
  company: {
    name: string;
    slug: string;
    brandColor: string;
    logoUrl: string | null;
  };
  template: {
    name: string;
    role: string;
    description: string | null;
    templateType: string;
    acStages: string[];
    questionMix: Record<string, number> | null;
    experienceLevel: string;
    interviewType: string;
    difficulty: string;
    focusArea: string;
    questionCount: number;
    customInstructions: string | null;
    competencyFramework: string | null;
    customQuestions: string[];
  };
};

const AC_STAGE_LABELS: Record<string, { title: string; time: string }> = {
  stage1: { title: "Case study", time: "~30 min" },
  stage2: { title: "Competency interview", time: "~20–40 min" },
  stage3: { title: "Presentation", time: "~20 min" },
};

type Step = "welcome" | "setup";

type PracticeMode = "typed" | "voice" | "voice-camera";

const DEFAULT_SPEAKER: SpeakerPreference = {
  voice: "female",
  pace: "natural",
};

export default function AssessmentLandingPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const [data, setData] = useState<AssessmentData | null>(null);
  const [error, setError] = useState<{ message: string; code: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const [step, setStep] = useState<Step>("welcome");
  const [practiceMode, setPracticeMode] = useState<PracticeMode>("voice");
  const [speakerPreference, setSpeakerPreference] =
    useState<SpeakerPreference>(DEFAULT_SPEAKER);
  const [acStarting, setAcStarting] = useState(false);
  const [acError, setAcError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/assessment/${token}`);
        const json = await res.json();
        if (!res.ok) {
          setError({ message: json.error, code: res.status });
          return;
        }
        setData(json);
      } catch {
        setError({ message: "Failed to load assessment.", code: 500 });
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token]);

  async function handleStart() {
    if (!data) return;
    const t = data.template;

    // ── Assessment centre path ──────────────────────────────────────────────
    if (t.templateType === "assessment-centre") {
      setAcStarting(true);
      setAcError("");
      try {
        const res = await fetch(`/api/assessment/${token}/start-ac`, {
          method: "POST",
        });
        const json = await res.json();
        if (!res.ok) {
          setAcError(json.error || "Failed to start assessment centre. Please try again.");
          return;
        }
        const { sessionId, initialStage } = json as { sessionId: string; initialStage: number };
        if (initialStage === 1) {
          router.push(`/assessment-centre/${sessionId}`);
        } else if (initialStage === 2) {
          router.push(`/assessment-centre/${sessionId}/stage-2`);
        } else {
          router.push(`/assessment-centre/${sessionId}/stage-3`);
        }
      } catch {
        setAcError("Something went wrong. Please try again.");
      } finally {
        setAcStarting(false);
      }
      return;
    }

    // ── Interview-only path ─────────────────────────────────────────────────
    const cleanedMix = cleanQuestionMix(t.questionMix);
    const config: PracticeSessionConfig = {
      role: t.role,
      experienceLevel: t.experienceLevel,
      interviewType: t.interviewType,
      difficulty: t.difficulty,
      focusArea: t.focusArea,
      speakerEnabled: practiceMode === "voice" || practiceMode === "voice-camera",
      cameraEnabled: practiceMode === "voice-camera",
      speakerPreference,
      totalQuestions: clampTotalQuestions(t.questionCount),
      assessmentMode: true,
      assignmentToken: token,
      // Template context drives question/feedback generation in assessment
      // mode. The candidate's personal saved profile is intentionally NOT
      // forwarded so every candidate is assessed against the same brief.
      templateContext: {
        customInstructions: t.customInstructions || undefined,
        competencyFramework: t.competencyFramework || undefined,
        templateName: t.name,
        companyName: data.company.name,
        companyBrandColor: data.company.brandColor || undefined,
        companyLogoUrl: data.company.logoUrl || undefined,
      },
      // Forward the recruiter's question mix so the session uses the
      // correct type sequence (incl. opener/custom slots if configured).
      questionMix: cleanedMix,
      // Verbatim custom questions bypass AI generation and are played in order.
      customQuestions:
        t.customQuestions && t.customQuestions.length > 0
          ? t.customQuestions
          : undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      window.sessionStorage.setItem(
        PRACTICE_SESSION_CONFIG_KEY,
        JSON.stringify(config)
      );
    } catch {
      // sessionStorage can fail in private browsing — fall through and let
      // /practice/session show the missing-config card if it does.
    }

    router.push("/practice/session");
  }

  if (loading || !isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0614]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-400 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0614] px-4 text-center text-white">
        <div className="mb-6 text-5xl">
          {error.code === 409 ? "✅" : error.code === 410 ? "⏰" : "🔗"}
        </div>
        <h1 className="mb-3 text-2xl font-bold">
          {error.code === 409
            ? "Assessment already completed"
            : error.code === 410
              ? "This invite has expired"
              : "Invalid invite link"}
        </h1>
        <p className="mb-8 text-gray-400">{error.message}</p>
        <Link
          href="/"
          className="rounded-full border border-white/15 bg-white/[0.06] px-6 py-3 text-sm font-bold text-white transition hover:bg-white/[0.10]"
        >
          Go to AI Career Mentor →
        </Link>
      </div>
    );
  }

  if (!data) return null;

  const { assignment, company, template } = data;
  const brand = company.brandColor || "#8c5cff";

  return (
    <div className="min-h-screen bg-[#0a0614] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_25%_15%,rgba(120,60,255,0.10),transparent),radial-gradient(ellipse_60%_50%_at_75%_85%,rgba(232,80,180,0.06),transparent),linear-gradient(180deg,#0a0614_0%,#100a1f_50%,#0c0816_100%)]" />
        <div className="absolute left-[-160px] top-[-80px] h-[520px] w-[520px] rounded-full bg-purple-500/[0.08] blur-[160px]" />
        <div className="absolute bottom-[-80px] right-[-160px] h-[520px] w-[520px] rounded-full bg-fuchsia-500/[0.08] blur-[160px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-4 py-16 sm:px-6">
        {/* Brand header */}
        <div className="mb-10 text-center">
          <div
            className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white shadow-xl"
            style={{ background: brand }}
          >
            {company.name.charAt(0).toUpperCase()}
          </div>
          <p className="text-sm font-bold tracking-wide text-gray-400">
            {company.name} invites you to
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {template.name}
          </h1>
          {template.description && step === "welcome" && (
            <p className="mt-3 text-base leading-7 text-gray-300">
              {template.description}
            </p>
          )}
        </div>

        {step === "welcome" && (
          <WelcomeStep
            template={template}
            company={company}
            assignment={assignment}
            isSignedIn={Boolean(isSignedIn)}
            brand={brand}
            acStarting={acStarting}
            acError={acError}
            onContinue={() => {
              // AC invites skip the mode-picker step and start directly
              if (template.templateType === "assessment-centre") {
                handleStart();
              } else {
                setStep("setup");
              }
            }}
          />
        )}

        {step === "setup" && (
          <SetupStep
            company={company}
            template={template}
            practiceMode={practiceMode}
            setPracticeMode={setPracticeMode}
            speakerPreference={speakerPreference}
            setSpeakerPreference={setSpeakerPreference}
            brand={brand}
            onBack={() => setStep("welcome")}
            onStart={handleStart}
          />
        )}

        <p className="mt-10 text-center text-xs text-gray-400">
          Powered by{" "}
          <Link href="/" className="text-gray-400 hover:text-gray-400">
            AI Career Mentor
          </Link>
        </p>
      </div>
    </div>
  );
}

// ─── Step 1: Welcome ──────────────────────────────────────────────────────────

function WelcomeStep({
  template,
  company,
  assignment,
  isSignedIn,
  brand,
  acStarting,
  acError,
  onContinue,
}: {
  template: AssessmentData["template"];
  company: AssessmentData["company"];
  assignment: AssessmentData["assignment"];
  isSignedIn: boolean;
  brand: string;
  acStarting: boolean;
  acError: string;
  onContinue: () => void;
}) {
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(assignment.expiresAt).getTime() - Date.now()) / 86400000)
  );

  const isAC = template.templateType === "assessment-centre";
  const stages = (template.acStages || []).filter((s) => s in AC_STAGE_LABELS);

  const infoItems = isAC
    ? [
        { label: "Role", value: template.role },
        { label: "Level", value: template.experienceLevel },
        { label: "Stages", value: `${stages.length} stage${stages.length !== 1 ? "s" : ""}` },
        ...(stages.includes("stage2")
          ? [
              { label: "Interview difficulty", value: template.difficulty },
              { label: "Questions", value: `${template.questionCount} per stage` },
            ]
          : []),
      ]
    : [
        { label: "Role", value: template.role },
        { label: "Level", value: template.experienceLevel },
        { label: "Type", value: template.interviewType },
        { label: "Questions", value: `${template.questionCount} questions` },
        { label: "Difficulty", value: template.difficulty },
        { label: "Focus", value: template.focusArea },
      ];

  const ctaLabel = isAC
    ? acStarting
      ? "Preparing your assessment…"
      : "Start assessment centre →"
    : "Continue to setup →";

  return (
    <>
      <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.05] p-7 shadow-2xl shadow-black/10 backdrop-blur-2xl">
        <h2 className="mb-5 text-base font-bold text-gray-200">
          Assessment details
        </h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {infoItems.map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                {label}
              </p>
              <p className="mt-1 text-sm font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* AC stage list */}
        {isAC && stages.length > 0 && (
          <div className="mt-6 space-y-2 border-t border-white/10 pt-5">
            <p className="mb-3 text-sm font-bold text-gray-300">Assessment stages</p>
            {stages.map((stage, i) => {
              const info = AC_STAGE_LABELS[stage];
              return (
                <div
                  key={stage}
                  className="flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.03] px-4 py-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-white/20 text-[11px] font-bold text-gray-400">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{info.title}</p>
                  </div>
                  <span className="shrink-0 text-xs text-gray-400">{info.time}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Interview-only what to expect */}
        {!isAC && (
          <div className="mt-6 border-t border-white/10 pt-5">
            <h3 className="mb-3 text-sm font-bold text-gray-300">What to expect</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li className="flex gap-2">
                <span className="text-purple-400">→</span>{" "}
                {template.questionCount} tailored questions for the {template.role} role
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400">→</span> Roughly{" "}
                {Math.max(10, template.questionCount * 4)}–
                {template.questionCount * 6} minutes of focused interview time
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400">→</span> You choose typed, voice or
                voice + camera in the next step
              </li>
              <li className="flex gap-2">
                <span className="text-purple-400">→</span> Your results are sent
                automatically to {company.name}
              </li>
            </ul>
          </div>
        )}

        {/* AC note */}
        {isAC && (
          <div className="mt-5 rounded-xl border border-blue-400/20 bg-blue-400/[0.07] px-4 py-3">
            <p className="text-sm text-blue-200">
              Your results from all stages are automatically sent to {company.name} when you complete the process.
            </p>
          </div>
        )}

        <div className="mt-5 flex items-center gap-2 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3">
          <span className="text-yellow-300">⏰</span>
          <p className="text-sm text-yellow-200">
            {daysLeft === 0
              ? "Expires today"
              : `${daysLeft} day${daysLeft === 1 ? "" : "s"} remaining to complete`}
          </p>
        </div>
      </div>

      {acError && (
        <p className="mb-4 rounded-xl border border-red-400/30 bg-red-400/10 px-4 py-3 text-sm text-red-300">
          {acError}
        </p>
      )}

      {/* CTA */}
      {isSignedIn ? (
        <div className="text-center">
          <button
            onClick={onContinue}
            disabled={acStarting}
            className="w-full rounded-full py-4 text-base font-bold text-white shadow-xl transition hover:scale-[1.02] disabled:opacity-60 sm:w-auto sm:px-12"
            style={{
              background: `linear-gradient(135deg, ${brand}, #6c4cff)`,
              boxShadow: `0 12px 32px ${brand}40`,
            }}
          >
            {acStarting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Preparing your assessment…
              </span>
            ) : (
              ctaLabel
            )}
          </button>
          {isAC && (
            <p className="mt-3 text-xs text-gray-400">
              This may take up to 30 seconds while we generate your case study.
            </p>
          )}
          <p className="mt-3 text-xs text-gray-400">
            Invite was sent to {assignment.candidateEmailMasked}. Make sure you are
            signed in to the correct account.
          </p>
        </div>
      ) : (
        <div className="text-center">
          <SignInButton mode="modal">
            <button
              className="w-full rounded-full py-4 text-base font-bold text-white shadow-xl transition hover:scale-[1.02] sm:w-auto sm:px-12"
              style={{
                background: `linear-gradient(135deg, ${brand}, #6c4cff)`,
                boxShadow: `0 12px 32px ${brand}40`,
              }}
            >
              Sign in to begin →
            </button>
          </SignInButton>
          <p className="mt-3 text-xs text-gray-400">
            Create a free account or sign in to start. Your results are saved
            securely.
          </p>
        </div>
      )}
    </>
  );
}

// ─── Step 2: Setup picker ─────────────────────────────────────────────────────

function SetupStep({
  company,
  template,
  practiceMode,
  setPracticeMode,
  speakerPreference,
  setSpeakerPreference,
  brand,
  onBack,
  onStart,
}: {
  company: AssessmentData["company"];
  template: AssessmentData["template"];
  practiceMode: PracticeMode;
  setPracticeMode: (mode: PracticeMode) => void;
  speakerPreference: SpeakerPreference;
  setSpeakerPreference: (pref: SpeakerPreference) => void;
  brand: string;
  onBack: () => void;
  onStart: () => void;
}) {
  const showVoicePrefs = practiceMode === "voice" || practiceMode === "voice-camera";

  const modeOptions = useMemo(
    () =>
      [
        {
          id: "typed" as const,
          title: "Typed answers",
          subtitle: "Read questions on screen, type your answers.",
          requirements: "No microphone or camera needed.",
        },
        {
          id: "voice" as const,
          title: "Voice interview",
          subtitle: "Hear questions spoken aloud, answer out loud.",
          requirements: "Microphone access required.",
        },
        {
          id: "voice-camera" as const,
          title: "Voice + camera",
          subtitle: "Most realistic: voice plus camera presence review.",
          requirements: "Microphone and camera access required.",
        },
      ],
    []
  );

  return (
    <>
      <div className="mb-8 rounded-[2rem] border border-white/10 bg-white/[0.05] p-7 shadow-2xl shadow-black/10 backdrop-blur-2xl">
        <p className="text-[11px] font-bold tracking-wide text-purple-300">
          Step 2 of 2 · How you want to take it
        </p>
        <h2 className="mt-2 text-2xl font-bold tracking-tight">
          Pick your interview format
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          The questions and difficulty are set by {company.name}. You only choose
          how you want to answer them.
        </p>

        {/* Mode picker */}
        <div className="mt-6 grid gap-3">
          {modeOptions.map((option) => {
            const selected = practiceMode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => setPracticeMode(option.id)}
                className={`rounded-2xl border px-4 py-4 text-left transition ${
                  selected
                    ? "border-purple-400/50 bg-purple-400/10 shadow-lg shadow-purple-950/30"
                    : "border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.05]"
                }`}
              >
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                      selected
                        ? "border-purple-300 bg-purple-300"
                        : "border-white/30"
                    }`}
                  >
                    {selected && (
                      <span className="h-2 w-2 rounded-full bg-[#0a0614]" />
                    )}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-white">{option.title}</p>
                    <p className="mt-1 text-sm leading-5 text-gray-400">
                      {option.subtitle}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {option.requirements}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Voice preferences (only when voice/voice-camera) */}
        {showVoicePrefs && (
          <div className="mt-6 rounded-2xl border border-white/10 bg-black/25 p-5">
            <p className="text-[11px] font-bold tracking-wide text-cyan-300">
              Interviewer voice preference
            </p>
            <p className="mt-1 text-xs leading-5 text-gray-400">
              These only affect how questions sound. Pick whatever feels most
              comfortable.
            </p>

            <div className="mt-4 space-y-4">
              <PrefRow
                label="Voice"
                options={[
                  { value: "female", label: "Female" },
                  { value: "male", label: "Male" },
                  { value: "neutral", label: "Neutral" },
                ]}
                value={speakerPreference.voice}
                onChange={(v) =>
                  setSpeakerPreference({
                    ...speakerPreference,
                    voice: v as SpeakerPreference["voice"],
                  })
                }
              />
              <PrefRow
                label="Pace"
                options={[
                  { value: "slow", label: "Slower" },
                  { value: "natural", label: "Natural" },
                  { value: "energetic", label: "Energetic" },
                ]}
                value={speakerPreference.pace}
                onChange={(v) =>
                  setSpeakerPreference({
                    ...speakerPreference,
                    pace: v as SpeakerPreference["pace"],
                  })
                }
              />
            </div>
          </div>
        )}

        {/* Reminder of locked template fields */}
        <div className="mt-6 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4">
          <p className="text-[11px] font-bold tracking-wide text-gray-400">
            Set by {company.name}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-gray-400 sm:grid-cols-3">
            <div>
              <span className="text-gray-400">Role:</span> {template.role}
            </div>
            <div>
              <span className="text-gray-400">Level:</span> {template.experienceLevel}
            </div>
            <div>
              <span className="text-gray-400">Type:</span> {template.interviewType}
            </div>
            <div>
              <span className="text-gray-400">Difficulty:</span> {template.difficulty}
            </div>
            <div>
              <span className="text-gray-400">Focus:</span> {template.focusArea}
            </div>
            <div>
              <span className="text-gray-400">Questions:</span>{" "}
              {template.questionCount}
            </div>
          </div>
        </div>
      </div>

      {/* CTAs */}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={onBack}
          className="rounded-full border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-bold text-gray-200 transition hover:bg-white/[0.08]"
        >
          ← Back
        </button>
        <button
          onClick={onStart}
          className="rounded-full px-8 py-4 text-base font-bold text-white shadow-xl transition hover:scale-[1.02]"
          style={{
            background: `linear-gradient(135deg, ${brand}, #6c4cff)`,
            boxShadow: `0 12px 32px ${brand}40`,
          }}
        >
          Start interview →
        </button>
      </div>

      <p className="mt-4 text-center text-xs text-gray-400">
        You&rsquo;ll be taken straight into the interview. Once finished, your
        results are sent to {company.name} automatically.
      </p>

      <div className="mt-4">
        <DataTrustStrip compact />
      </div>
    </>
  );
}

function PrefRow({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: Array<{ value: string; label: string }>;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-xs font-bold tracking-wide text-gray-400">
        {label}
      </p>
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                selected
                  ? "border-cyan-300/50 bg-cyan-300/10 text-cyan-100"
                  : "border-white/10 bg-white/[0.03] text-gray-400 hover:bg-white/[0.06] hover:text-white"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
