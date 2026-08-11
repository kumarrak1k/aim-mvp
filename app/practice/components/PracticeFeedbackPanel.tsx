"use client";

import type { Feedback } from "../types";
import { StarAnswer } from "@/app/components/StarAnswer";
import {
  FeedbackList,
  GlassCard,
  ScoreCard,
  SectionFeedbackCard,
} from "./PracticeUi";

type PracticeFeedbackPanelProps = {
  feedback: Feedback | null;
  currentQuestionNumber: number;
  totalQuestions: number;
  paceFallbackScore: number;
  nextStep: () => void;
};

export function PracticeFeedbackPanel({
  feedback,
  currentQuestionNumber,
  totalQuestions,
  paceFallbackScore,
  nextStep,
}: PracticeFeedbackPanelProps) {
  if (!feedback) return null;

  const isFinalQuestion = currentQuestionNumber === totalQuestions;

  return (
    <GlassCard className="mt-6">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold tracking-wide text-purple-300">
            AI feedback
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white md:text-3xl">
            Turn this answer into a stronger interview response.
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-400">
            Review your score, understand what worked, then use the improvement
            guidance and model answer before moving on.
          </p>
        </div>

        {!feedback.error && (
          <div className="rounded-[1.35rem] border border-white/10 bg-black/30 p-4 text-center shadow-xl shadow-black/10 lg:min-w-[170px]">
            <p className="text-xs font-bold tracking-wide text-gray-400">
              Overall score
            </p>
            <p className="mt-2 text-4xl font-bold tracking-tight text-white">
              {feedback.overall_score}
              <span className="text-xl text-gray-400">/10</span>
            </p>
            <p className="mt-2 text-xs font-bold text-gray-400">
              {scoreLabel(feedback.overall_score)}
            </p>
          </div>
        )}
      </div>

      {feedback.error ? (
        <div className="rounded-2xl border border-red-300/15 bg-red-300/10 p-5">
          <p className="font-bold text-red-200">Feedback error</p>
          <p className="mt-2 text-sm leading-6 text-red-100/80">
            {feedback.error}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <ScoreCard label="Content" value={feedback.category_scores.content} />
            <ScoreCard label="Clarity" value={feedback.category_scores.clarity} />
            <ScoreCard
              label="Relevance"
              value={feedback.category_scores.relevance}
            />
            <ScoreCard
              label="Structure"
              value={feedback.category_scores.structure}
            />
            <ScoreCard
              label="Confidence"
              value={feedback.category_scores.confidence}
            />
            <ScoreCard
              label="Pace"
              value={feedback.pace_score ?? paceFallbackScore ?? 0}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
            <FeedbackSummaryCard
              title="What to keep"
              tone="positive"
              items={feedback.strengths}
              fallback="You have a usable foundation. Keep the clearest parts of the answer and make them more specific."
            />

            <FeedbackSummaryCard
              title="What to improve next"
              tone="improve"
              items={feedback.improvements}
              fallback="Add clearer structure, stronger evidence and a more measurable result."
            />
          </div>

          {feedback.section_feedback && (
            <div className="rounded-[1.6rem] border border-white/10 bg-black/25 p-4 sm:p-5">
              <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <h3 className="text-lg font-bold text-cyan-300">
                    Section-by-section coaching
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-400">
                    Use this to identify the exact part of the answer that needs
                    the next improvement.
                  </p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SectionFeedbackCard
                  title="Content"
                  item={feedback.section_feedback.content}
                />
                <SectionFeedbackCard
                  title="Clarity"
                  item={feedback.section_feedback.clarity}
                />
                <SectionFeedbackCard
                  title="Relevance"
                  item={feedback.section_feedback.relevance}
                />
                <SectionFeedbackCard
                  title="Structure"
                  item={feedback.section_feedback.structure}
                />
                <SectionFeedbackCard
                  title="Confidence"
                  item={feedback.section_feedback.confidence}
                />
                <SectionFeedbackCard
                  title="Pace"
                  item={feedback.section_feedback.pace}
                />
              </div>
            </div>
          )}

          <div className="rounded-[1.6rem] border border-purple-300/20 bg-purple-300/10 p-5">
            <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-lg font-bold text-purple-200">
                  Model answer (8+/10 standard)
                </h3>
                <p className="mt-1 text-sm leading-6 text-gray-400">
                  Compare this with your own response. Notice the structure,
                  specificity and result language.
                </p>
              </div>
              <span className="w-fit rounded-full border border-purple-200/25 bg-purple-200/10 px-3 py-1.5 text-xs font-bold text-purple-100">
                Benchmark answer
              </span>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
              <StarAnswer
                star={feedback.improved_answer_star}
                fallbackText={feedback.improved_answer}
              />
            </div>
          </div>

          <div className="rounded-[1.6rem] border border-white/10 bg-black/25 p-5">
            <div className="mb-4 grid gap-4 md:grid-cols-2">
              <FeedbackList
                title="Strengths"
                color="text-blue-300"
                items={feedback.strengths}
              />

              <FeedbackList
                title="Improvements"
                color="text-orange-300"
                items={feedback.improvements}
              />
            </div>
          </div>

          <button
            onClick={nextStep}
            className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 font-bold shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01]"
          >
            {isFinalQuestion ? "Finish interview and view report" : "Next question"}
          </button>
        </div>
      )}
    </GlassCard>
  );
}

function FeedbackSummaryCard({
  title,
  tone,
  items,
  fallback,
}: {
  title: string;
  tone: "positive" | "improve";
  items: string[];
  fallback: string;
}) {
  const firstItem = items?.[0] || fallback;

  return (
    <div
      className={`rounded-[1.5rem] border p-5 ${
        tone === "positive"
          ? "border-blue-300/20 bg-blue-300/10"
          : "border-orange-300/20 bg-orange-300/10"
      }`}
    >
      <p
        className={`mb-2 text-sm font-bold tracking-wide ${
          tone === "positive" ? "text-blue-300" : "text-orange-300"
        }`}
      >
        {title}
      </p>
      <p className="text-sm font-semibold leading-7 text-gray-100">
        {firstItem}
      </p>
    </div>
  );
}

function scoreLabel(score: number) {
  if (score >= 8) return "Strong answer";
  if (score >= 6) return "Good base";
  if (score >= 4) return "Needs sharpening";
  return "Rebuild needed";
}
