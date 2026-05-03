"use client";

import type { Feedback } from "../types";
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

  return (
    <GlassCard className="mt-6">
      <h2 className="mb-5 text-2xl font-black tracking-[-0.03em] text-white">
        AI Feedback
      </h2>

      {feedback.error ? (
        <p className="text-red-300">{feedback.error}</p>
      ) : (
        <div className="space-y-6">
          <div className="rounded-[1.6rem] border border-white/10 bg-black/35 p-5">
            <p className="text-sm text-gray-400">Overall score</p>
            <p className="mt-1 text-5xl font-black tracking-[-0.05em] text-white">
              {feedback.overall_score}
              <span className="text-xl text-gray-500">/10</span>
            </p>
          </div>

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

          {feedback.section_feedback && (
            <div>
              <h3 className="mb-3 text-lg font-black text-cyan-300">
                Section-by-section feedback
              </h3>
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

          <div>
            <h3 className="mb-3 text-lg font-black text-purple-300">
              Model Answer — 8+/10 Standard
            </h3>
            <div className="rounded-2xl border border-white/10 bg-black/35 p-5 leading-8 text-gray-100">
              {feedback.improved_answer}
            </div>
          </div>

          <button
            onClick={nextStep}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-6 py-4 font-black shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01]"
          >
            {currentQuestionNumber === totalQuestions
              ? "Finish Interview"
              : "Next Question"}
          </button>
        </div>
      )}
    </GlassCard>
  );
}
