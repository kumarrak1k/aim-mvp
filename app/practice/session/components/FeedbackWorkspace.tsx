"use client";

import type { Feedback, VideoAnalysis, VoiceAnalysis } from "../../types";

type FeedbackWorkspaceProps = {
  feedback: Feedback;
  voiceAnalysis: VoiceAnalysis | null;
  videoAnalysis: VideoAnalysis | null;
  currentQuestionNumber: number;
  totalQuestions: number;
  onNext: () => void;
};

export function FeedbackWorkspace({
  feedback,
  voiceAnalysis,
  videoAnalysis,
  currentQuestionNumber,
  totalQuestions,
  onNext,
}: FeedbackWorkspaceProps) {
  const nextLabel =
    currentQuestionNumber >= totalQuestions ? "Finish interview" : "Next question";

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.055] shadow-2xl shadow-purple-950/10 backdrop-blur-2xl">
      <div className="p-4 sm:p-5 lg:p-6">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-300">
              AI feedback
            </p>
            <h2 className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">
              {feedback.overall_score}/10
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-400">
              Structured answer review, delivery insight, and a stronger model answer.
            </p>
          </div>

          <button
            type="button"
            onClick={onNext}
            className="rounded-2xl bg-white px-6 py-3 text-sm font-black text-black shadow-xl shadow-purple-950/20 transition hover:bg-purple-100"
          >
            {nextLabel}
          </button>
        </div>

        {feedback.error && (
          <div className="mb-5 rounded-2xl border border-amber-300/20 bg-amber-300/10 p-4 text-sm leading-6 text-amber-100">
            {feedback.error}
          </div>
        )}

        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <ScoreCard label="Overall" value={feedback.overall_score} highlight />
          <ScoreCard label="Content" value={feedback.category_scores.content} />
          <ScoreCard label="Clarity" value={feedback.category_scores.clarity} />
          <ScoreCard label="Relevance" value={feedback.category_scores.relevance} />
          <ScoreCard label="Structure" value={feedback.category_scores.structure} />
          <ScoreCard
            label="Confidence"
            value={feedback.category_scores.confidence}
          />
        </div>

        {(voiceAnalysis || videoAnalysis) && (
          <div className="mb-5 grid gap-3 md:grid-cols-2">
            <InsightBox
              title="Voice delivery insight"
              accent="cyan"
              body={
                voiceAnalysis
                  ? `Voice score ${voiceAnalysis.overallVoiceScore}/10. Pace ${voiceAnalysis.paceScore}/10, confidence ${voiceAnalysis.confidenceScore}/10 and filler control ${voiceAnalysis.fillerScore}/10.`
                  : "Voice insight will appear here once analysis is available."
              }
            />
            <InsightBox
              title="Camera presence insight"
              accent="purple"
              body={
                videoAnalysis
                  ? `Camera score ${videoAnalysis.overallVideoScore}/10. Eye contact ${videoAnalysis.eyeContactScore}/10 and engagement ${videoAnalysis.engagementScore}/10.`
                  : "Camera insight will appear here once analysis is available."
              }
            />
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <FeedbackList title="Strengths" items={feedback.strengths} />
          <FeedbackList title="Improvements" items={feedback.improvements} />
        </div>

        {feedback.improved_answer && (
          <div className="mt-5 rounded-[1.5rem] border border-cyan-300/15 bg-cyan-300/10 p-5">
            <p className="mb-3 text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
              Stronger answer example
            </p>
            <p className="whitespace-pre-wrap text-sm leading-7 text-gray-100">
              {feedback.improved_answer}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onNext}
            className="rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-7 py-4 text-sm font-black text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01]"
          >
            {nextLabel}
          </button>
        </div>
      </div>
    </section>
  );
}

function ScoreCard({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.25rem] border p-4 ${
        highlight
          ? "border-cyan-300/20 bg-cyan-300/10"
          : "border-white/10 bg-black/25"
      }`}
    >
      <p className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black text-white">
        {value}
        <span className="text-sm text-gray-500">/10</span>
      </p>
    </div>
  );
}

function InsightBox({
  title,
  accent,
  body,
}: {
  title: string;
  accent: "cyan" | "purple";
  body: string;
}) {
  return (
    <div
      className={`rounded-[1.35rem] border p-4 ${
        accent === "cyan"
          ? "border-cyan-300/20 bg-cyan-300/10"
          : "border-purple-300/20 bg-purple-300/10"
      }`}
    >
      <p
        className={`text-sm font-black ${
          accent === "cyan" ? "text-cyan-100" : "text-purple-100"
        }`}
      >
        {title}
      </p>
      <p className="mt-2 text-sm leading-6 text-gray-100">{body}</p>
    </div>
  );
}

export function FeedbackList({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-black/25 p-5">
      <p className="mb-4 text-sm font-black uppercase tracking-[0.18em] text-purple-200">
        {title}
      </p>
      <div className="space-y-3">
        {items.length ? (
          items.map((item) => (
            <p key={item} className="text-sm leading-6 text-gray-300">
              • {item}
            </p>
          ))
        ) : (
          <p className="text-sm leading-6 text-gray-500">No items yet.</p>
        )}
      </div>
    </div>
  );
}