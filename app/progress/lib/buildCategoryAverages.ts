/**
 * Extracted from app/progress/page.tsx so it can be unit tested.
 * Computes per-category score averages from a list of dashboard sessions,
 * correctly gating voice-only and camera-only categories by practiceMode.
 */

export type CategoryBreakdown = {
  content?: number;
  clarity?: number;
  relevance?: number;
  structure?: number;
  confidence?: number;
  pace?: number;
  voice_delivery?: number;
  camera_presence?: number;
};

export type DashboardSessionForAverages = {
  practiceMode: string;
  summary?: {
    category_breakdown?: CategoryBreakdown;
  };
};

export const emptyCategoryAverages: Required<CategoryBreakdown> = {
  content: 0,
  clarity: 0,
  relevance: 0,
  structure: 0,
  confidence: 0,
  pace: 0,
  voice_delivery: 0,
  camera_presence: 0,
};

export const categoryLabels: Array<{
  key: keyof Required<CategoryBreakdown>;
  label: string;
  voiceOnly?: boolean;
  cameraOnly?: boolean;
}> = [
  { key: "content", label: "Content" },
  { key: "clarity", label: "Clarity" },
  { key: "relevance", label: "Relevance" },
  { key: "structure", label: "Structure" },
  { key: "confidence", label: "Confidence" },
  { key: "pace", label: "Pace", voiceOnly: true },
  { key: "voice_delivery", label: "Voice delivery", voiceOnly: true },
  { key: "camera_presence", label: "Camera presence", cameraOnly: true },
];

export function buildCategoryAverages(sessions: DashboardSessionForAverages[]): {
  averages: Required<CategoryBreakdown>;
  counts: Required<CategoryBreakdown>;
} {
  const totals = { ...emptyCategoryAverages };
  const counts = { ...emptyCategoryAverages };

  sessions.forEach((session) => {
    const breakdown = session.summary?.category_breakdown;
    if (!breakdown) return;

    const isTyped = session.practiceMode === "typed";
    const hasCamera = session.practiceMode === "voice-camera";

    categoryLabels.forEach((item) => {
      // Never count voice-only categories (pace, voice_delivery) for typed
      // sessions — even if an old session saved a stale non-zero value there.
      if (item.voiceOnly && isTyped) return;
      // Never count camera-only categories for non-camera sessions.
      if (item.cameraOnly && !hasCamera) return;

      const value = breakdown[item.key];
      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        totals[item.key] += value;
        counts[item.key] += 1;
      }
    });
  });

  const averages = categoryLabels.reduce(
    (accumulator, item) => {
      const count = counts[item.key];
      accumulator[item.key] =
        count > 0 ? Math.round((totals[item.key] / count) * 10) / 10 : 0;
      return accumulator;
    },
    { ...emptyCategoryAverages }
  );

  return { averages, counts };
}
