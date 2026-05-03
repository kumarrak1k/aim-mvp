"use client";

import Link from "next/link";
import { SignInButton, UserButton } from "@clerk/nextjs";
import type { CandidateProfile } from "../types";
import {
  difficultyLevels,
  experienceLevels,
  focusAreas,
  interviewTypes,
} from "../lib/interviewOptions";
import { hasCandidateProfileContext } from "../lib/profileHelpers";
import { CheckItem, GlassCard, SelectField, ToggleButton } from "./PracticeUi";

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
  setTextOnlyMode: () => void;
  setSpeakerMode: () => void;
  toggleCamera: () => void;
  startInterview: () => void;
  questionLoading: boolean;
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
  setTextOnlyMode,
  setSpeakerMode,
  toggleCamera,
  startInterview,
  questionLoading,
}: PracticeStartScreenProps) {
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

        <div className="mb-5 rounded-[1.5rem] border border-white/10 bg-black/25 p-4">
          <p className="mb-3 text-sm font-bold text-gray-300">
            Practice settings
          </p>

          <div className="flex flex-wrap gap-3">
            <ToggleButton active={!speakerEnabled} onClick={setTextOnlyMode}>
              Text Only
            </ToggleButton>

            <ToggleButton active={speakerEnabled} onClick={setSpeakerMode}>
              Speaker + Text
            </ToggleButton>

            <ToggleButton active={cameraEnabled} onClick={toggleCamera}>
              {cameraEnabled ? "Camera On" : "Camera Off"}
            </ToggleButton>
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
                Sign in to prepare for saved accounts, progress tracking and
                future premium reports.
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
                  Manage Profile
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
          </div>
        </GlassCard>
      </aside>
    </div>
  );
}
