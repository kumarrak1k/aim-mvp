"use client";

import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CandidateProfile,
  PracticeMode,
  SpeakerPreference,
} from "../types";
import {
  difficultyLevels,
  experienceLevels,
  focusAreas,
  interviewTypes,
} from "../lib/interviewOptions";
import { hasCandidateProfileContext } from "../lib/profileHelpers";
import { CheckItem, GlassCard, SelectField } from "./PracticeUi";
import { AudioDeviceSelectors } from "./AudioDeviceSelectors";
import { DataTrustStrip } from "@/app/components/DataTrustStrip";
import {
  MAX_TOTAL_QUESTIONS,
  MAX_CUSTOM_QUESTION_LENGTH,
  MIN_TOTAL_QUESTIONS,
  QUESTION_TYPE_ORDER,
  QUESTION_TYPE_LABELS,
  mixTotal,
  type QuestionMix,
} from "../session/utils";

type PracticeStartScreenProps = {
  isLoaded: boolean;
  isSignedIn: boolean | undefined;
  role: string;
  onRoleChange: (value: string) => void;
  savedCandidateProfile: CandidateProfile | null;
  profileContextLoaded: boolean;
  roleAutofilledFromProfile: boolean;
  useSavedProfileForRole: () => void;
  manualDeviceMode: boolean;
  experienceLevel: string;
  setExperienceLevel: (value: string) => void;
  interviewType: string;
  setInterviewType: (value: string) => void;
  difficulty: string;
  setDifficulty: (value: string) => void;
  focusArea: string;
  setFocusArea: (value: string) => void;
  speakerEnabled: boolean;
  cameraEnabled: boolean;
  speakerPreference: SpeakerPreference;
  setSpeakerPreference: (value: SpeakerPreference) => void;
  setTextOnlyMode: () => void;
  setSpeakerMode: () => void;
  toggleCamera: () => void;
  startInterview: () => void;
  questionLoading: boolean;
  /** True once the /api/practice-sessions usage response has resolved. */
  usageLoaded: boolean;
  /** When true the user is on the free plan and is restricted to typed mode. */
  isFreePlan?: boolean;
  /** When true the user is on the Advanced plan — unlocks custom question count & mix. */
  isAdvancedPlan?: boolean;
  totalQuestions: number;
  setTotalQuestions: (v: number) => void;
  useHybridMix: boolean;
  setUseHybridMix: (v: boolean) => void;
  questionMix: QuestionMix;
  setQuestionMix: (v: QuestionMix) => void;
  /** Verbatim text for each "custom" mix slot (index-matched). */
  customQuestions: string[];
  setCustomQuestions: (v: string[]) => void;
  startDisabled?: boolean;
  startDisabledMessage?: string;
};

const practiceModeLabels: Record<PracticeMode, string> = {
  typed: "Typed answers only",
  voice: "Voice interview",
  "voice-camera": "Voice + camera interview",
};

const speakerVoiceOptions: Array<{
  value: SpeakerPreference["voice"];
  label: string;
  description: string;
}> = [
  {
    value: "female",
    label: "Female",
    description: "Warm, calm and premium.",
  },
  {
    value: "male",
    label: "Male",
    description: "Clear, steady and professional.",
  },
];

const speakerPaceOptions: Array<{
  value: SpeakerPreference["pace"];
  label: string;
}> = [
  { value: "slow", label: "Slower" },
  { value: "natural", label: "Natural" },
  { value: "energetic", label: "More energetic" },
];

