"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { PracticeHeader } from "./PracticeHeader";
import { PracticeHero } from "./PracticeHero";
import { PracticeStartScreen } from "./PracticeStartScreen";
import { fetchCandidateProfile } from "../lib/interviewApi";
import { buildAutofilledRoleFromProfile } from "../lib/profileHelpers";
import { useDeviceProfile } from "../hooks/useDeviceProfile";
import type {
  CandidateProfile,
  PracticeMode,
  SpeakerPreference,
} from "../types";
import {
  defaultSpeakerPreference,
  PRACTICE_SESSION_CONFIG_KEY,
  totalQuestions,
} from "../session/utils";

type PracticeUsage = {
  planName: string;
  dailyLimit: number;
  usedToday: number;
  remainingToday: number;
  limitReached: boolean;
  resetsAt: string;
};

const practiceModeLabels: Record<PracticeMode, string> = {
  typed: "Typed answers only",
  voice: "Voice interview",
  "voice-camera": "Voice + camera interview",
};

const defaultPracticeUsage: PracticeUsage = {
  planName: "Beta",
  dailyLimit: 3,
  usedToday: 0,
  remainingToday: 3,
  limitReached: false,
  resetsAt: "",
};

const formatSpeakerSetup = (
  speakerEnabled: boolean,
  speakerPreference: SpeakerPreference
) => {
  if (!speakerEnabled) return "typed answers";

  return `${speakerPreference.accent} ${speakerPreference.voice} voice at ${speakerPreference.pace} pace`;
};

