"use client";

import Link from "next/link";
import { SignInButton, useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { MarketingShell } from "@/app/components/marketing/MarketingShell";

type CategoryScores = {
  content?: number;
  clarity?: number;
  relevance?: number;
  structure?: number;
  confidence?: number;
};

type SectionFeedbackItem = {
  score?: number;
  feedback?: string;
  improvement?: string;
};

type Feedback = {
  overall_score?: number;
  category_scores?: CategoryScores;
  pace_score?: number;
  section_feedback?: {
    content?: SectionFeedbackItem;
    clarity?: SectionFeedbackItem;
    relevance?: SectionFeedbackItem;
    structure?: SectionFeedbackItem;
    confidence?: SectionFeedbackItem;
    pace?: SectionFeedbackItem;
  };
  strengths?: string[];
  improvements?: string[];
  improved_answer?: string;
  error?: string;
};

type VoiceAnalysis = {
  paceScore?: number;
  fillerScore?: number;
  confidenceScore?: number;
  energyScore?: number;
  clarityScore?: number;
  structureScore?: number;
  overallVoiceScore?: number;
  metrics?: {
    wordCount?: number;
    fillerCount?: number;
    fillerRate?: number;
    hedgeCount?: number;
    estimatedWPM?: number;
    averageSentenceLength?: number;
  };
  feedback?: {
    strengths?: string[];
    improvements?: string[];
  };
  evidence?: {
    fillersDetected?: string[];
    hedgesDetected?: string[];
  };
  error?: string;
};

type VideoAnalysis = {
  overallVideoScore?: number;
  eyeContactScore?: number;
  positionScore?: number;
  bodyLanguageScore?: number;
  expressionScore?: number;
  engagementScore?: number;
  feedback?: {
    strengths?: string[];
    improvements?: string[];
  };
  error?: string;
};

type ResultItem = {
  question?: string;
  answer?: string;
  feedback?: Feedback;
  voiceAnalysis?: VoiceAnalysis | null;
  videoAnalysis?: VideoAnalysis | null;
};

type CategoryBreakdown = {
  content?: number;
  clarity?: number;
  relevance?: number;
  structure?: number;
  confidence?: number;
  pace?: number;
  voice_delivery?: number;
  camera_presence?: number;
};

type SessionSummary = {
  overall_score?: number;
  readiness_score?: number;
  hire_signal?: "Weak" | "Moderate" | "Strong";
  hire_signal_reason?: string;
  category_breakdown?: CategoryBreakdown;
  strongest_answer?: {
    question_number?: number;
    question?: string;
    score?: number;
    reason?: string;
  };
  weakest_answer?: {
    question_number?: number;
    question?: string;
    score?: number;
    reason?: string;
  };
  voice_delivery_summary?: {
    score?: number;
    summary?: string;
    strengths?: string[];
    improvements?: string[];
  };
  camera_delivery_summary?: {
    score?: number;
    summary?: string;
    strengths?: string[];
    improvements?: string[];
  };
  top_strengths?: string[];
  top_improvements?: string[];
  priority_improvements?: string[];
  final_recommendation?: string;
  next_steps?: string[];
  seven_day_action_plan?: {
    day?: string;
    focus?: string;
    task?: string;
  }[];
  error?: string;
};

type SpeakerPreference = {
  voice?: string;
  accent?: string;
  pace?: string;
};

type PracticeSessionDetail = {
  id: string;
  role: string;
  experienceLevel: string;
  interviewType: string;
  difficulty: string;
  focusArea: string;
  practiceMode: string;
  totalQuestions: number;
  overallScore: number;
  hireSignal: string;
  summary?: SessionSummary;
  results?: ResultItem[];
  speakerPreference?: SpeakerPreference | null;
  createdAt: string;
  updatedAt: string;
};

const categoryRows: Array<{
  key: keyof CategoryBreakdown;
  label: string;
}> = [
  { key: "content", label: "Content" },
  { key: "clarity", label: "Clarity" },
  { key: "relevance", label: "Relevance" },
  { key: "structure", label: "Structure" },
  { key: "confidence", label: "Confidence" },
  { key: "pace", label: "Pace" },
  { key: "voice_delivery", label: "Voice delivery" },
  { key: "camera_presence", label: "Camera presence" },
];

export default function PracticeSessionDetailPage() {
  const params = useParams();
  const { isLoaded, isSignedIn } = useUser();

  const rawSessionId = params?.sessionId;
  const sessionId =
    typeof rawSessionId === "string"
      ? rawSessionId
      : Array.isArray(rawSessionId)
        ? rawSessionId[0] || ""
        : "";

  const [session, setSession] = useState<PracticeSessionDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoaded || !isSignedIn || !sessionId) {
      setSession(null);
      setLoading(false);
      setError("");
      return;
    }

    let cancelled = false;

    const loadSession = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`/api/practice-sessions/${sessionId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();

        if (cancelled) return;

        if (!response.ok || data.error) {
          setSession(null);
          setError(data.error || "Could not load this practice session.");
          return;
        }

        setSession(data.session || null);
      } catch {
        if (!cancelled) {
          setSession(null);
          setError("Could not load this practice session.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, sessionId]);

  const results = useMemo(() => {
    return Array.isArray(session?.results) ? session.results : [];
  }, [session]);

  return (
    <MarketingShell currentPath="/progress">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
        {!isLoaded && <SimpleState message="Loading session archive..." />}

        {isLoaded && !isSignedIn && <SignedOutState />}

        {isLoaded && isSignedIn && loading && (
          <SimpleState message="Loading your saved session..." />
        )}

        {isLoaded && isSignedIn && error && <ErrorState message={error} />}

        {isLoaded && isSignedIn && !loading && !error && session && (
          <div className="space-y-6">
            <SessionHero session={session} resultCount={results.length} />

            <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
              <SummaryPanel session={session} />
              <CategoryPanel summary={session.summary} />
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <QuestionArchive results={results} />
              <SessionInsights summary={session.summary} />
            </div>
          </div>
        )}
      </main>
    </MarketingShell>
  );
}

function SessionHero({
  session,
  resultCount,
}: {
  session: PracticeSessionDetail;
  resultCount: number;
}) {
  const speaker = session.speakerPreference;

  return (
    <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-white/[0.065] p-5 shadow-2xl shadow-purple-950/20 backdrop-blur-2xl sm:p-7 lg:p-8">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-28 left-10 h-80 w-80 rounded-full bg-purple-500/15 blur-3xl" />

      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Link href="/progress">
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black text-gray-200 transition hover:bg-white/[0.1]">
                ← Back to progress
              </span>
            </Link>

            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-cyan-100">
              Session archive
            </span>
          </div>

          <h1 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.055em] sm:text-5xl lg:text-6xl">
            {session.role}
          </h1>

          <p className="mt-4 max-w-3xl text-base leading-8 text-gray-300">
            {session.interviewType} · {session.experienceLevel} ·{" "}
            {session.difficulty} difficulty · Focus: {session.focusArea}
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            <SessionPill>{formatSessionDate(session.createdAt)}</SessionPill>
            <SessionPill>{session.practiceMode}</SessionPill>
            <SessionPill>
              {resultCount || session.totalQuestions} questions
            </SessionPill>
            {speaker && (
              <SessionPill>
                {speaker.accent || "British"} {speaker.voice || "female"} voice
                · {speaker.pace || "natural"} pace
              </SessionPill>
            )}
          </div>
        </div>

        <div className="grid min-w-[260px] grid-cols-2 gap-3">
          <ScoreTile label="Overall score" value={`${session.overallScore}/10`} />
          <ScoreTile label="Hire signal" value={session.hireSignal} />
        </div>
      </div>
    </section>
  );
}

function SummaryPanel({ session }: { session: PracticeSessionDetail }) {
  const summary = session.summary;

  return (
    <GlassPanel>
      <PanelHeader
        eyebrow="Final assessment"
        title="Session summary"
        description="The AI coach’s final judgement from this completed interview."
      />

      <div className="mt-6 rounded-[1.6rem] border border-cyan-300/15 bg-cyan-300/10 p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-gray-400">Readiness score</p>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-6xl font-black tracking-[-0.08em] text-white">
                {summary?.readiness_score ||
                  summary?.overall_score ||
                  session.overallScore}
              </span>
              <span className="mb-2 text-lg font-black text-gray-500">/10</span>
            </div>
          </div>

          <span className="w-fit rounded-full border border-emerald-300/20 bg-emerald-300/10 px-4 py-2 text-xs font-black uppercase tracking-[0.14em] text-emerald-100">
            {summary?.hire_signal || session.hireSignal}
          </span>
        </div>

        {summary?.hire_signal_reason && (
          <p className="mt-4 text-sm leading-7 text-gray-300">
            {summary.hire_signal_reason}
          </p>
        )}

        {summary?.final_recommendation && (
          <div className="mt-4 rounded-[1.25rem] border border-white/10 bg-black/25 p-4">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-300">
              Recommendation
            </p>
            <p className="mt-2 text-sm leading-7 text-gray-300">
              {summary.final_recommendation}
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <ListBlock
          title="Top strengths"
          items={
            summary?.top_strengths || [
              "No strengths were saved for this session.",
            ]
          }
          tone="positive"
        />
        <ListBlock
          title="Top improvements"
          items={
            summary?.priority_improvements ||
            summary?.top_improvements || [
              "No improvement priorities were saved for this session.",
            ]
          }
          tone="improve"
        />
      </div>
    </GlassPanel>
  );
}

function CategoryPanel({ summary }: { summary?: SessionSummary }) {
  const breakdown = summary?.category_breakdown || {};

  return (
    <GlassPanel>
      <PanelHeader
        eyebrow="Score breakdown"
        title="Category performance"
        description="Review the areas that shaped this session’s final score."
      />

      <div className="mt-6 space-y-4">
        {categoryRows.map((item) => (
          <CategoryLine
            key={item.key}
            label={item.label}
            value={breakdown[item.key] || 0}
          />
        ))}
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <AnswerSignal
          label="Strongest answer"
          answer={summary?.strongest_answer}
          fallback="No strongest answer was saved."
        />
        <AnswerSignal
          label="Weakest answer"
          answer={summary?.weakest_answer}
          fallback="No weakest answer was saved."
        />
      </div>
    </GlassPanel>
  );
}

function QuestionArchive({ results }: { results: ResultItem[] }) {
  return (
    <GlassPanel>
      <PanelHeader
        eyebrow="Question archive"
        title="Review every answer"
        description="Open each saved answer and compare your response with the coach’s feedback."
      />

      <div className="mt-6 space-y-4">
        {results.length === 0 && (
          <div className="rounded-[1.4rem] border border-white/10 bg-black/25 p-5">
            <p className="text-sm leading-7 text-gray-300">
              No question-level results were saved for this session.
            </p>
          </div>
        )}

        {results.map((item, index) => (
          <QuestionCard
            key={`${item.question || "question"}-${index}`}
            item={item}
            index={index}
          />
        ))}
      </div>
    </GlassPanel>
  );
}

function QuestionCard({ item, index }: { item: ResultItem; index: number }) {
  const feedback = item.feedback;
  const voice = item.voiceAnalysis;
  const video = item.videoAnalysis;

  return (
    <details className="group overflow-hidden rounded-[1.6rem] border border-white/10 bg-black/25">
      <summary className="cursor-pointer list-none p-5 transition hover:bg-white/[0.035]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
              Question {index + 1}
            </p>
            <h3 className="text-lg font-black leading-7 text-white">
              {item.question || "Question not saved."}
            </h3>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1.5 text-xs font-black text-purple-100">
              {feedback?.overall_score || 0}/10
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-xs font-black text-gray-300">
              Open
            </span>
          </div>
        </div>
      </summary>

      <div className="border-t border-white/10 p-5">
        <div className="grid gap-4 lg:grid-cols-2">
          <TextBlock
            title="Candidate answer"
            text={item.answer || "No answer saved."}
          />
          <TextBlock
            title="Improved answer"
            text={feedback?.improved_answer || "No improved answer was saved."}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <ListBlock
            title="Answer strengths"
            items={feedback?.strengths || ["No strengths were saved."]}
            tone="positive"
          />
          <ListBlock
            title="Answer improvements"
            items={feedback?.improvements || ["No improvements were saved."]}
            tone="improve"
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <MiniScore label="Content" value={feedback?.category_scores?.content} />
          <MiniScore label="Clarity" value={feedback?.category_scores?.clarity} />
          <MiniScore
            label="Relevance"
            value={feedback?.category_scores?.relevance}
          />
          <MiniScore
            label="Structure"
            value={feedback?.category_scores?.structure}
          />
          <MiniScore
            label="Confidence"
            value={feedback?.category_scores?.confidence}
          />
          <MiniScore label="Pace" value={feedback?.pace_score} />
        </div>

        {(voice || video) && (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <DeliveryBlock voice={voice || null} />
            <PresenceBlock video={video || null} />
          </div>
        )}
      </div>
    </details>
  );
}

function SessionInsights({ summary }: { summary?: SessionSummary }) {
  return (
    <aside className="space-y-6 xl:sticky xl:top-28 xl:self-start">
      <GlassPanel>
        <PanelHeader
          eyebrow="Next steps"
          title="Action plan"
          description="Use this session to decide what to practise next."
        />

        <div className="mt-6 space-y-3">
          {(
            summary?.next_steps || [
              "Run another practice session and focus on one improvement at a time.",
            ]
          ).map((item, index) => (
            <div
              key={`${item}-${index}`}
              className="rounded-[1.25rem] border border-white/10 bg-black/25 p-4"
            >
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
                Step {index + 1}
              </p>
              <p className="mt-2 text-sm leading-6 text-gray-300">{item}</p>
            </div>
          ))}
        </div>

        <Link href="/practice">
          <button className="mt-5 w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-5 py-3.5 text-sm font-black text-white shadow-2xl shadow-purple-900/30 transition hover:scale-[1.01]">
            Practise this again
          </button>
        </Link>
      </GlassPanel>

      {summary?.seven_day_action_plan &&
        summary.seven_day_action_plan.length > 0 && (
          <GlassPanel>
            <PanelHeader
              eyebrow="7-day plan"
              title="Improvement sprint"
              description="A short plan generated from this interview."
            />

            <div className="mt-6 space-y-3">
              {summary.seven_day_action_plan.map((item, index) => (
                <div
                  key={`${item.day || "day"}-${index}`}
                  className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4"
                >
                  <p className="text-sm font-black text-white">
                    {item.day || `Day ${index + 1}`} ·{" "}
                    {item.focus || "Practice"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-gray-400">
                    {item.task || "Review and refine one answer."}
                  </p>
                </div>
              ))}
            </div>
          </GlassPanel>
        )}
    </aside>
  );
}

function DeliveryBlock({ voice }: { voice: VoiceAnalysis | null }) {
  if (!voice) {
    return <TextBlock title="Voice delivery" text="No voice analysis was saved." />;
  }

  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-black text-white">Voice delivery</p>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs font-black text-cyan-100">
          {voice.overallVoiceScore || 0}/10
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <MiniScore label="Pace" value={voice.paceScore} />
        <MiniScore label="Fillers" value={voice.fillerScore} />
        <MiniScore label="Confidence" value={voice.confidenceScore} />
        <MiniScore label="Energy" value={voice.energyScore} />
      </div>

      <p className="mt-4 text-sm leading-6 text-gray-400">
        Estimated pace: {voice.metrics?.estimatedWPM || 0} WPM · Fillers:{" "}
        {voice.metrics?.fillerCount || 0}
      </p>
    </div>
  );
}

function PresenceBlock({ video }: { video: VideoAnalysis | null }) {
  if (!video) {
    return (
      <TextBlock title="Camera presence" text="No camera analysis was saved." />
    );
  }

  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-black text-white">Camera presence</p>
        <span className="rounded-full border border-purple-300/20 bg-purple-300/10 px-3 py-1 text-xs font-black text-purple-100">
          {video.overallVideoScore || 0}/10
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <MiniScore label="Eye contact" value={video.eyeContactScore} />
        <MiniScore label="Position" value={video.positionScore} />
        <MiniScore label="Body language" value={video.bodyLanguageScore} />
        <MiniScore label="Engagement" value={video.engagementScore} />
      </div>
    </div>
  );
}

function AnswerSignal({
  label,
  answer,
  fallback,
}: {
  label: string;
  answer?: SessionSummary["strongest_answer"];
  fallback: string;
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-purple-300">
        {label}
      </p>
      <p className="mt-2 text-sm font-black text-white">
        {answer?.score ? `${answer.score}/10` : "Not scored"}
      </p>
      <p className="mt-2 text-sm leading-6 text-gray-400">
        {answer?.reason || fallback}
      </p>
    </div>
  );
}

function CategoryLine({ label, value }: { label: string; value: number }) {
  const safeValue = Math.max(0, Math.min(10, Math.round(value * 10) / 10));
  const width = safeValue * 10;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-sm font-black text-white">{label}</p>
        <p className="text-sm font-black text-gray-300">{safeValue}/10</p>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-purple-500 via-fuchsia-400 to-cyan-300 shadow-[0_0_20px_rgba(168,85,247,0.35)]"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
}

function ListBlock({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "positive" | "improve";
}) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
      <p
        className={`text-xs font-black uppercase tracking-[0.18em] ${
          tone === "positive" ? "text-emerald-300" : "text-purple-300"
        }`}
      >
        {title}
      </p>
      <ul className="mt-3 space-y-2">
        {items.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="flex gap-2 text-sm leading-6 text-gray-300"
          >
            <span
              className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${
                tone === "positive" ? "bg-emerald-300" : "bg-purple-300"
              }`}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TextBlock({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] p-4">
      <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-cyan-300">
        {title}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-7 text-gray-300">
        {text}
      </p>
    </div>
  );
}

