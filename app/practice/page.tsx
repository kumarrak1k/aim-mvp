"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { PracticeHeader } from "./components/PracticeHeader";
import { PracticeHero } from "./components/PracticeHero";
import { PracticeStartScreen } from "./components/PracticeStartScreen";
import { useDeviceProfile } from "./hooks/useDeviceProfile";
import { fetchCandidateProfile } from "./lib/interviewApi";
import {
  buildAutofilledRoleFromProfile,
  hasCandidateProfileContext,
} from "./lib/profileHelpers";
import type { CandidateProfile } from "./types";

type PracticeSessionConfig = {
  role: string;
  experienceLevel: string;
  interviewType: string;
  difficulty: string;
  focusArea: string;
  speakerEnabled: boolean;
  cameraEnabled: boolean;
  createdAt: string;
};

const PRACTICE_SESSION_CONFIG_KEY = "aim_practice_session_config";

export default function PracticeSetupPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useUser();
  const { manualDeviceMode } = useDeviceProfile();

  const [role, setRole] = useState("");
  const [savedCandidateProfile, setSavedCandidateProfile] =
    useState<CandidateProfile | null>(null);
  const [profileContextLoaded, setProfileContextLoaded] = useState(false);
  const [roleAutofilledFromProfile, setRoleAutofilledFromProfile] =
    useState(false);

  const [experienceLevel, setExperienceLevel] = useState(
    "Graduate / entry level"
  );
  const [interviewType, setInterviewType] = useState(
    "Competency / behavioural"
  );
  const [difficulty, setDifficulty] = useState("Standard");
  const [focusArea, setFocusArea] = useState("Balanced");
  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [questionLoading, setQuestionLoading] = useState(false);

  const roleRef = useRef("");
  const roleManuallyEditedRef = useRef(false);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setSavedCandidateProfile(null);
      setProfileContextLoaded(true);
      return;
    }

    let cancelled = false;

    const loadCandidateProfile = async () => {
      try {
        setProfileContextLoaded(false);
        const profile = await fetchCandidateProfile();

        if (cancelled) return;

        setSavedCandidateProfile(profile);

        const autofilledRole = buildAutofilledRoleFromProfile(profile);

        if (
          autofilledRole &&
          !roleRef.current.trim() &&
          !roleManuallyEditedRef.current
        ) {
          setRole(autofilledRole);
          setRoleAutofilledFromProfile(true);
        }

        setProfileContextLoaded(true);
      } catch {
        if (!cancelled) {
          setSavedCandidateProfile(null);
          setProfileContextLoaded(true);
        }
      }
    };

    void loadCandidateProfile();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

  const handleRoleChange = useCallback((value: string) => {
    roleManuallyEditedRef.current = true;
    setRoleAutofilledFromProfile(false);
    setRole(value);
  }, []);

  const useSavedProfileForRole = useCallback(() => {
    const autofilledRole = buildAutofilledRoleFromProfile(savedCandidateProfile);

    if (!autofilledRole) return;

    roleManuallyEditedRef.current = false;
    setRole(autofilledRole);
    setRoleAutofilledFromProfile(true);
  }, [savedCandidateProfile]);

  const setTextOnlyMode = useCallback(() => {
    setSpeakerEnabled(false);
  }, []);

  const setSpeakerMode = useCallback(() => {
    setSpeakerEnabled(true);
  }, []);

  const toggleCamera = useCallback(() => {
    setCameraEnabled((previous) => !previous);
  }, []);

  const startInterview = useCallback(() => {
    const trimmedRole = role.trim();

    if (!trimmedRole) return;

    const sessionConfig: PracticeSessionConfig = {
      role: trimmedRole,
      experienceLevel,
      interviewType,
      difficulty,
      focusArea,
      speakerEnabled,
      cameraEnabled,
      createdAt: new Date().toISOString(),
    };

    setQuestionLoading(true);

    try {
      window.sessionStorage.setItem(
        PRACTICE_SESSION_CONFIG_KEY,
        JSON.stringify(sessionConfig)
      );
    } catch {
      // Continue even if sessionStorage is unavailable. The session page will
      // show a clear setup recovery state.
    }

    router.push("/practice/session");
  }, [
    cameraEnabled,
    difficulty,
    experienceLevel,
    focusArea,
    interviewType,
    role,
    router,
    speakerEnabled,
  ]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#120d1e] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(140,92,255,0.18),transparent_35%),radial-gradient(circle_at_right,rgba(34,211,238,0.08),transparent_28%),linear-gradient(180deg,#120d1e_0%,#171224_45%,#1b1629_100%)]" />
      <div className="pointer-events-none fixed left-1/2 top-[-220px] z-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-purple-600/20 blur-[140px]" />
      <div className="pointer-events-none fixed right-[-140px] top-24 z-0 h-[320px] w-[320px] rounded-full bg-cyan-400/10 blur-[120px]" />
      <div className="pointer-events-none fixed left-[-140px] bottom-12 z-0 h-[320px] w-[320px] rounded-full bg-fuchsia-400/10 blur-[120px]" />

      <div className="relative z-10">
        <PracticeHeader isLoaded={isLoaded} isSignedIn={isSignedIn} />

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:py-12">
          <PracticeHero totalQuestions={5} />

          <PracticeStartScreen
            isLoaded={isLoaded}
            isSignedIn={isSignedIn}
            role={role}
            onRoleChange={handleRoleChange}
            savedCandidateProfile={savedCandidateProfile}
            profileContextLoaded={profileContextLoaded}
            roleAutofilledFromProfile={roleAutofilledFromProfile}
            useSavedProfileForRole={useSavedProfileForRole}
            manualDeviceMode={manualDeviceMode}
            experienceLevel={experienceLevel}
            setExperienceLevel={setExperienceLevel}
            interviewType={interviewType}
            setInterviewType={setInterviewType}
            difficulty={difficulty}
            setDifficulty={setDifficulty}
            focusArea={focusArea}
            setFocusArea={setFocusArea}
            speakerEnabled={speakerEnabled}
            cameraEnabled={cameraEnabled}
            setTextOnlyMode={setTextOnlyMode}
            setSpeakerMode={setSpeakerMode}
            toggleCamera={toggleCamera}
            startInterview={startInterview}
            questionLoading={questionLoading}
          />

          {isSignedIn &&
            profileContextLoaded &&
            hasCandidateProfileContext(savedCandidateProfile) && (
              <p className="mt-5 text-center text-xs font-semibold text-gray-500">
                Your saved profile context will be available to the interview
                session.
              </p>
            )}
        </div>
      </div>
    </main>
  );
}
