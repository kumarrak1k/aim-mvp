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
      <div className="mb-7 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-sm font-bold tracking-wide text-purple-300">
            Final report
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">
            Your interview readiness summary.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-gray-400 md:text-base">
            Review your final score, hire signal, strongest patterns and the
            priority actions that will improve your next practice session.
          </p>
        </div>

        {summary && (
          <div className="rounded-[1.5rem] border border-emerald-300/20 bg-emerald-300/10 p-4 text-center shadow-xl shadow-emerald-950/10 lg:min-w-[180px]">
            <p className="text-xs font-bold tracking-wide text-emerald-200">
              Hire signal
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-emerald-100">
              {summary.hire_signal}
            </p>
          </div>
        )}
      </div>

      {summaryLoading && (
        <div className="rounded-[1.6rem] border border-cyan-300/15 bg-cyan-300/10 p-5">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-3 w-3 animate-pulse rounded-full bg-cyan-300" />
            <p className="font-bold text-cyan-100">Generating report...</p>
          </div>
          <p className="text-sm leading-6 text-gray-300">
            The coach is combining answer scores, delivery signals and improvement
            themes into your final interview summary.
          </p>
        </div>
      )}

      {summary && (
        <div className="space-y-7">
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[1.7rem] border border-white/10 bg-black/35 p-5 shadow-xl shadow-black/10">
              <p className="text-sm font-semibold text-gray-400">Final score</p>
              <p className="mt-2 text-5xl font-bold tracking-tight text-white md:text-7xl">
                {summary.overall_score}
                <span className="text-2xl text-gray-500">/10</span>
              </p>
              <p className="mt-3 text-sm font-bold text-gray-400">
                {scoreSummary(summary.overall_score)}
              </p>
            </div>

            <div className="rounded-[1.7rem] border border-purple-300/20 bg-purple-300/10 p-5 shadow-xl shadow-purple-950/10">
              <p className="text-sm font-bold tracking-wide text-purple-200">
                Hiring interpretation
              </p>
              <p className="mt-3 text-2xl font-bold tracking-tight text-white">
                {summary.hire_signal} readiness signal
              </p>
              <p className="mt-3 text-sm leading-7 text-gray-300">
                {summary.hire_signal_reason || summary.final_recommendation}
              </p>

              {typeof summary.readiness_score === "number" && (
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 p-4">
                  <div className="mb-2 flex items-center justify-between text-sm font-bold">
                    <span className="text-gray-400">Interview readiness</span>
                    <span className="text-white">{summary.readiness_score}/10</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-400 via-fuchsia-300 to-cyan-300 shadow-[0_0_20px_rgba(168,85,247,0.45)]"
                      style={{ width: `${Math.max(0, Math.min(100, summary.readiness_score * 10))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {summary.category_breakdown && (
            <div className="rounded-[1.7rem] border border-white/10 bg-black/25 p-5">
              <div className="mb-4 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
                <div>
                  <h3 className="text-lg font-bold text-cyan-300">
                    Category breakdown
                  </h3>
                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    The strongest candidates improve both answer content and
                    delivery presence.
                  </p>
                </div>
              </div>

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

          <div className="grid gap-4 lg:grid-cols-2">
            <ReportListCard
              title="Top strengths"
              color="text-blue-300"
              items={summary.top_strengths}
              tone="blue"
            />

            <ReportListCard
              title="Top improvements"
              color="text-orange-300"
              items={summary.top_improvements}
              tone="orange"
            />
          </div>

          {summary.priority_improvements && (
            <div className="rounded-[1.7rem] border border-purple-300/20 bg-purple-300/10 p-5">
              <h3 className="mb-3 text-lg font-bold text-purple-200">
                Priority improvement plan
              </h3>
              <p className="mb-4 text-sm leading-6 text-gray-400">
                Focus on these first. They are the highest-leverage changes for
                the next session.
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {summary.priority_improvements.map((item, index) => (
                  <div
                    key={`${item}-${index}`}
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <p className="mb-2 text-xs font-bold tracking-wide text-purple-200/70">
                      Priority {index + 1}
                    </p>
                    <p className="text-sm font-semibold leading-6 text-gray-100">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-[1.7rem] border border-white/10 bg-black/30 p-5">
            <h3 className="mb-2 text-lg font-bold text-purple-300">
              Final recommendation
            </h3>
            <p className="leading-8 text-gray-100">
              {summary.final_recommendation}
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-[1.7rem] border border-cyan-300/20 bg-cyan-300/10 p-5">
              <FeedbackList
                title="Next steps"
                color="text-cyan-300"
                items={summary.next_steps}
              />
            </div>

            {summary.seven_day_action_plan ? (
              <div className="rounded-[1.7rem] border border-white/10 bg-black/25 p-5">
                <h3 className="mb-4 text-lg font-bold text-purple-300">
                  7-day action plan
                </h3>
                <div className="grid gap-3">
                  {summary.seven_day_action_plan.map((day) => (
                    <div
                      key={day.day}
                      className="rounded-2xl border border-white/10 bg-black/35 p-4"
                    >
                      <p className="font-bold text-white">
                        {day.day}: {day.focus}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-gray-400">
                        {day.task}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-[1.7rem] border border-white/10 bg-black/25 p-5">
                <h3 className="mb-2 text-lg font-bold text-purple-300">
                  Suggested next session
                </h3>
                <p className="text-sm leading-7 text-gray-400">
                  Run another five-question practice session with the same role,
                  but focus on your top improvement area first.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-[1.7rem] border border-purple-300/20 bg-gradient-to-r from-purple-500/15 via-fuchsia-500/10 to-cyan-500/15 p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-lg font-bold text-white">
                  Ready to practise again?
                </p>
                <p className="mt-1 text-sm leading-6 text-gray-400">
                  Repeat the interview after reviewing your priorities to see if
                  the readiness score improves.
                </p>
              </div>

              <button
                onClick={resetInterview}
                className="w-full rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 font-bold shadow-2xl shadow-purple-900/35 transition hover:scale-[1.01] lg:w-auto lg:min-w-[230px]"
              >
                Start new interview
              </button>
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
}

function ReportListCard({
  title,
  color,
  items,
  tone,
}: {
  title: string;
  color: string;
  items: string[];
  tone: "blue" | "orange";
}) {
  return (
    <div
      className={`rounded-[1.7rem] border p-5 ${
        tone === "blue"
          ? "border-blue-300/20 bg-blue-300/10"
          : "border-orange-300/20 bg-orange-300/10"
      }`}
    >
      <FeedbackList title={title} color={color} items={items} />
    </div>
  );
}

function scoreSummary(score: number) {
  if (score >= 8) return "Strong interview performance";
  if (score >= 6) return "Promising, with clear areas to sharpen";
  if (score >= 4) return "Developing; focus on structure and evidence";
  return "Needs significant practice before a high-stakes interview";
}
