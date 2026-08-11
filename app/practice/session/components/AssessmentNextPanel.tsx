"use client";

/**
 * Replaces the FeedbackWorkspace for candidates taking a company-issued
 * assessment. Confirms the answer was recorded and moves them to the next
 * question without exposing scores or improvement notes — that information
 * still gets generated and stored, just for the company to review.
 */
type AssessmentNextPanelProps = {
  currentQuestionNumber: number;
  totalQuestions: number;
  onNext: () => void;
  /** True while the next-question fetch / final-summary save is in flight. */
  busy: boolean;
};

export function AssessmentNextPanel({
  currentQuestionNumber,
  totalQuestions,
  onNext,
  busy,
}: AssessmentNextPanelProps) {
  const isFinalQuestion = currentQuestionNumber >= totalQuestions;
  const buttonLabel = isFinalQuestion
    ? busy
      ? "Submitting your assessment..."
      : "Submit assessment →"
    : busy
      ? "Loading next question..."
      : "Continue to next question →";

  return (
    <section className="overflow-hidden rounded-[1.6rem] border border-emerald-300/20 bg-emerald-300/[0.06] p-6 shadow-2xl shadow-emerald-950/10 backdrop-blur-2xl sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-4">
          {/* Tick badge */}
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-cyan-400 text-2xl font-bold text-[#0b1a17] shadow-lg shadow-emerald-900/40">
            ✓
          </div>

          <div className="min-w-0">
            <p className="text-[12px] font-bold tracking-wide text-emerald-200">
              Answer recorded
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">
              {isFinalQuestion
                ? "That was your final answer."
                : `Question ${currentQuestionNumber} of ${totalQuestions} submitted.`}
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-300">
              {isFinalQuestion
                ? "Your full set of answers will now be sent to the hiring team for review. They will assess your responses and follow up directly."
                : "Your answer has been captured. The hiring team will review it later, so continue when you are ready."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNext}
          disabled={busy}
          className="shrink-0 rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-4 text-sm font-bold text-white shadow-2xl shadow-purple-900/35 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60 sm:px-7"
        >
          {buttonLabel}
        </button>
      </div>

      {!isFinalQuestion && (
        <p className="mt-6 border-t border-white/[0.06] pt-4 text-xs leading-5 text-gray-400">
          You will not see scores or feedback during this assessment. Your
          answers are reviewed by the hiring team, not by you.
        </p>
      )}
    </section>
  );
}
