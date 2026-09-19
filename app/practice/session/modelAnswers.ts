import type { Feedback } from "../types";

/**
 * Model answers arrive after the scores, and that gap used to lose them.
 *
 * Scoring and the model answer are fetched in parallel, and the scores come
 * back first. The session saved each answer the moment the candidate moved
 * on, copying the feedback as it stood, so whatever had not arrived yet was
 * never recorded. A one-way video interview moves on as soon as the scores
 * are in (its feedback is hidden until the end), so every question lost its
 * model answer; a coaching interview lost it whenever someone clicked Next
 * quickly; and the last question always lost it, because the report is built
 * the instant it is answered.
 *
 * The fix is to keep hold of each in-flight model answer until the report is
 * written: patch it into the results whenever it lands, and wait a bounded
 * time for any still outstanding before the summary is saved.
 */

export type ModelAnswer = {
  improved_answer: string;
  improved_answer_star: Feedback["improved_answer_star"] | null;
};

type WithFeedback = {
  question: string;
  feedback: {
    improved_answer: string;
    improved_answer_star?: unknown;
    model_answer_loading?: boolean;
  };
};

/**
 * Put a model answer into the result for its question. Never replaces one that
 * is already there, and returns the same array when nothing changed.
 */
export function applyModelAnswer<T extends WithFeedback>(
  results: T[],
  question: string,
  modelAnswer: ModelAnswer
): T[] {
  let changed = false;
  const next = results.map((result) => {
    if (result.question !== question || result.feedback.improved_answer) return result;
    changed = true;
    return {
      ...result,
      feedback: {
        ...result.feedback,
        improved_answer: modelAnswer.improved_answer,
        improved_answer_star: modelAnswer.improved_answer_star ?? null,
        model_answer_loading: false,
      },
    };
  });
  return changed ? next : results;
}

/** Stop any still-pending placeholder: the report should not say "loading". */
function settle<T extends WithFeedback>(results: T[]): T[] {
  return results.map((result) =>
    result.feedback.model_answer_loading
      ? { ...result, feedback: { ...result.feedback, model_answer_loading: false } }
      : result
  );
}

export function createModelAnswerTracker() {
  const pending = new Map<string, Promise<ModelAnswer | null>>();

  return {
    /** Remember the model answer being fetched for a question. */
    track(question: string, answer: Promise<ModelAnswer>) {
      pending.set(
        question,
        answer.catch(() => null)
      );
    },

    /**
     * Fill in every model answer that has arrived, waiting up to `timeoutMs`
     * for the ones still in flight. A slow or failed answer leaves that
     * question without one rather than holding the report back.
     */
    async complete<T extends WithFeedback>(results: T[], timeoutMs: number): Promise<T[]> {
      const missing = results.filter(
        (result) => !result.feedback.improved_answer && pending.has(result.question)
      );

      let timer: ReturnType<typeof setTimeout> | undefined;
      const deadline = new Promise<"timeout">((resolve) => {
        timer = setTimeout(() => resolve("timeout"), timeoutMs);
      });

      let completed = results;
      await Promise.race([
        Promise.all(
          missing.map(async (result) => {
            const answer = await pending.get(result.question);
            if (answer?.improved_answer) {
              completed = applyModelAnswer(completed, result.question, answer);
            }
          })
        ),
        deadline,
      ]);
      clearTimeout(timer);

      return settle(completed);
    },

    clear() {
      pending.clear();
    },
  };
}
