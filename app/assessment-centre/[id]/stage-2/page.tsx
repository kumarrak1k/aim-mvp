"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { CandidateAppShell } from "@/app/components/marketing/CandidateAppShell";
import { StageProgress } from "@/app/assessment-centre/components/StageProgress";
import { PRACTICE_SESSION_CONFIG_KEY } from "@/app/practice/session/utils";

type Session = {
  id: string;
  status: string;
  currentStage: number;
  role: string;
  sector: string;
  experienceLevel: string;
};

type PracticeMode = "typed" | "voice" | "voice-camera";

const modeOptions: { value: PracticeMode; label: string; desc: string; icon: string }[] = [
  { value: "typed", label: "Typed answers", desc: "Type your answers. Great for lower-distraction environments.", icon: "⌨️" },
  { value: "voice", label: "Voice interview", desc: "Speak your answers. AI scores your delivery and content.", icon: "🎤" },
  { value: "voice-camera", label: "Voice + camera", desc: "Full simulation with voice and video presence scoring.", icon: "📹" },
];

export default function Stage2Page() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();

  const [session, setSession] = useState<Session | null>(null);
  const [loadError, setLoadError] = useState("");
  const [mode, setMode] = useState<PracticeMode>("typed");

  useEffect(() => {
    fetch(`/api/assessment-centre/${id}`)
      .then((r) => r.json())
      .then((data: Session) => {
        if (data.status === "stage1" || data.currentStage < 2) {
          router.replace(`/assessment-centre/${id}/stage-1`);
          return;
        }
        if (data.status === "stage3" || data.currentStage > 2) {
          router.replace(`/assessment-centre/${id}/stage-3`);
          return;
        }
        if (data.status === "complete") {
          router.replace(`/assessment-centre/${id}/report`);
          return;
        }
        setSession(data);
      })
      .catch(() => setLoadError("Failed to load your session. Please refresh."));
  }, [id, router]);

  function handleStart() {
    if (!session) return;

    window.sessionStorage.setItem(
      PRACTICE_SESSION_CONFIG_KEY,
      JSON.stringify({
        role: session.role,
        experienceLevel: session.experienceLevel,
        interviewType: "Competency / behavioural",
        difficulty: "Standard",
        focusArea: "Balanced",
        speakerEnabled: mode !== "typed",
        cameraEnabled: mode === "voice-camera",
        speakerPreference: { voice: "female", accent: "british", pace: "natural" },
        freePlan: false,
        practiceMode: mode,
        createdAt: new Date().toISOString(),
        assessmentCentreId: id,
      })
    );

    router.push("/practice/session");
  }

  if (loadError) {
    return (
      <CandidateAppShell currentPath="/assessment-centre">
        <div className="flex min-h-[50vh] items-center justify-center">
          <p className="text-red-400">{loadError}</p>
        </div>
      </CandidateAppShell>
    );
  }

  if (!session) {
    return (
      <CandidateAppShell currentPath="/assessment-centre">
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <svg className="h-8 w-8 animate-spin text-purple-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-sm text-gray-500">Loading Stage 2…</p>
          </div>
        </div>
      </CandidateAppShell>
    );
  }

  return (
    <CandidateAppShell currentPath="/assessment-centre">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:py-14">
        <StageProgress currentStage={2} />

        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-400/25 bg-fuchsia-400/[0.07] px-4 py-2 text-[11px] font-black uppercase tracking-[0.18em] text-fuchsia-200">
            Stage 2 of 3
          </div>
          <h1 className="text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
            Competency{" "}
            <span className="bg-gradient-to-r from-fuchsia-300 to-purple-300 bg-clip-text text-transparent">
              Interview
            </span>
          </h1>
          <p className="mt-3 text-base leading-7 text-gray-400">
            You&apos;ll answer 5 competency questions tailored to your role as{" "}
            <strong className="text-white">{session.role}</strong> in the{" "}
            <strong className="text-white">{session.sector}</strong> sector. This stage uses
            the same AI coaching engine as your interview practice, with voice and camera
            scoring if you choose.
          </p>
        </div>

        {/* What to expect */}
        <div className="mb-6 rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-5 backdrop-blur-xl">
          <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">
            What to expect
          </p>
          <ul className="space-y-2.5">
            {[
              "5 competency questions generated for your specific role and level",
              "Full AI feedback on every answer — content, structure and delivery",
              "Your overall interview score feeds into your final assessment centre report",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-gray-300">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-fuchsia-400/20 text-[10px] font-black text-fuchsia-400">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Mode selection */}
        <div className="mb-6 rounded-[1.75rem] border border-white/[0.07] bg-white/[0.04] p-5 backdrop-blur-xl">
          <p className="mb-4 text-[11px] font-black uppercase tracking-[0.22em] text-gray-500">
            Choose your mode
          </p>
          <div className="space-y-2.5">
            {modeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setMode(opt.value)}
                className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left transition-all ${
                  mode === opt.value
                    ? "border-fuchsia-400/50 bg-fuchsia-400/10 ring-1 ring-fuchsia-400/30"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]"
                }`}
              >
                <span className="text-2xl">{opt.icon}</span>
                <div>
                  <div className={`text-sm font-black ${mode === opt.value ? "text-fuchsia-200" : "text-white"}`}>
                    {opt.label}
                  </div>
                  <div className="text-xs text-gray-500">{opt.desc}</div>
                </div>
                {mode === opt.value && (
                  <div className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-fuchsia-400 text-[10px] text-black font-black">
                    ✓
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div className="mb-8 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.05] px-4 py-3 text-xs text-cyan-300/80">
          <strong className="font-black">Tip:</strong> Answer each question fully. The AI adapts
          follow-up questions based on your responses, just like a real interviewer.
        </div>

        <button
          onClick={handleStart}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 px-8 py-5 text-base font-black text-white shadow-2xl shadow-purple-900/40 transition hover:scale-[1.015]"
        >
          Start interview →
        </button>

        <p className="mt-3 text-center text-xs text-gray-600">
          ~15 minutes · 5 questions · AI feedback on every answer
        </p>
      </div>
    </CandidateAppShell>
  );
}
