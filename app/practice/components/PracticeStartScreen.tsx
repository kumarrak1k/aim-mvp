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
  {
    value: "neutral",
    label: "Neutral",
    description: "Balanced and versatile.",
  },
];

const speakerAccentOptions: Array<{
  value: SpeakerPreference["accent"];
  label: string;
}> = [
  { value: "british", label: "British" },
  { value: "american", label: "American" },
  { value: "neutral", label: "Neutral" },
];

const speakerPaceOptions: Array<{
  value: SpeakerPreference["pace"];
  label: string;
}> = [
  { value: "slow", label: "Slower" },
  { value: "natural", label: "Natural" },
  { value: "energetic", label: "More energetic" },
];

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
}: PracticeStartScreenProps) {
  const [savingPreference, setSavingPreference] = useState(false);
  const [preferenceMessage, setPreferenceMessage] = useState("");
  const appliedSavedPreferencesRef = useRef(false);

  const selectedPracticeMode = useMemo<PracticeMode>(() => {
    if (speakerEnabled && cameraEnabled) return "voice-camera";
    if (speakerEnabled) return "voice";
    return "typed";
  }, [cameraEnabled, speakerEnabled]);

  const selectPracticeMode = useCallback(
    (mode: PracticeMode) => {
      setPreferenceMessage("");

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

      if (!speakerEnabled) setSpeakerMode();
      if (!cameraEnabled) toggleCamera();
    },
    [
      cameraEnabled,
      setSpeakerMode,
      setTextOnlyMode,
      speakerEnabled,
      toggleCamera,
    ]
  );

  useEffect(() => {
    if (
      appliedSavedPreferencesRef.current ||
      !isSignedIn ||
      !profileContextLoaded ||
      !savedCandidateProfile
    ) {
      return;
    }

    appliedSavedPreferencesRef.current = true;

    if (savedCandidateProfile.preferredPracticeMode) {
      selectPracticeMode(savedCandidateProfile.preferredPracticeMode);
    }

    if (savedCandidateProfile.speakerPreference) {
      setSpeakerPreference(savedCandidateProfile.speakerPreference);
    }
  }, [
    isSignedIn,
    profileContextLoaded,
    savedCandidateProfile,
    selectPracticeMode,
    setSpeakerPreference,
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
        "Sign in to save this as your default practice mode and speaker preference."
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
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        setPreferenceMessage(
          data.error || "Could not save your practice preferences."
        );
        return;
      }

      setPreferenceMessage(
        `${practiceModeLabels[selectedPracticeMode]} and speaker preference saved as your default.`
      );
    } catch {
      setPreferenceMessage("Something went wrong while saving your preference.");
    } finally {
      setSavingPreference(false);
    }
  }, [isSignedIn, savedCandidateProfile, selectedPracticeMode, speakerPreference]);

  return (
    <div className="grid gap-6 lg:grid-cols-[2fr_0.9fr]">
      <GlassCard>
        <div className="mb-6">
          <p className="mb-2 text-sm font-black uppercase tracking-[0.22em] text-purple-300">
            Start interview
          </p>
          <h2 className="text-2xl font-black tracking-[-0.03em] md:text-3xl">
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
          className="mb-3 w-full rounded-2xl border border-white/10 bg-black/35 p-4 text-white placeholder-gray-500 outline-none transition focus:border-purple-300/50 focus:ring-4 focus:ring-purple-500/10"
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
                  <p className="text-sm font-black text-emerald-200">
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
                    className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-black text-emerald-100 transition hover:bg-emerald-300/15"
                  >
                    Use saved profile
                  </button>

                  <Link href="/profile">
                    <button
                      type="button"
                      className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black text-gray-200 transition hover:bg-white/[0.1]"
                    >
                      Edit profile
                    </button>
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

                <Link href="/profile">
                  <button
                    type="button"
                    className="rounded-full border border-purple-300/20 bg-purple-300/10 px-4 py-2 text-xs font-black text-purple-100 transition hover:bg-purple-300/15"
                  >
                    Create profile
                  </button>
                </Link>
              </div>
            )}
        </div>

        {manualDeviceMode && (
          <div className="mb-5 rounded-2xl border border-cyan-300/15 bg-cyan-300/10 p-4">
            <p className="text-sm font-black text-cyan-200">
              Phone/tablet mode enabled
            </p>
            <p className="mt-1 text-sm leading-6 text-gray-300">
              The interview page will show a large Guided Answer button. It
              plays AI-generated question audio and then starts your microphone
              recording.
            </p>
          </div>
        )}

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

        <div className="mb-5 rounded-[1.7rem] border border-white/10 bg-black/25 p-5">
          <div className="mb-5">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-300">
              Practice mode
            </p>
            <h3 className="mt-2 text-xl font-black tracking-[-0.03em] text-white">
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
            />

            <ModeCard
              active={selectedPracticeMode === "voice-camera"}
              title="Voice + camera interview"
              badge="Full practice"
              description="Practise like a remote interview: question audio, spoken answer, transcript and camera presence analysis."
              onClick={() => selectPracticeMode("voice-camera")}
            />
          </div>
        </div>

        <div className="mb-5 rounded-[1.7rem] border border-white/10 bg-black/25 p-5">
          <div className="mb-5">
            <p className="text-sm font-black uppercase tracking-[0.2em] text-purple-300">
              Speaker preference
            </p>
            <h3 className="mt-2 text-xl font-black tracking-[-0.03em] text-white">
              Choose how the interviewer sounds.
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-400">
              This controls the AI question playback voice for voice and
              voice-camera interviews.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <p className="mb-3 text-sm font-black text-white">Voice style</p>
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

            <div className="grid gap-4 md:grid-cols-2">
              <PreferenceSelect
                label="Accent"
                value={speakerPreference.accent}
                options={speakerAccentOptions}
                onChange={(value) =>
                  updateSpeakerPreference({
                    accent: value as SpeakerPreference["accent"],
                  })
                }
              />

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
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <p className="text-sm leading-6 text-gray-300">
                Current setup:{" "}
                <span className="font-black text-white">
                  {practiceModeLabels[selectedPracticeMode]}
                </span>{" "}
                with a {speakerPreference.accent} {speakerPreference.voice}{" "}
                voice at {speakerPreference.pace} pace.
              </p>

              <button
                type="button"
                onClick={() => void savePracticePreference()}
                disabled={savingPreference || !isSignedIn}
                className="rounded-full border border-purple-300/20 bg-purple-300/10 px-4 py-2 text-xs font-black text-purple-100 transition hover:bg-purple-300/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {savingPreference ? "Saving..." : "Save as default"}
              </button>
            </div>

            {preferenceMessage && (
              <p className="mt-3 text-xs font-semibold leading-5 text-gray-400">
                {preferenceMessage}
              </p>
            )}

            {!isSignedIn && (
              <p className="mt-3 text-xs font-semibold leading-5 text-gray-500">
                Sign in to save your preferred practice mode and speaker.
              </p>
            )}
          </div>
        </div>

        <button
          onClick={startInterview}
          disabled={!role.trim() || questionLoading}
          className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-6 py-4 text-base font-black shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {questionLoading ? "Starting..." : "Start Tailored 5-Question Interview"}
        </button>
      </GlassCard>

      <aside className="space-y-6">
        <GlassCard>
          <h2 className="mb-4 text-xl font-black text-white">Account</h2>

          {!isSignedIn && (
            <>
              <p className="mb-4 text-sm leading-6 text-gray-400">
                Sign in to save your candidate profile, reuse your CV context
                and prepare for richer progress tracking.
              </p>
              <SignInButton mode="modal">
                <button className="w-full rounded-2xl bg-white px-4 py-3 font-black text-black shadow-xl shadow-purple-950/20 transition hover:bg-purple-100">
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

              <Link href="/profile">
                <button className="w-full rounded-2xl border border-purple-300/20 bg-purple-300/10 px-4 py-3 text-sm font-black text-purple-100 transition hover:bg-purple-300/15">
                  Manage Candidate Profile
                </button>
              </Link>
            </div>
          )}
        </GlassCard>

        <GlassCard>
          <h2 className="mb-4 text-xl font-black text-white">Premium setup</h2>
          <div className="space-y-3 text-sm leading-6 text-gray-400">
            <CheckItem>{experienceLevel}</CheckItem>
            <CheckItem>{interviewType}</CheckItem>
            <CheckItem>{difficulty} difficulty</CheckItem>
            <CheckItem>Focus: {focusArea}</CheckItem>
            <CheckItem>{practiceModeLabels[selectedPracticeMode]}</CheckItem>
            <CheckItem>
              {speakerPreference.accent} {speakerPreference.voice} voice,{" "}
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
}: {
  active: boolean;
  title: string;
  badge: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group h-full rounded-[1.35rem] border p-4 text-left transition hover:-translate-y-0.5 ${
        active
          ? "border-cyan-300/35 bg-cyan-300/12 shadow-xl shadow-cyan-950/20"
          : "border-white/10 bg-white/[0.045] hover:bg-white/[0.07]"
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-black tracking-[-0.02em] text-white">
            {title}
          </p>
          <p
            className={`mt-1 w-fit rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${
              active
                ? "bg-cyan-200 text-black"
                : "border border-white/10 bg-black/25 text-gray-300"
            }`}
          >
            {badge}
          </p>
        </div>

        <span
          className={`mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
            active
              ? "border-cyan-200 bg-cyan-200 shadow-[0_0_18px_rgba(103,232,249,0.45)]"
              : "border-white/20 bg-black/30"
          }`}
        >
          {active && <span className="h-2 w-2 rounded-full bg-black" />}
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
      <p className="text-sm font-black text-white">{title}</p>
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
            className="bg-[#120d1e]"
          >
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}