import type { AudioMetrics, VideoMetrics } from "./types";

export const defaultAudioMetrics: AudioMetrics = {
  averageVolume: 0,
  peakVolume: 0,
  volumeVariation: 0,
  silenceRatio: 1,
  lowVolumeRatio: 1,
  estimatedPauseCount: 0,
  longPauseCount: 0,
  voicedFrameRatio: 0,
};

export const defaultVideoMetrics: VideoMetrics = {
  faceDetectedRatio: 0,
  centeredFaceRatio: 0,
  lookingForwardRatio: 0,
  postureStabilityScore: 0,
  engagementRatio: 0,
  expressionScore: 0,
  smileRatio: 0,
  excessiveMovementScore: 0,
  faceLossEvents: 0,
  totalFrames: 0,
};
