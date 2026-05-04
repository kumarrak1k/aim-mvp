import type { InterviewSummary, ResultItem, SavedSession } from "../types";

export const calculateAverageQuestionScore = (results: ResultItem[]) => {
  if (results.length === 0) return 0;

  const total = results.reduce(
    (sum, item) => sum + (item.feedback?.overall_score || 0),
    0
  );

  return Math.round((total / results.length) * 10) / 10;
};

export const buildFallbackInterviewSummary = (
  results: ResultItem[]
): InterviewSummary => {
  const overallScore = results.length
    ? Math.round(
        results.reduce(
          (sum, item) => sum + (item.feedback?.overall_score || 0),
          0
        ) / results.length
      )
    : 0;

  return {
    overall_score: overallScore,
    hire_signal: "Moderate",
    top_strengths: ["Good effort across the interview"],
    top_improvements: ["Add more structure to answers"],
    final_recommendation: "Keep practicing with clearer examples.",
    next_steps: [
      "Practice STAR-format answers",
      "Use more specific examples",
      "Improve concise delivery",
    ],
    error: "Summary generation partially failed.",
  };
};

export const createSavedSession = ({
  role,
  interviewType,
  difficulty,
  totalQuestions,
  summary,
}: {
  role: string;
  interviewType: string;
  difficulty: string;
  totalQuestions: number;
  summary: InterviewSummary;
}): SavedSession => {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    date: new Date().toLocaleString(),
    role: `${role} · ${interviewType} · ${difficulty}`,
    totalQuestions,
    overallScore: summary.overall_score,
    hireSignal: summary.hire_signal,
  };
};

export const prependSavedSession = (
  savedSessions: SavedSession[],
  newSession: SavedSession,
  limit = 8
) => {
  return [newSession, ...savedSessions].slice(0, limit);
};