function formatResetTime(value: string) {
  if (!value) return "tomorrow";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "tomorrow";
  }

  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function PracticePageClient() {
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
  const [speakerPreference, setSpeakerPreference] =
    useState<SpeakerPreference>(defaultSpeakerPreference);
  const [questionLoading, setQuestionLoading] = useState(false);

  const [practiceUsage, setPracticeUsage] =
    useState<PracticeUsage>(defaultPracticeUsage);
  const [usageLoaded, setUsageLoaded] = useState(false);
  const [usageMessage, setUsageMessage] = useState("");

  const roleRef = useRef("");
  const roleManuallyEditedRef = useRef(false);
  const setupManuallyEditedRef = useRef(false);

  const selectedPracticeMode = useMemo<PracticeMode>(() => {
    if (speakerEnabled && cameraEnabled) return "voice-camera";
    if (speakerEnabled) return "voice";
    return "typed";
  }, [cameraEnabled, speakerEnabled]);

  const setupSummary = useMemo(() => {
    const roleLabel = role.trim() || "No target role set";
    const speakerLabel = formatSpeakerSetup(speakerEnabled, speakerPreference);

    return `${roleLabel} · ${experienceLevel} · ${interviewType} · ${difficulty} difficulty · Focus: ${focusArea} · ${practiceModeLabels[selectedPracticeMode]} · ${speakerLabel}`;
  }, [
    difficulty,
    experienceLevel,
    focusArea,
    interviewType,
    role,
    selectedPracticeMode,
    speakerEnabled,
    speakerPreference,
  ]);

  const signedInLimitReached =
    Boolean(isSignedIn) && usageLoaded && practiceUsage.limitReached;

  const canStartInterview = Boolean(role.trim()) && !signedInLimitReached;

  const usageSummary = useMemo(() => {
    if (!isLoaded) return "Checking beta usage...";

    if (!isSignedIn) {
      return "Sign in to save progress. Beta users can save 3 completed sessions per day.";
    }

    if (!usageLoaded) {
      return "Checking your daily beta session limit...";
    }

    if (practiceUsage.limitReached) {
      return `Daily beta limit reached. You can complete more saved sessions after ${formatResetTime(
        practiceUsage.resetsAt
      )}.`;
    }

    return `${practiceUsage.remainingToday}/${practiceUsage.dailyLimit} saved practice sessions remaining today.`;
  }, [isLoaded, isSignedIn, practiceUsage, usageLoaded]);

  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  const applySavedSetupDefaults = useCallback((profile: CandidateProfile | null) => {
    if (!profile || setupManuallyEditedRef.current) return;

    if (profile.defaultExperienceLevel) {
      setExperienceLevel(profile.defaultExperienceLevel);
    }

    if (profile.defaultInterviewType) {
      setInterviewType(profile.defaultInterviewType);
    }

    if (profile.defaultDifficulty) {
      setDifficulty(profile.defaultDifficulty);
    }

    if (profile.defaultFocusArea) {
      setFocusArea(profile.defaultFocusArea);
    }
  }, []);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      setPracticeUsage(defaultPracticeUsage);
      setUsageLoaded(true);
      setUsageMessage("");
      return;
    }

    let cancelled = false;

    const loadPracticeUsage = async () => {
      try {
        setUsageLoaded(false);
        setUsageMessage("");

        const response = await fetch("/api/practice-sessions", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json().catch(() => null);

        if (cancelled) return;

        if (!response.ok || data?.error) {
          setPracticeUsage(defaultPracticeUsage);
          setUsageMessage(
            data?.error || "Could not check your daily practice limit."
          );
          return;
        }

        if (data?.usage) {
          setPracticeUsage(data.usage);
        } else {
          setPracticeUsage(defaultPracticeUsage);
        }
      } catch {
        if (!cancelled) {
          setPracticeUsage(defaultPracticeUsage);
          setUsageMessage("Could not check your daily practice limit.");
        }
      } finally {
        if (!cancelled) {
          setUsageLoaded(true);
        }
      }
    };

    void loadPracticeUsage();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn]);

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
        applySavedSetupDefaults(profile);

        if (profile?.speakerPreference) {
          setSpeakerPreference(profile.speakerPreference);
        }

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
  }, [applySavedSetupDefaults, isLoaded, isSignedIn]);

  const onRoleChange = useCallback((value: string) => {
    roleManuallyEditedRef.current = true;
    setRoleAutofilledFromProfile(false);
    setRole(value);
  }, []);

  const onExperienceLevelChange = useCallback((value: string) => {
    setupManuallyEditedRef.current = true;
    setExperienceLevel(value);
  }, []);

  const onInterviewTypeChange = useCallback((value: string) => {
    setupManuallyEditedRef.current = true;
    setInterviewType(value);
  }, []);

  const onDifficultyChange = useCallback((value: string) => {
    setupManuallyEditedRef.current = true;
    setDifficulty(value);
  }, []);

  const onFocusAreaChange = useCallback((value: string) => {
    setupManuallyEditedRef.current = true;
    setFocusArea(value);
  }, []);

  const useSavedProfileForRole = useCallback(() => {
    const autofilledRole = buildAutofilledRoleFromProfile(savedCandidateProfile);

    if (!autofilledRole) return;

    roleManuallyEditedRef.current = false;
    setRole(autofilledRole);
    setRoleAutofilledFromProfile(true);
  }, [savedCandidateProfile]);

  const toggleCamera = useCallback(() => {
    setCameraEnabled((previous) => !previous);
  }, []);

  const setTextOnlyMode = useCallback(() => {
    setSpeakerEnabled(false);
    setCameraEnabled(false);
  }, []);

  const setSpeakerMode = useCallback(() => {
    setSpeakerEnabled(true);
  }, []);

  const startInterview = useCallback(() => {
    if (!role.trim()) return;

    if (signedInLimitReached) {
      setUsageMessage(
        `Daily beta limit reached. You can complete more saved sessions after ${formatResetTime(
          practiceUsage.resetsAt
        )}.`
      );
      return;
    }

    try {
      setQuestionLoading(true);

      window.sessionStorage.setItem(
        PRACTICE_SESSION_CONFIG_KEY,
        JSON.stringify({
          role,
          experienceLevel,
          interviewType,
          difficulty,
          focusArea,
          speakerEnabled,
          cameraEnabled,
          speakerPreference,
          createdAt: new Date().toISOString(),
        })
      );

      router.push("/practice/session");
    } finally {
      window.setTimeout(() => setQuestionLoading(false), 600);
    }
  }, [
    cameraEnabled,
    difficulty,
    experienceLevel,
    focusArea,
    interviewType,
    practiceUsage.resetsAt,
    role,
    router,
    signedInLimitReached,
    speakerEnabled,
    speakerPreference,
  ]);

  return (
    <main className="min-h-screen overflow-hidden bg-[#120d1e] text-white">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_top,rgba(140,92,255,0.18),transparent_35%),radial-gradient(circle_at_right,rgba(34,211,238,0.08),transparent_28%),linear-gradient(180deg,#120d1e_0%,#171224_45%,#1b1629_100%)]" />
      <div className="pointer-events-none fixed left-1/2 top-[-220px] z-0 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-purple-600/20 blur-[140px]" />
      <div className="pointer-events-none fixed right-[-140px] top-24 z-0 h-[320px] w-[320px] rounded-full bg-cyan-400/10 blur-[120px]" />
      <div className="pointer-events-none fixed left-[-140px] bottom-12 z-0 h-[320px] w-[320px] rounded-full bg-fuchsia-400/10 blur-[120px]" />

      <div className="relative z-10">
        <PracticeHeader isLoaded={isLoaded} isSignedIn={isSignedIn} />

        <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
          <PracticeHero
            totalQuestions={totalQuestions}
            canStartInterview={canStartInterview}
            questionLoading={questionLoading}
            setupSummary={setupSummary}
            usageSummary={usageSummary}
            usageLimitReached={signedInLimitReached}
            usageMessage={usageMessage}
            onStartInterview={startInterview}
          />

          <div id="interview-setup">
            <PracticeStartScreen
              isLoaded={isLoaded}
              isSignedIn={isSignedIn}
              role={role}
              onRoleChange={onRoleChange}
              savedCandidateProfile={savedCandidateProfile}
              profileContextLoaded={profileContextLoaded}
              roleAutofilledFromProfile={roleAutofilledFromProfile}
              useSavedProfileForRole={useSavedProfileForRole}
              manualDeviceMode={manualDeviceMode}
              experienceLevel={experienceLevel}
              setExperienceLevel={onExperienceLevelChange}
              interviewType={interviewType}
              setInterviewType={onInterviewTypeChange}
              difficulty={difficulty}
              setDifficulty={onDifficultyChange}
              focusArea={focusArea}
              setFocusArea={onFocusAreaChange}
              speakerEnabled={speakerEnabled}
              cameraEnabled={cameraEnabled}
              speakerPreference={speakerPreference}
              setSpeakerPreference={setSpeakerPreference}
              setTextOnlyMode={setTextOnlyMode}
              setSpeakerMode={setSpeakerMode}
              toggleCamera={toggleCamera}
              startInterview={startInterview}
              questionLoading={questionLoading}
              startDisabled={signedInLimitReached}
              startDisabledMessage={usageSummary}
            />
          </div>
        </section>
      </div>
    </main>
  );
}