const formatPreferenceWord = (value: string) => {
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export function PracticeStartScreen({
  isLoaded,
  isSignedIn,
  role,
  onRoleChange,
  savedCandidateProfile,
  profileContextLoaded,
  roleAutofilledFromProfile,
  useSavedProfileForRole,
  manualDeviceMode,
  experienceLevel,
  setExperienceLevel,
  interviewType,
  setInterviewType,
  difficulty,
  setDifficulty,
  focusArea,
  setFocusArea,
  speakerEnabled,
  cameraEnabled,
  speakerPreference,
  setSpeakerPreference,
  setTextOnlyMode,
  setSpeakerMode,
  toggleCamera,
  startInterview,
  questionLoading,
  usageLoaded,
  isFreePlan = false,
  isAdvancedPlan = false,
  totalQuestions,
  setTotalQuestions,
  useHybridMix,
  setUseHybridMix,
  questionMix,
  setQuestionMix,
  customQuestions,
  setCustomQuestions,
  startDisabled = false,
  startDisabledMessage = "",
}: PracticeStartScreenProps) {
  const [savingPreference, setSavingPreference] = useState(false);
  // Optional tuning starts folded: three decisions, then Start.
  const [showCustomise, setShowCustomise] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState("");

  // Hybrid mix helpers
  const currentMixTotal = mixTotal(questionMix);
  const mixMatchesTotal = currentMixTotal === totalQuestions;

  const adjustMix = useCallback(
    (key: keyof QuestionMix, delta: number) => {
      const newVal = Math.max(0, (questionMix[key] ?? 0) + delta);
      setQuestionMix({ ...questionMix, [key]: newVal });
      // Keep the customQuestions text array in sync with the custom slot count.
      if (key === "custom") {
        if (delta > 0) {
          setCustomQuestions([...customQuestions, ""]);
        } else if (delta < 0 && customQuestions.length > 0) {
          setCustomQuestions(customQuestions.slice(0, -1));
        }
      }
    },
    [questionMix, setQuestionMix, customQuestions, setCustomQuestions]
  );

  // When total questions changes (Advanced stepper), sync the default mix
  // so competency == totalQuestions when no hybrid is active.
  const handleTotalQuestionsChange = useCallback(
    (newTotal: number) => {
      setTotalQuestions(newTotal);
      if (!useHybridMix) {
        // Keep competency aligned with the new total
        setQuestionMix({ opener: 0, competency: newTotal, technical: 0, leadership: 0, motivation: 0, situational: 0, commercial: 0, custom: 0 });
      }
    },
    [setTotalQuestions, useHybridMix, questionMix, setQuestionMix]
  );

  const handleHybridToggle = useCallback(
    (on: boolean) => {
      setUseHybridMix(on);
      if (!on) {
        // Reset mix to single-type (all competency) and clear custom texts.
        setQuestionMix({ opener: 0, competency: totalQuestions, technical: 0, leadership: 0, motivation: 0, situational: 0, commercial: 0, custom: 0 });
        setCustomQuestions([]);
      } else {
        // Seed with a sensible starting split
        const each = Math.floor(totalQuestions / 2);
        const rem = totalQuestions - each * 2;
        setQuestionMix({ opener: 0, competency: each, technical: each + rem, leadership: 0, motivation: 0, situational: 0, commercial: 0, custom: 0 });
      }
    },
    [setUseHybridMix, setQuestionMix, totalQuestions]
  );
  const appliedSavedPreferencesRef = useRef(false);

  const selectedPracticeMode = useMemo<PracticeMode>(() => {
    if (speakerEnabled && cameraEnabled) return "voice-camera";
    if (speakerEnabled) return "voice";
    return "typed";
  }, [cameraEnabled, speakerEnabled]);

  const selectPracticeMode = useCallback(
    (mode: PracticeMode) => {
      setPreferenceMessage("");

      // Free plan is keyboard-only — block voice and camera modes.
      if (isFreePlan && mode !== "typed") {
        setPreferenceMessage(
          "Voice and camera modes are available on Plus and Professional plans."
        );
        return;
      }

      if (mode === "typed") {
        if (speakerEnabled) setTextOnlyMode();
        if (cameraEnabled) toggleCamera();
        return;
      }

      if (mode === "voice") {
        if (!speakerEnabled) setSpeakerMode();
        if (cameraEnabled) toggleCamera();
        return;
      }

      if (mode === "voice-camera") {
        if (!speakerEnabled) setSpeakerMode();
        if (!cameraEnabled) toggleCamera();
        return;
      }

      // Unknown mode — no-op
      return;
    },
    [
      isFreePlan,
      cameraEnabled,
      setSpeakerMode,
      setTextOnlyMode,
      speakerEnabled,
      toggleCamera,
    ]
  );

  useEffect(() => {
    // Wait until BOTH the candidate profile AND the usage/plan info have
    // loaded. This prevents the race where profile loads first (isFreePlan
    // still defaults to true) and the appliedRef is set before we know the
    // real plan — which would permanently skip voice preference for paid users
    // or apply it too early for free users.
    if (
      appliedSavedPreferencesRef.current ||
      !isSignedIn ||
      !profileContextLoaded ||
      !savedCandidateProfile ||
      !usageLoaded
    ) {
      return;
    }

    appliedSavedPreferencesRef.current = true;

    // Speaker preference (voice/accent/pace) is always safe to restore.
    if (savedCandidateProfile.speakerPreference) {
      setSpeakerPreference(savedCandidateProfile.speakerPreference);
    }

    // Practice mode (typed / voice / voice-camera) — only restore for paid
    // users; free users are keyboard-only regardless of saved preference.
    if (savedCandidateProfile.preferredPracticeMode && !isFreePlan) {
      selectPracticeMode(savedCandidateProfile.preferredPracticeMode);
    }
  }, [
    isFreePlan,
    isSignedIn,
    profileContextLoaded,
    savedCandidateProfile,
    selectPracticeMode,
    setSpeakerPreference,
    usageLoaded,
  ]);

  const updateSpeakerPreference = useCallback(
    (partial: Partial<SpeakerPreference>) => {
      setPreferenceMessage("");
      setSpeakerPreference({
        ...speakerPreference,
        ...partial,
      });
    },
    [setSpeakerPreference, speakerPreference]
  );

  const savePracticePreference = useCallback(async () => {
    if (!isSignedIn) {
      setPreferenceMessage(
        "Sign in to save this as your default interview setup."
      );
      return;
    }

    try {
      setSavingPreference(true);
      setPreferenceMessage("");

      const response = await fetch("/api/candidate-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cvText: savedCandidateProfile?.cvText || "",
          roleSpec: savedCandidateProfile?.roleSpec || "",
          interviewGoals: savedCandidateProfile?.interviewGoals || "",
          cvFileName: savedCandidateProfile?.cvFileName || "",
          roleSpecFileName: savedCandidateProfile?.roleSpecFileName || "",
          preferredPracticeMode: selectedPracticeMode,
          speakerPreference,
          defaultExperienceLevel: experienceLevel,
          defaultInterviewType: interviewType,
          defaultDifficulty: difficulty,
          defaultFocusArea: focusArea,
          ...(isAdvancedPlan
            ? {
                defaultTotalQuestions: totalQuestions,
                defaultUseHybridMix: useHybridMix,
                defaultQuestionMix: useHybridMix ? questionMix : null,
              }
            : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setPreferenceMessage(
          data.error || "Could not save your default interview setup."
        );
        return;
      }

      setPreferenceMessage(
        "Your full interview setup has been saved as default."
      );
    } catch {
      setPreferenceMessage("Something went wrong while saving your setup.");
    } finally {
      setSavingPreference(false);
    }
  }, [
    difficulty,
    experienceLevel,
    focusArea,
    interviewType,
    isSignedIn,
    isAdvancedPlan,
    questionMix,
    savedCandidateProfile,
    selectedPracticeMode,
    speakerPreference,
    totalQuestions,
    useHybridMix,
  ]);

  // Block start if Advanced hybrid mix doesn't add up to the chosen total
  const hybridMixInvalid = isAdvancedPlan && useHybridMix && !mixMatchesTotal;
  // Block start if any custom question slot has no text entered
  const customQuestionsInvalid =
    isAdvancedPlan &&
    useHybridMix &&
    (questionMix.custom ?? 0) > 0 &&
    customQuestions.some((q) => !q.trim());

  const interviewStartDisabled =
    !role.trim() || questionLoading || startDisabled || hybridMixInvalid || customQuestionsInvalid;

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_0.9fr]">
      <GlassCard>
        <div className="mb-6">
          <p className="mb-2 text-sm font-bold tracking-wide text-purple-300">
            Start interview
          </p>
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
            Build a tailored mock interview.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Set your role, experience level and interview focus so the AI coach
            can generate sharper questions and judge your answers against the
            right bar.
          </p>
        </div>

        <label className="mb-2 block text-sm font-bold text-gray-200">
          Target role or profile
        </label>

        <input
          className="mb-3 w-full rounded-2xl border border-white/10 bg-black/35 p-4 text-white placeholder-gray-400 outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10"
          placeholder={
            isSignedIn && hasCandidateProfileContext(savedCandidateProfile)
              ? "Using your saved profile context"
              : "Example: Graduate looking for a software engineering placement"
          }
          value={role}
          onChange={(event) => onRoleChange(event.target.value)}
        />

        <div className="mb-5 rounded-2xl border border-white/10 bg-black/25 p-4">
          {!isSignedIn && (
            <p className="text-sm leading-6 text-gray-400">
              Sign in and save your profile to auto-fill this field next time.
            </p>
          )}

          {isSignedIn && !profileContextLoaded && (
            <p className="text-sm leading-6 text-gray-400">
              Checking for saved profile...
            </p>
          )}

          {isSignedIn &&
            profileContextLoaded &&
            hasCandidateProfileContext(savedCandidateProfile) && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-emerald-200">
                    Saved profile detected
                  </p>
                  <p className="mt-1 text-sm leading-6 text-gray-400">
                    {roleAutofilledFromProfile
                      ? "This interview will use your saved CV, role spec and goals."
                      : "You can use your saved CV, role spec and goals, or type a different role manually."}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={useSavedProfileForRole}
                    className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-bold text-emerald-100 transition hover:bg-emerald-300/15"
                  >
                    Use saved profile
                  </button>

                  <Link
                    href="/profile"
                    className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-bold text-gray-200 transition hover:bg-white/[0.1]"
                  >
                    Edit profile
                  </Link>
                </div>
              </div>
            )}

          {isSignedIn &&
            profileContextLoaded &&
            !hasCandidateProfileContext(savedCandidateProfile) && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm leading-6 text-gray-400">
                  No saved profile yet. Type a target role here, or create a
                  profile to personalise future interviews.
                </p>

                <Link
                  href="/profile"
                  className="rounded-full border border-purple-300/20 bg-purple-300/10 px-4 py-2 text-xs font-bold text-purple-100 transition hover:bg-purple-300/15"
                >
                  Create profile
                </Link>
              </div>
            )}
        </div>

        {manualDeviceMode && (
          <div className="mb-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4">
            <p className="text-sm font-bold text-cyan-200">
              Phone/tablet mode enabled
            </p>
            <p className="mt-1 text-sm leading-6 text-gray-300">
              The interview page will show a large Guided Answer button. It
              plays AI-generated question audio and then starts your microphone
              recording.
            </p>
          </div>
        )}

        {startDisabled && startDisabledMessage && (
          <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4">
            <p className="text-sm font-bold text-amber-100">
              Daily practice limit reached
            </p>
            <p className="mt-1 text-sm leading-6 text-gray-300">
              {startDisabledMessage}
            </p>
          </div>
        )}

        <div className="mb-5 rounded-[1.7rem] border border-white/10 bg-black/25 p-5">
          <div className="mb-5">
            <p className="text-sm font-bold tracking-wide text-cyan-300">
              Practice mode
            </p>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-white">
              Choose one interview format.
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              Select one mode for this session. You can save it as your default
              in your Candidate Profile and still override it here anytime.
            </p>
          </div>

          <div className="grid gap-3 lg:grid-cols-3">
            <ModeCard
              active={selectedPracticeMode === "typed"}
              title="Typed answers only"
              badge="Keyboard"
              description="Read each question on screen and type your answer. Best when you want to focus only on answer structure."
              onClick={() => selectPracticeMode("typed")}
            />

            <ModeCard
              active={selectedPracticeMode === "voice"}
              title="Voice interview"
              badge="Audio + transcript"
              description="Hear the question read aloud, then answer by speaking. Your answer is transcribed for AI feedback."
              onClick={() => selectPracticeMode("voice")}
              locked={isFreePlan}
            />

            <ModeCard
              active={selectedPracticeMode === "voice-camera"}
              title="Voice + camera interview"
              badge="Full practice"
              description="Practise like a remote interview: question audio, spoken answer, transcript and camera presence analysis."
              onClick={() => selectPracticeMode("voice-camera")}
              locked={isFreePlan}
            />
          </div>

          {/* Upgrade nudge shown when a free user taps a locked mode */}
          {isFreePlan && (
            <div className="mt-4 flex flex-col gap-2 rounded-2xl border border-purple-300/20 bg-purple-300/[0.07] p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm leading-6 text-gray-300">
                <span className="font-bold text-purple-200">Voice &amp; camera modes</span> are
                available on Plus and Professional plans.
              </p>
              <Link
                href="/pricing"
                className="shrink-0 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-950/35 transition hover:scale-[1.03]"
              >
                Upgrade →
              </Link>
            </div>
          )}
        </div>

        {/* Everything below is optional tuning. A first-timer sees three
            decisions - role, mode, start - and this one disclosure opens the
            full control set for power users. */}
        <button
          type="button"
          onClick={() => setShowCustomise((v) => !v)}
          aria-expanded={showCustomise}
          className="mb-5 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-left transition hover:bg-white/[0.07]"
        >
          <span>
            <span className="block text-sm font-bold text-white">Customise session</span>
            <span className="mt-0.5 block text-xs text-gray-400">
              Experience level, interview type, difficulty, focus{isAdvancedPlan ? ", question count & mix" : ""}, voice and devices
            </span>
          </span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden className={`shrink-0 text-gray-400 transition ${showCustomise ? "rotate-180" : ""}`}>
            <path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>

        {showCustomise && (
          <>
        <div className="mb-5 grid gap-4 md:grid-cols-2">
          <SelectField
            label="Experience level"
            value={experienceLevel}
            onChange={setExperienceLevel}
            options={experienceLevels}
          />

          <SelectField
            label="Interview type"
            value={interviewType}
            onChange={setInterviewType}
            options={interviewTypes}
            defaultOption="Competency / behavioural"
          />

          <SelectField
            label="Difficulty"
            value={difficulty}
            onChange={setDifficulty}
            options={difficultyLevels}
          />

          <SelectField
            label="Main focus"
            value={focusArea}
            onChange={setFocusArea}
            options={focusAreas}
          />
        </div>

        {/* Advanced plan — question count & hybrid mix */}
        {isAdvancedPlan && (
          <div className="mb-5 rounded-[1.7rem] border border-purple-400/20 bg-purple-400/[0.05] p-5">
            <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold tracking-wide text-purple-300">
                  Question setup · Advanced
                </p>
                <h3 className="mt-2 text-xl font-bold tracking-tight text-white">
                  Customise your question session.
                </h3>
                <p className="mt-1 text-sm leading-6 text-gray-400">
                  Choose how many questions (3–{MAX_TOTAL_QUESTIONS}) and optionally split them by
                  type, e.g. 3 competency, 3 technical, 2 leadership, 2 motivation.
                </p>
              </div>
            </div>

            {/* Question count stepper */}
            <div className="mb-5">
              <p className="mb-3 text-sm font-bold text-white">Number of questions</p>
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  disabled={totalQuestions <= MIN_TOTAL_QUESTIONS}
                  onClick={() => handleTotalQuestionsChange(totalQuestions - 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-lg font-bold text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  −
                </button>
                <span className="min-w-[3rem] text-center text-3xl font-bold tracking-tight text-white">
                  {totalQuestions}
                </span>
                <button
                  type="button"
                  disabled={totalQuestions >= MAX_TOTAL_QUESTIONS}
                  onClick={() => handleTotalQuestionsChange(totalQuestions + 1)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-lg font-bold text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-30"
                >
                  +
                </button>
                <span className="text-sm text-gray-400">
                  questions in this session
                </span>
              </div>
            </div>

            {/* Hybrid toggle */}
            <div className="mb-4 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleHybridToggle(!useHybridMix)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                  useHybridMix ? "bg-purple-500" : "bg-white/[0.12]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    useHybridMix ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-sm font-bold text-gray-200">
                Custom question mix
              </span>
              {!useHybridMix && (
                <span className="text-xs text-gray-400">
                  (all {interviewType.split("/")[0].trim()} questions)
                </span>
              )}
            </div>

            {/* Hybrid mix builder */}
            {useHybridMix && (
              <div className="rounded-2xl border border-white/[0.07] bg-black/20 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-bold text-gray-300">
                    Allocate your {totalQuestions} questions by type
                  </p>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      mixMatchesTotal
                        ? "bg-emerald-400/15 text-emerald-300"
                        : currentMixTotal > totalQuestions
                        ? "bg-red-400/15 text-red-300"
                        : "bg-amber-400/15 text-amber-300"
                    }`}
                  >
                    {currentMixTotal} / {totalQuestions} allocated
                  </span>
                </div>

                <div className="space-y-2">
                  {QUESTION_TYPE_ORDER.map((key) => (
                    <div key={key}>
                      <div className="flex items-center gap-3">
                        <div className="w-44 shrink-0">
                          <span className="text-xs font-semibold text-gray-300">
                            {QUESTION_TYPE_LABELS[key]}
                          </span>
                          {key === "opener" && (
                            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                              AI-generated intro question
                            </p>
                          )}
                          {key === "custom" && (
                            <p className="text-[10px] text-gray-400 leading-tight mt-0.5">
                              Your own verbatim question
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          disabled={(questionMix[key] ?? 0) <= 0}
                          onClick={() => adjustMix(key, -1)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm font-bold text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-25"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-sm font-bold text-white">
                          {questionMix[key] ?? 0}
                        </span>
                        <button
                          type="button"
                          disabled={currentMixTotal >= totalQuestions}
                          onClick={() => adjustMix(key, 1)}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-sm font-bold text-white transition hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-25"
                        >
                          +
                        </button>
                        {(questionMix[key] ?? 0) > 0 && (
                          <div className="flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-1.5 rounded-full bg-gradient-to-r from-purple-400 to-fuchsia-400 transition-all"
                              style={{ width: `${((questionMix[key] ?? 0) / totalQuestions) * 100}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Custom question text inputs — one per custom slot */}
                      {key === "custom" && (questionMix.custom ?? 0) > 0 && (
                        <div className="mt-2 ml-[188px] space-y-2">
                          {Array.from({ length: questionMix.custom ?? 0 }).map((_, i) => (
                            <div key={i}>
                              <textarea
                                value={customQuestions[i] ?? ""}
                                onChange={(e) => {
                                  const updated = [...customQuestions];
                                  updated[i] = e.target.value.slice(
                                    0,
                                    MAX_CUSTOM_QUESTION_LENGTH
                                  );
                                  setCustomQuestions(updated);
                                }}
                                placeholder={`Question ${i + 1}: type it exactly as you want it asked`}
                                maxLength={MAX_CUSTOM_QUESTION_LENGTH}
                                rows={2}
                                className="w-full rounded-xl border border-white/10 bg-white/[0.06] px-3 py-2 text-xs text-white placeholder-gray-400 focus:border-purple-400/50 focus:outline-none resize-none"
                              />
                              {!(customQuestions[i] ?? "").trim() && (
                                <p className="mt-0.5 text-[10px] font-semibold text-amber-300">
                                  Enter question text to continue.
                                </p>
                              )}
                              <p className="mt-0.5 text-right text-[10px] text-gray-400">
                                {(customQuestions[i] ?? "").length} /{" "}
                                {MAX_CUSTOM_QUESTION_LENGTH}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {!mixMatchesTotal && (
                  <p className="mt-3 text-xs font-semibold text-amber-300">
                    {currentMixTotal < totalQuestions
                      ? `Add ${totalQuestions - currentMixTotal} more question${totalQuestions - currentMixTotal > 1 ? "s" : ""} to fill the session.`
                      : `Remove ${currentMixTotal - totalQuestions} question${currentMixTotal - totalQuestions > 1 ? "s" : ""} to match the session total.`}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {selectedPracticeMode !== "typed" && (
        <div className="mb-5 rounded-[1.7rem] border border-white/10 bg-black/25 p-5">
          <div className="mb-5">
            <p className="text-sm font-bold tracking-wide text-purple-300">
              Speaker preference
            </p>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-white">
              Choose how the interviewer sounds.
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              This controls the AI question playback voice for voice and
              voice-camera interviews.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <p className="mb-3 text-sm font-bold text-white">Voice style</p>
              <div className="grid gap-3 md:grid-cols-3">
                {speakerVoiceOptions.map((option) => (
                  <PreferenceCard
                    key={option.value}
                    active={speakerPreference.voice === option.value}
                    title={option.label}
                    description={option.description}
                    onClick={() =>
                      updateSpeakerPreference({ voice: option.value })
                    }
                  />
                ))}
              </div>
            </div>

            {/* Accent selector removed: this is a UK site, so there was one
                answer and asking the question only created a way to get it
                wrong. Pace stays — it is a genuine preference. */}
            <div className="grid gap-4 md:grid-cols-2">
              <PreferenceSelect
                label="Pace"
                value={speakerPreference.pace}
                options={speakerPaceOptions}
                onChange={(value) =>
                  updateSpeakerPreference({
                    pace: value as SpeakerPreference["pace"],
                  })
                }
              />
            </div>

            <AudioDeviceSelectors />
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm leading-6 text-gray-300">
                Current setup:{" "}
                <span className="font-bold text-white">{experienceLevel}</span>{" "}
                · {interviewType} · {difficulty} difficulty · Focus: {focusArea} ·{" "}
                <span className="font-bold text-white">
                  {practiceModeLabels[selectedPracticeMode]}
                </span>{" "}
                with a {formatPreferenceWord(speakerPreference.voice)} voice
                at {speakerPreference.pace} pace.
              </p>

              <button
                type="button"
                onClick={() => void savePracticePreference()}
                disabled={savingPreference || !isSignedIn}
                className="rounded-full border border-purple-300/20 bg-purple-300/10 px-4 py-2 text-xs font-bold text-purple-100 transition hover:bg-purple-300/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingPreference ? "Saving..." : "Save full setup as default"}
              </button>
            </div>

            {preferenceMessage && (
              <p className="mt-3 text-xs font-semibold leading-5 text-gray-400">
                {preferenceMessage}
              </p>
            )}

            {!isSignedIn && (
              <p className="mt-3 text-xs font-semibold leading-5 text-gray-400">
                Sign in to save your preferred role setup, practice mode and
                speaker.
              </p>
            )}
          </div>
        </div>
        )}
          </>
        )}


        <button
          onClick={startInterview}
          disabled={interviewStartDisabled}
          className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 text-base font-bold shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {questionLoading
            ? "Starting..."
            : hybridMixInvalid
            ? `Allocate all ${totalQuestions} questions to start`
            : customQuestionsInvalid
            ? "Enter text for all custom questions to start"
            : `Start Tailored ${isAdvancedPlan ? totalQuestions : 5}-Question Interview`}
        </button>

        {startDisabled && startDisabledMessage && (
          <p className="mt-3 text-sm font-semibold leading-6 text-gray-400">
            {startDisabledMessage}
          </p>
        )}

        <div className="mt-4">
          <DataTrustStrip compact />
        </div>
      </GlassCard>

      <aside className="space-y-6">
        <GlassCard>
          <h2 className="mb-4 text-xl font-bold text-white">Account</h2>

          {!isSignedIn && (
            <>
              <p className="mb-4 text-sm leading-6 text-gray-400">
                Sign in to save your candidate profile, reuse your CV context
                and prepare for richer progress tracking.
              </p>
              <SignInButton mode="modal">
                <button className="w-full rounded-2xl bg-white px-4 py-3 font-bold text-black shadow-xl shadow-purple-950/20 transition hover:bg-purple-100">
                  Sign In
                </button>
              </SignInButton>
            </>
          )}

          {isLoaded && isSignedIn && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-300">You are signed in.</p>
                <UserButton />
              </div>

              <Link
                href="/profile"
                className="block w-full rounded-2xl border border-purple-300/20 bg-purple-300/10 px-4 py-3 text-center text-sm font-bold text-purple-100 transition hover:bg-purple-300/15"
              >
                Manage Candidate Profile
              </Link>
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <h2 className="mb-4 text-xl font-bold text-white">Premium setup</h2>
          <div className="space-y-3 text-sm leading-6 text-gray-400">
            <CheckItem>{experienceLevel}</CheckItem>
            <CheckItem>{interviewType}</CheckItem>
            <CheckItem>{difficulty} difficulty</CheckItem>
            <CheckItem>Focus: {focusArea}</CheckItem>
            <CheckItem>{practiceModeLabels[selectedPracticeMode]}</CheckItem>
            <CheckItem>
              {formatPreferenceWord(speakerPreference.voice)} voice,{" "}
              {speakerPreference.pace} pace
            </CheckItem>
          </div>
        </GlassCard>
      </aside>
    </div>
  );
}

function ModeCard({
  active,
  title,
  badge,
  description,
  onClick,
  locked = false,
}: {
  active: boolean;
  title: string;
  badge: string;
  description: string;
  onClick: () => void;
  locked?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`group relative h-full rounded-[1.35rem] border p-4 text-left transition ${
        locked
          ? "cursor-pointer border-white/[0.06] bg-white/[0.025] opacity-60 hover:opacity-80"
          : active
          ? "border-cyan-300/35 bg-cyan-300/12 shadow-xl shadow-cyan-950/20 hover:-translate-y-0.5"
          : "border-white/10 bg-white/[0.045] hover:-translate-y-0.5 hover:bg-white/[0.07]"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-bold tracking-tight text-white">
            {title}
          </p>
          <p
            className={`mt-1 w-fit rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${
              locked
                ? "border border-purple-300/25 bg-purple-300/[0.1] text-purple-200"
                : active
                ? "bg-cyan-200 text-black"
                : "border border-white/10 bg-black/25 text-gray-300"
            }`}
          >
            {locked ? "Pro" : badge}
          </p>
        </div>

        <span
          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            locked
              ? "border-white/10 bg-black/30"
              : active
              ? "border-cyan-200 bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.45)]"
              : "border-white/20 bg-black/30"
          }`}
        >
          {locked ? (
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-gray-400">
              <path d="M12 1C8.676 1 6 3.676 6 7v1H4a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1h-2V7c0-3.324-2.676-6-6-6zm0 2c2.276 0 4 1.724 4 4v1H8V7c0-2.276 1.724-4 4-4zm0 9a2 2 0 1 1 0 4 2 2 0 0 1 0-4z"/>
            </svg>
          ) : active ? (
            <span className="h-2 w-2 rounded-full bg-black" />
          ) : null}
        </span>
      </div>

      <p className="text-sm leading-6 text-gray-300">{description}</p>
    </button>
  );
}

function PreferenceCard({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-[1.2rem] border p-4 text-left transition hover:-translate-y-0.5 ${
        active
          ? "border-purple-300/35 bg-purple-300/12 shadow-xl shadow-purple-950/20"
          : "border-white/10 bg-white/[0.045] hover:bg-white/[0.07]"
      }`}
    >
      <p className="text-sm font-bold text-white">{title}</p>
      <p className="mt-2 text-xs leading-5 text-gray-400">{description}</p>
    </button>
  );
}

function PreferenceSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold text-gray-200">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-black/35 p-4 text-white outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10"
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
            className="bg-[#0a0614]"
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}