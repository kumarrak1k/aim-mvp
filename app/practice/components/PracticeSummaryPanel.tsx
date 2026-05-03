"use client";

import type { InterviewSummary } from "../types";
import { FeedbackList, GlassCard, ScoreCard } from "./PracticeUi";

type PracticeSummaryPanelProps = {
  summaryLoading: boolean;
  summary: InterviewSummary | null;
  resetInterview: () => void;
};

export function PracticeSummaryPanel({
  summaryLoading,
  summary,
  resetInterview,
}: PracticeSummaryPanelProps) {
  return (
    <GlassCard>
      <h2 className="mb-5 text-3xl font-black tracking-[-0.04em]">
        Final Interview Summary
      </h2>

      {summaryLoading && <p className="text-gray-400">Generating summary...</p>}

      {summary && (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
              <p className="text-sm text-gray-400">Final score</p>
              <p className="mt-1 text-5xl font-black tracking-[-0.05em]">
                {summary.overall_score}
                <span className="text-xl text-gray-500">/10</span>
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 p-5">
              <p className="text-sm text-gray-400">Hire signal</p>
              <p className="mt-3 text-3xl font-black text-green-300">
                {summary.hire_signal}
              </p>
            </div>
          </div>

          {typeof summary.readiness_score === "number" && (
            <div className="rounded-2xl border border-purple-300/20 bg-purple-300/10 p-5">
              <p className="text-sm text-gray-400">Interview readiness</p>
              <p className="mt-1 text-4xl font-black tracking-[-0.05em]">
                {summary.readiness_score}
                <span className="text-lg text-gray-500">/10</span>
              </p>
              {summary.hire_signal_reason && (
                <p className="mt-3 leading-7 text-gray-300">
                  {summary.hire_signal_reason}
                </p>
              )}
            </div>
          )}

          {summary.category_breakdown && (
            <div>
              <h3 className="mb-3 text-lg font-black text-cyan-300">
                Category Breakdown
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ScoreCard
                  label="Content"
                  value={summary.category_breakdown.content}
                />
                <ScoreCard
                  label="Clarity"
                  value={summary.category_breakdown.clarity}
                />
                <ScoreCard
                  label="Relevance"
                  value={summary.category_breakdown.relevance}
                />
                <ScoreCard
                  label="Structure"
                  value={summary.category_breakdown.structure}
                />
                <ScoreCard
                  label="Confidence"
                  value={summary.category_breakdown.confidence}
                />
                <ScoreCard label="Pace" value={summary.category_breakdown.pace} />
                <ScoreCard
                  label="Voice"
                  value={summary.category_breakdown.voice_delivery}
                />
                <ScoreCard
                  label="Camera"
                  value={summary.category_breakdown.camera_presence}
                />
              </div>
            </div>
          )}

          <FeedbackList
            title="Top Strengths"
            color="text-blue-300"
            items={summary.top_strengths}
          />

          <FeedbackList
            title="Top Improvements"
            color="text-orange-300"
            items={summary.top_improvements}
          />

          {summary.priority_improvements && (
            <FeedbackList
              title="Top 3 Priority Improvements"
              color="text-purple-300"
              items={summary.priority_improvements}
            />
          )}

          <div>
            <h3 className="mb-2 text-lg font-black text-purple-300">
              Final Recommendation
            </h3>
            <p className="leading-8 text-gray-100">
              {summary.final_recommendation}
            </p>
          </div>

          <FeedbackList
            title="Next Steps"
            color="text-cyan-300"
            items={summary.next_steps}
          />

          {summary.seven_day_action_plan && (
            <div>
              <h3 className="mb-3 text-lg font-black text-purple-300">
                7-Day Action Plan
              </h3>
              <div className="grid gap-3 md:grid-cols-2">
                {summary.seven_day_action_plan.map((day) => (
                  <div
                    key={day.day}
                    className="rounded-2xl border border-white/10 bg-black/35 p-4"
                  >
                    <p className="font-black text-white">
                      {day.day}: {day.focus}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-gray-400">
                      {day.task}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={resetInterview}
            className="w-full rounded-2xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-500 px-6 py-4 font-black shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01]"
          >
            Start New Interview
          </button>
        </div>
      )}
    </GlassCard>
  );
}
