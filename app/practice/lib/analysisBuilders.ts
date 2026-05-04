import type { AudioMetrics, VideoAnalysis, VideoMetrics, VoiceAnalysis } from "../types";
import { defaultVideoMetrics } from "../config";
import {
  countPhrase,
  fillerWords,
  getWords,
  hedgeWords,
} from "./speechGuards";

export const clampScore = (value: number) => {
  return Math.max(0, Math.min(10, Math.round(value)));
};

export const buildLocalVoiceAnalysis = (
  transcript: string,
  durationSeconds: number | null,
  audioMetrics: AudioMetrics
): VoiceAnalysis => {
  const words = getWords(transcript);
  const wordCount = words.length;

  const safeDuration =
    typeof durationSeconds === "number" && durationSeconds > 0
      ? durationSeconds
      : Math.max(30, Math.round(wordCount / 2));

  const estimatedWPM =
    wordCount > 0 ? Math.round((wordCount / safeDuration) * 60) : 0;

  const sentenceCount = Math.max(
    1,
    transcript.split(/[.!?]+/).filter((part) => part.trim()).length
  );

  const averageSentenceLength =
    sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

  const fillerCount = fillerWords.reduce(
    (sum: number, word: string) => sum + countPhrase(transcript, word),
    0
  );

  const hedgeCount = hedgeWords.reduce(
    (sum: number, word: string) => sum + countPhrase(transcript, word),
    0
  );

  const fillersDetected = fillerWords.filter(
    (word: string) => countPhrase(transcript, word) > 0
  );

  const hedgesDetected = hedgeWords.filter(
    (word: string) => countPhrase(transcript, word) > 0
  );

  const fillerRate = wordCount > 0 ? fillerCount / wordCount : 0;
  const hedgeRate = wordCount > 0 ? hedgeCount / wordCount : 0;

  let paceScore = 5;
  if (estimatedWPM >= 120 && estimatedWPM <= 170) paceScore = 9;
  else if (estimatedWPM >= 100 && estimatedWPM < 120) paceScore = 7;
  else if (estimatedWPM > 170 && estimatedWPM <= 190) paceScore = 7;
  else if (estimatedWPM >= 80 && estimatedWPM < 100) paceScore = 5;
  else if (estimatedWPM > 190 && estimatedWPM <= 220) paceScore = 5;
  else if (estimatedWPM > 0) paceScore = 3;

  const structureMarkers = [
    "first",
    "second",
    "third",
    "finally",
    "for example",
    "as a result",
    "therefore",
    "because",
    "the outcome",
    "the result",
  ];

  const exampleMarkers = [
    "for example",
    "for instance",
    "in my previous role",
    "when i",
    "i worked on",
    "i led",
    "i managed",
    "i delivered",
  ];

  const structureMarkerCount = structureMarkers.reduce(
    (sum: number, word: string) => sum + countPhrase(transcript, word),
    0
  );

  const exampleMarkerCount = exampleMarkers.reduce(
    (sum: number, word: string) => sum + countPhrase(transcript, word),
    0
  );

  const repetitionCount = words.reduce((sum: number, word: string, index: number) => {
    if (index === 0) return sum;
    return word === words[index - 1] ? sum + 1 : sum;
  }, 0);

  const fillerScore = clampScore(10 - fillerRate * 120 - fillerCount * 0.4);
  const confidenceScore = clampScore(
    8 - hedgeRate * 80 - hedgeCount * 0.35 + Math.min(2, exampleMarkerCount)
  );
  const structureScore = clampScore(
    4 + Math.min(4, structureMarkerCount) + Math.min(2, exampleMarkerCount)
  );
  const energyScore = clampScore(
    5 +
      Math.min(2, audioMetrics.averageVolume / 8) +
      Math.min(2, audioMetrics.volumeVariation / 6) -
      audioMetrics.lowVolumeRatio * 3 -
      audioMetrics.silenceRatio * 2
  );
  const clarityScore = clampScore(
    8 -
      fillerCount * 0.35 -
      repetitionCount * 0.4 -
      audioMetrics.longPauseCount * 0.5 -
      Math.max(0, averageSentenceLength - 28) * 0.1
  );

  const overallVoiceScore = clampScore(
    (paceScore +
      fillerScore +
      confidenceScore +
      energyScore +
      clarityScore +
      structureScore) /
      6
  );

  const strengths: string[] = [];
  const improvements: string[] = [];

  if (paceScore >= 8) strengths.push("Your speaking pace was controlled.");
  else improvements.push("Aim for roughly 120–170 words per minute.");

  if (fillerScore >= 8) strengths.push("You used few filler words.");
  else improvements.push("Reduce filler words such as um, er, like, and you know.");

  return {
    paceScore,
    fillerScore,
    confidenceScore,
    energyScore,
    clarityScore,
    structureScore,
    overallVoiceScore,
    metrics: {
      wordCount,
      sentenceCount,
      fillerCount,
      fillerRate: Number(fillerRate.toFixed(3)),
      hedgeCount,
      hedgeRate: Number(hedgeRate.toFixed(3)),
      repetitionCount,
      structureMarkerCount,
      exampleMarkerCount,
      estimatedWPM,
      averageSentenceLength,
      averageVolume: audioMetrics.averageVolume,
      peakVolume: audioMetrics.peakVolume,
      volumeVariation: audioMetrics.volumeVariation,
      silenceRatio: audioMetrics.silenceRatio,
      lowVolumeRatio: audioMetrics.lowVolumeRatio,
      estimatedPauseCount: audioMetrics.estimatedPauseCount,
      longPauseCount: audioMetrics.longPauseCount,
      voicedFrameRatio: audioMetrics.voicedFrameRatio,
    },
    feedback: {
      strengths,
      improvements,
    },
    evidence: {
      fillersDetected,
      hedgesDetected,
    },
  };
};

export const buildFallbackVideoAnalysis = (
  metrics: VideoMetrics = defaultVideoMetrics,
  reason = "Advanced live face tracking was unavailable on this browser/device, so this is a neutral fallback video score."
): VideoAnalysis => {
  return {
    overallVideoScore: 5,
    eyeContactScore: 5,
    positionScore: 5,
    bodyLanguageScore: 5,
    expressionScore: 5,
    engagementScore: 5,
    metrics,
    feedback: {
      strengths: ["Camera preview was active during the answer."],
      improvements: [reason],
    },
  };
};