function MiniScore({ label, value }: { label: string; value?: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/25 p-3">
      <p className="text-xs font-bold text-gray-500">{label}</p>
      <p className="mt-1 text-xl font-black tracking-[-0.03em] text-white">
        {typeof value === "number" ? value : 0}
        <span className="text-xs text-gray-500">/10</span>
      </p>
    </div>
  );
}

function ScoreTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-black/25 p-4 text-center">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black tracking-[-0.04em] text-white">
        {value}
      </p>
    </div>
  );
}

function SessionPill({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-full border border-white/10 bg-white/[0.055] px-3 py-1.5 text-xs font-black text-gray-300">
      {children}
    </span>
  );
}

function GlassPanel({ children }: { children: ReactNode }) {
  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] p-5 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl sm:p-6">
      {children}
    </section>
  );
}

function PanelHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
        {eyebrow}
      </p>
      <h2 className="mt-2 text-2xl font-black tracking-[-0.035em] text-white">
        {title}
      </h2>
      <p className="mt-2 text-sm leading-6 text-gray-400">{description}</p>
    </div>
  );
}

function SignedOutState() {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <p className="text-xs font-black uppercase tracking-[0.2em] text-purple-300">
        Sign in required
      </p>
      <h1 className="mt-3 text-3xl font-black tracking-[-0.045em] text-white">
        Sign in to view saved session details.
      </h1>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-300">
        Your session archive is private and only available to your account.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <SignInButton mode="modal">
          <button className="rounded-2xl bg-white px-6 py-4 text-sm font-black text-black transition hover:bg-purple-100">
            Sign in
          </button>
        </SignInButton>

        <Link href="/practice">
          <button className="rounded-2xl border border-purple-300/20 bg-purple-300/10 px-6 py-4 text-sm font-black text-purple-100 transition hover:bg-purple-300/15">
            Start practice
          </button>
        </Link>
      </div>
    </section>
  );
}

function SimpleState({ message }: { message: string }) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/[0.055] p-6 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <p className="text-sm leading-7 text-gray-300">{message}</p>
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <section className="rounded-[2rem] border border-amber-300/20 bg-amber-300/10 p-6 shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <p className="text-sm font-black text-amber-100">Session could not load</p>
      <p className="mt-2 text-sm leading-7 text-gray-300">{message}</p>

      <Link href="/progress">
        <button className="mt-5 rounded-2xl border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-white transition hover:bg-white/[0.1]">
          Back to progress
        </button>
      </Link>
    </section>
  );
}

function formatSessionDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }

  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}