import type { VideoMetrics } from "../types";
import { defaultVideoMetrics } from "../config";

export type VideoFrameStore = {
  totalFrames: number;
  faceDetectedFrames: number;
  centeredFrames: number;
  lookingForwardFrames: number;
  engagedFrames: number;
  expressiveFrames: number;
  smileFrames: number;
  faceLossEvents: number;
  noFaceRun: number;
  positions: Array<{ x: number; y: number }>;
};

export type FaceLandmarkPoint = {
  x: number;
  y: number;
  z?: number;
};

export type FaceBlendshapeCategory = {
  categoryName: string;
  score: number;
};

export const createEmptyVideoFrameStore = (): VideoFrameStore => ({
  totalFrames: 0,
  faceDetectedFrames: 0,
  centeredFrames: 0,
  lookingForwardFrames: 0,
  engagedFrames: 0,
  expressiveFrames: 0,
  smileFrames: 0,
  faceLossEvents: 0,
  noFaceRun: 0,
  positions: [],
});

export const analyseFaceFrame = (
  frames: VideoFrameStore,
  landmarks: FaceLandmarkPoint[],
  blendshapes?: FaceBlendshapeCategory[]
) => {
  const nose = landmarks[1];
  const leftEyeOuter = landmarks[33];
  const rightEyeOuter = landmarks[263];
  const forehead = landmarks[10];
  const chin = landmarks[152];

  if (!nose || !leftEyeOuter || !rightEyeOuter || !forehead || !chin) return;

  frames.totalFrames += 1;
  frames.faceDetectedFrames += 1;

  if (frames.noFaceRun >= 8) {
    frames.faceLossEvents += 1;
  }

  frames.noFaceRun = 0;

  const centerX = nose.x;
  const centerY = nose.y;

  const isCentered =
    centerX > 0.34 && centerX < 0.66 && centerY > 0.2 && centerY < 0.72;

  if (isCentered) frames.centeredFrames += 1;

  const eyeDistance = Math.abs(rightEyeOuter.x - leftEyeOuter.x);
  const faceHeight = Math.abs(chin.y - forehead.y);
  const faceLooksPresent = eyeDistance > 0.12 && faceHeight > 0.2;

  const eyeMidX = (leftEyeOuter.x + rightEyeOuter.x) / 2;
  const noseOffset = Math.abs(nose.x - eyeMidX);
  const lookingForward = noseOffset < 0.04 && isCentered && faceLooksPresent;

  if (lookingForward) frames.lookingForwardFrames += 1;

  const smileLeft =
    blendshapes?.find((item) => item.categoryName === "mouthSmileLeft")
      ?.score ?? 0;
  const smileRight =
    blendshapes?.find((item) => item.categoryName === "mouthSmileRight")
      ?.score ?? 0;
  const browDownLeft =
    blendshapes?.find((item) => item.categoryName === "browDownLeft")
      ?.score ?? 0;
  const browDownRight =
    blendshapes?.find((item) => item.categoryName === "browDownRight")
      ?.score ?? 0;

  const smileScore = (smileLeft + smileRight) / 2;
  const browTension = (browDownLeft + browDownRight) / 2;

  if (smileScore > 0.15) frames.smileFrames += 1;
  if (smileScore > 0.08 || browTension < 0.35) frames.expressiveFrames += 1;

  if (isCentered && lookingForward && faceLooksPresent) {
    frames.engagedFrames += 1;
  }

  frames.positions.push({ x: centerX, y: centerY });
};

export const addNoFaceVideoFrame = (frames: VideoFrameStore) => {
  frames.totalFrames += 1;
  frames.noFaceRun += 1;
};

export const calculateVideoMetrics = (
  frames: VideoFrameStore
): VideoMetrics => {
  const totalFrames = frames.totalFrames;

  if (totalFrames === 0) {
    return { ...defaultVideoMetrics };
  }

  const positions = frames.positions;
  let meanX = 0;
  let meanY = 0;

  positions.forEach((position) => {
    meanX += position.x;
    meanY += position.y;
  });

  meanX /= positions.length || 1;
  meanY /= positions.length || 1;

  let varianceSum = 0;
  positions.forEach((position) => {
    const dx = position.x - meanX;
    const dy = position.y - meanY;
    varianceSum += dx * dx + dy * dy;
  });

  const movementVariance = positions.length
    ? varianceSum / positions.length
    : 1;

  const postureStabilityScore = Math.max(
    0,
    1 - Math.min(1, movementVariance * 22)
  );

  const excessiveMovementScore = Math.max(
    0,
    1 - Math.min(1, movementVariance * 30)
  );

  return {
    faceDetectedRatio: Number(
      (frames.faceDetectedFrames / totalFrames).toFixed(3)
    ),
    centeredFaceRatio: Number((frames.centeredFrames / totalFrames).toFixed(3)),
    lookingForwardRatio: Number(
      (frames.lookingForwardFrames / totalFrames).toFixed(3)
    ),
    postureStabilityScore: Number(postureStabilityScore.toFixed(3)),
    engagementRatio: Number((frames.engagedFrames / totalFrames).toFixed(3)),
    expressionScore: Number((frames.expressiveFrames / totalFrames).toFixed(3)),
    smileRatio: Number((frames.smileFrames / totalFrames).toFixed(3)),
    excessiveMovementScore: Number(excessiveMovementScore.toFixed(3)),
    faceLossEvents: frames.faceLossEvents,
    totalFrames,
  };
};
