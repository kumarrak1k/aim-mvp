"use client";

import { useEffect, useRef } from "react";

/**
 * Asked before leaving an interview.
 *
 * Leaving used to discard everything silently, which is how candidates ended
 * up with nothing on My Progress after ten minutes of work. Now the answers
 * are already saved, so this explains what happens next and offers to score
 * what they have done.
 */
type ExitInterviewDialogProps = {
  open: boolean;
  answeredCount: number;
  totalQuestions: number;
  busy?: boolean;
  onSaveAndExit: () => void;
  onFinishNow: () => void;
  onDiscard: () => void;
  onCancel: () => void;
};

export function ExitInterviewDialog({
  open,
  answeredCount,
  totalQuestions,
  busy,
  onSaveAndExit,
  onFinishNow,
  onDiscard,
  onCancel,
}: ExitInterviewDialogProps) {
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const hasAnswers = answeredCount > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="exit-interview-title"
        tabIndex={-1}
        className="my-auto w-full max-w-md rounded-[1.5rem] border border-white/10 bg-background p-5 shadow-2xl outline-none sm:p-6"
      >
        <h2 id="exit-interview-title" className="text-lg font-bold text-white">
          Leave this interview?
        </h2>
        <p className="mt-2 text-sm leading-6 text-gray-400">
          {hasAnswers
            ? `You have answered ${answeredCount} of ${totalQuestions} questions. Your answers and feedback are saved, so you can pick up where you left off.`
            : "You have not answered a question yet, so there is nothing to save."}
        </p>

        <div className="mt-5 flex flex-col gap-2">
          {hasAnswers && (
            <>
              <button
                type="button"
                onClick={onFinishNow}
                disabled={busy}
                data-testid="exit-finish-now"
                className="min-h-[44px] rounded-2xl bg-gradient-to-r from-violet-600 to-purple-600 px-5 py-3 text-sm font-bold text-on-accent transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Finish and see my results
              </button>
              <button
                type="button"
                onClick={onSaveAndExit}
                disabled={busy}
                data-testid="exit-save"
                className="min-h-[44px] rounded-2xl border border-white/[0.14] bg-white/[0.05] px-5 py-3 text-sm font-bold text-white transition hover:bg-white/[0.09] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Save and carry on later
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onDiscard}
            disabled={busy}
            data-testid="exit-discard"
            className="min-h-[44px] rounded-2xl border border-white/[0.08] px-5 py-3 text-sm font-bold text-gray-300 transition hover:bg-white/[0.05] hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {hasAnswers ? "Discard this interview" : "Leave without saving"}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] rounded-2xl px-5 py-3 text-sm font-bold text-gray-400 transition hover:text-white"
          >
            Keep practising
          </button>
        </div>
      </div>
    </div>
  );
}
