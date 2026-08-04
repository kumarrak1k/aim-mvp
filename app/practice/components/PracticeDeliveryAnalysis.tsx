"use client";

import type { VideoAnalysis, VoiceAnalysis } from "../types";
import { AnalysisPanel, MetricCard, ScoreCard } from "./PracticeUi";

type PracticeDeliveryAnalysisProps = {
  voiceAnalysis: VoiceAnalysis | null;
  videoAnalysis: VideoAnalysis | null;
};

export function PracticeDeliveryAnalysis({
  voiceAnalysis,
  videoAnalysis,
}: PracticeDeliveryAnalysisProps) {
  const hasRealVideoFrames = (videoAnalysis?.metrics.totalFrames || 0) > 0;

  if (!voiceAnalysis && !videoAnalysis) return null;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      {voiceAnalysis && !voiceAnalysis.error && (
        <AnalysisPanel title="Voice Analysis" accent="cyan">
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ScoreCard label="Voice" value={voiceAnalysis.overallVoiceScore} />
            <ScoreCard label="Pace" value={voiceAnalysis.paceScore} />
            <ScoreCard label="Fillers" value={voiceAnalysis.fillerScore} />
            <ScoreCard
              label="Confidence"
              value={voiceAnalysis.confidenceScore}
            />
            <ScoreCard label="Energy" value={voiceAnalysis.energyScore} />
            <ScoreCard
              label="Structure"
              value={voiceAnalysis.structureScore ?? 0}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Words"
              value={String(voiceAnalysis.metrics.wordCount)}
            />
            <MetricCard
              label="WPM"
              value={String(voiceAnalysis.metrics.estimatedWPM)}
            />
            <MetricCard
              label="Fillers"
              value={String(voiceAnalysis.metrics.fillerCount)}
            />
            <MetricCard
              label="Long pauses"
              value={String(voiceAnalysis.metrics.longPauseCount)}
            />
          </div>
        </AnalysisPanel>
      )}

      {videoAnalysis && !videoAnalysis.error && (
        <AnalysisPanel title="Video Analysis" accent="purple">
          <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ScoreCard label="Video" value={videoAnalysis.overallVideoScore} />
            <ScoreCard
              label="Eye Contact"
              value={videoAnalysis.eyeContactScore}
            />
            <ScoreCard label="Position" value={videoAnalysis.positionScore} />
            <ScoreCard
              label="Body Lang."
              value={videoAnalysis.bodyLanguageScore}
            />
            <ScoreCard
              label="Expression"
              value={videoAnalysis.expressionScore}
            />
            <ScoreCard
              label="Engagement"
              value={videoAnalysis.engagementScore}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              label="Face detected"
              value={
                hasRealVideoFrames
                  ? `${Math.round(videoAnalysis.metrics.faceDetectedRatio * 100)}%`
                  : "N/A"
              }
            />
            <MetricCard
              label="Centered"
              value={
                hasRealVideoFrames
                  ? `${Math.round(videoAnalysis.metrics.centeredFaceRatio * 100)}%`
                  : "N/A"
              }
            />
            <MetricCard
              label="Looking forward"
              value={
                hasRealVideoFrames
                  ? `${Math.round(
                      videoAnalysis.metrics.lookingForwardRatio * 100
                    )}%`
                  : "N/A"
              }
            />
            <MetricCard
              label="Face loss"
              value={
                hasRealVideoFrames
                  ? String(videoAnalysis.metrics.faceLossEvents)
                  : "N/A"
              }
            />
          </div>

          {videoAnalysis.feedback.improvements.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 font-bold text-orange-300">
                Video improvements
              </p>
              <ul className="list-disc space-y-1 pl-5 text-sm leading-6 text-gray-200">
                {videoAnalysis.feedback.improvements.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </AnalysisPanel>
      )}
    </div>
  );
}
