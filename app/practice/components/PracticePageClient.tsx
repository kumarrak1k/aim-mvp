"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";
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
  DEFAULT_TOTAL_QUESTIONS,
  defaultSpeakerPreference,
  PRACTICE_SESSION_CONFIG_KEY,
  type QuestionMix,
} from "../session/utils";

type PracticeUsage = {
  planName: string;
  dailyLimit: number | null;
  usedToday: number;
  remainingToday: number | null;
  limitReached: boolean;
  resetsAt: string;
};

const practiceModeLabels: Record<PracticeMode, string> = {
  typed: "Typed answers only",
  voice: "Voice interview",
  "voice-camera": "Voice + camera interview",
};

const defaultPracticeUsage: PracticeUsage = {
  planName: "Free",
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

export function PracticePageClient({ initialPlanName = "Free" }: { initialPlanName?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoaded, isSignedIn } = useUser();
  const { manualDeviceMode } = useDeviceProfile();

  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false);
  const [paymentActivating, setPaymentActivating] = useState(false);
  const [confirmedPlanName, setConfirmedPlanName] = useState<string | null>(null);
  const [usageRefreshKey, setUsageRefreshKey] = useState(0);

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

  // Advanced plan — custom question count & hybrid mix
  const [totalQuestions, setTotalQuestions] = useState(DEFAULT_TOTAL_QUESTIONS);
  const [useHybridMix, setUseHybridMix] = useState(false);
  const [questionMix, setQuestionMix] = useState<QuestionMix>({
    competency: DEFAULT_TOTAL_QUESTIONS,
    technical: 0,
    leadership: 0,
    motivation: 0,
    situational: 0,
    commercial: 0,
  });

  const [speakerEnabled, setSpeakerEnabled] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [speakerPreference, setSpeakerPreference] =
    useState<SpeakerPreference>(defaultSpeakerPreference);
  const [questionLoading, setQuestionLoading] = useState(false);

  const [practiceUsage, setPracticeUsage] =
    useState<PracticeUsage>({ ...defaultPracticeUsage, planName: initialPlanName });
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

  // Detect ?payment=success, clean the URL, then poll /api/subscription
  // until the webhook has confirmed the plan as active in Clerk metadata.
  useEffect(() => {
    if (searchParams.get("payment") !== "success") return;

    setShowPaymentSuccess(true);
    setPaymentActivating(true);
    setConfirmedPlanName(null);

    const url = new URL(window.location.href);
    url.searchParams.delete("payment");
    window.history.replaceState({}, "", url.toString());

    const dismissTimer = window.setTimeout(() => setShowPaymentSuccess(false), 14000);

    let attempts = 0;
    const maxAttempts = 10;
    let pollTimer: ReturnType<typeof setTimeout>;

    const poll = async () => {
      try {
        const res = await fetch("/api/subscription");
        const data = (await res.json()) as { isActive?: boolean; planName?: string };
        if (data.isActive && data.planName && data.planName !== "Free") {
          setConfirmedPlanName(data.planName);
          setPaymentActivating(false);
          // Trigger usage re-fetch so limit-reached UI clears
          setUsageRefreshKey((k) => k + 1);
          return;
        }
      } catch {
        // ignore transient errors, keep polling
      }

      attempts += 1;
      if (attempts < maxAttempts) {
        pollTimer = setTimeout(() => void poll(), 2000);
      } else {
        // Timed out — webhook may be delayed; let the user know
        setPaymentActivating(false);
        setConfirmedPlanName("your new plan");
      }
    };

    // First poll after a short delay to give the webhook a head start
    pollTimer = setTimeout(() => void poll(), 1500);

    return () => {
      window.clearTimeout(dismissTimer);
      clearTimeout(pollTimer);
    };
  }, [searchParams]);

  // Secondary signal: if the usage API already shows a paid plan while we are
  // still waiting for the subscription poll, dismiss the activating banner
  // immediately — no need to keep the spinner going.
  useEffect(() => {
    if (!paymentActivating) return;
    if (!usageLoaded) return;
    if (practiceUsage.planName && practiceUsage.planName !== "Free") {
      setPaymentActivating(false);
      setConfirmedPlanName(practiceUsage.planName);
    }
  }, [paymentActivating, usageLoaded, practiceUsage.planName]);

  const signedInLimitReached =
    Boolean(isSignedIn) && usageLoaded && practiceUsage.limitReached;

  // Free plan = the usage API returned planName "Free" (covers both signed-in
  // free users and not-yet-signed-in visitors). While usage is still loading
  // default to free so voice options stay hidden rather than flicker in.
  const isFreePlan = practiceUsage.planName === "Free";
  const isAdvancedPlan = practiceUsage.planName === "Professional";

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
      return `You have used all 3 free trial sessions. Upgrade to Plus for unlimited sessions and all interview modes.`;
    }

    if (practiceUsage.dailyLimit === null) {
      return `${practiceUsage.planName} plan · Unlimited sessions.`;
    }

    return `${practiceUsage.remainingToday} of ${practiceUsage.dailyLimit} free trial sessions remaining · keyboard mode only.`;
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

  const applySavedAdvancedDefaults = useCallback((profile: CandidateProfile | null) => {
    if (!profile || setupManuallyEditedRef.current) return;

    const savedTotal = profile.defaultTotalQuestions;
    if (typeof savedTotal === "number" && savedTotal >= 3 && savedTotal <= 10) {
      setTotalQuestions(savedTotal);
    }

    if (typeof profile.defaultUseHybridMix === "boolean") {
      setUseHybridMix(profile.defaultUseHybridMix);
    }

    if (profile.defaultUseHybridMix && profile.defaultQuestionMix) {
      setQuestionMix(profile.defaultQuestionMix);
    } else if (typeof savedTotal === "number") {
      setQuestionMix({
        competency: savedTotal,
        technical: 0,
        leadership: 0,
        motivation: 0,
        situational: 0,
        commercial: 0,
      });
    }
  }, []);

  // Account-type guard — corporate users who reach /practice get sent home.
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/account-type");
        if (!res.ok || cancelled) return;
        const { accountType } = await res.json() as { accountType?: string };
        if (!cancelled && accountType === "corporate") {
          router.replace("/company/dashboard");
        }
      } catch { /* if check fails, let the page load normally */ }
    })();
    return () => { cancelled = true; };
  }, [isLoaded, isSignedIn, router]);

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
  }, [isLoaded, isSignedIn, usageRefreshKey]);

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

  const advancedDefaultsAppliedRef = useRef(false);
  useEffect(() => {
    if (advancedDefaultsAppliedRef.current) return;
    if (!usageLoaded || !profileContextLoaded) return;
    if (!isAdvancedPlan || !savedCandidateProfile) return;
    advancedDefaultsAppliedRef.current = true;
    applySavedAdvancedDefaults(savedCandidateProfile);
  }, [
    applySavedAdvancedDefaults,
    isAdvancedPlan,
    profileContextLoaded,
    savedCandidateProfile,
    usageLoaded,
  ]);

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

      // Free-plan users are restricted to typed/keyboard mode regardless of
      // whatever the UI state happens to be (e.g. stale from a previous
      // session or from a saved profile loaded before usage was confirmed).
      window.sessionStorage.setItem(
        PRACTICE_SESSION_CONFIG_KEY,
        JSON.stringify({
          role,
          experienceLevel,
          interviewType,
          difficulty,
          focusArea,
          speakerEnabled: isFreePlan ? false : speakerEnabled,
          cameraEnabled: isFreePlan ? false : cameraEnabled,
          speakerPreference,
          freePlan: isFreePlan,
          practiceMode: isFreePlan ? "typed" : selectedPracticeMode,
          createdAt: new Date().toISOString(),
          // Advanced plan extras
          totalQuestions: isAdvancedPlan ? totalQuestions : DEFAULT_TOTAL_QUESTIONS,
          questionMix: isAdvancedPlan && useHybridMix ? questionMix : undefined,
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
    isFreePlan,
    isAdvancedPlan,
    practiceUsage.resetsAt,
    role,
    router,
    signedInLimitReached,
    speakerEnabled,
    speakerPreference,
    totalQuestions,
    useHybridMix,
    questionMix,
  ]);

  return (
    <CandidateAppShell currentPath="/practice">
      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:py-10">
        {showPaymentSuccess && (
          <div className="mb-5 flex items-center justify-between gap-4 rounded-2xl border border-emerald-300/25 bg-emerald-300/[0.08] px-5 py-4">
            <div className="flex items-center gap-3">
              {paymentActivating ? (
                <div className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
              ) : (
                <span className="text-xl">🎉</span>
              )}
              <div>
                <p className="text-sm font-black text-emerald-200">
                  {paymentActivating
                    ? "Activating your subscription…"
                    : `Welcome to ${confirmedPlanName ?? practiceUsage.planName}!`}
                </p>
                <p className="text-xs text-emerald-300/70">
                  {paymentActivating
                    ? "Confirming your plan with Stripe — this takes just a moment."
                    : "Your plan is now active. Unlimited sessions are unlocked — start practising below."}
                </p>
              </div>
            </div>
            {!paymentActivating && (
              <button
                onClick={() => setShowPaymentSuccess(false)}
                className="shrink-0 text-emerald-400/50 hover:text-emerald-300"
                aria-label="Dismiss"
              >
                ✕
              </button>
            )}
          </div>
        )}

        <PracticeHero
          totalQuestions={isAdvancedPlan ? totalQuestions : DEFAULT_TOTAL_QUESTIONS}
          canStartInterview={canStartInterview}
          questionLoading={questionLoading}
          setupSummary={setupSummary}
          usageSummary={usageSummary}
          usageLimitReached={signedInLimitReached}
          usageMessage={usageMessage}
          planName={practiceUsage.planName}
          onStartInterview={startInterview}
        />

        {/* Assessment centre upsell — shown for free plan users */}
        {isFreePlan && (
          <div className="mb-6 overflow-hidden rounded-[2rem] border border-cyan-400/20 bg-gradient-to-br from-cyan-500/[0.07] via-purple-500/[0.05] to-transparent shadow-2xl shadow-purple-950/10 backdrop-blur-2xl sm:mb-8">
            <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:gap-10">
              <div className="flex-1">
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300">
                  Professional plan · Mock assessment centre
                </p>
                <h2 className="text-xl font-black leading-tight tracking-[-0.035em] text-white sm:text-2xl">
                  Ready to simulate the full assessment centre?
                </h2>
                <p className="mt-3 text-sm leading-7 text-gray-300">
                  Most graduate and professional roles now include an assessment centre —
                  case study, competency interview, and presentation, all in one session.
                  Practice the full format before the real thing.
                </p>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-400">
                  {["Case study analysis (~12 min)", "Competency interview (~15 min)", "Presentation simulation (~5 min)"].map((s) => (
                    <span key={s} className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-cyan-400" />
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row lg:flex-col">
                <a href="/for-candidates/pricing">
                  <button className="w-full whitespace-nowrap rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-fuchsia-500 px-6 py-3.5 text-sm font-black text-white shadow-lg transition hover:scale-[1.02] sm:w-auto lg:w-full">
                    Upgrade to Professional →
                  </button>
                </a>
                <a href="/for-candidates/assessment-centre">
                  <button className="w-full whitespace-nowrap rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.07] px-6 py-3.5 text-sm font-black text-cyan-100 transition hover:bg-cyan-400/[0.12] sm:w-auto lg:w-full">
                    Learn more
                  </button>
                </a>
              </div>
            </div>
          </div>
        )}

        <div id="interview-setup">
          <PracticeStartScreen
            isLoaded={isLoaded}
            isSignedIn={isSignedIn}
            usageLoaded={usageLoaded}
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
            isFreePlan={isFreePlan}
            isAdvancedPlan={isAdvancedPlan}
            totalQuestions={totalQuestions}
            setTotalQuestions={setTotalQuestions}
            useHybridMix={useHybridMix}
            setUseHybridMix={setUseHybridMix}
            questionMix={questionMix}
            setQuestionMix={setQuestionMix}
            startDisabled={signedInLimitReached}
            startDisabledMessage={usageSummary}
          />
        </div>
      </section>
    </CandidateAppShell>
  );
}