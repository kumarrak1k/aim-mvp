import { NextResponse } from "next/server";

type CameraMetrics = {
  faceDetectedRatio: number;
  centeredFaceRatio: number;
  lookingForwardRatio: number;
  postureStabilityScore: number;
  movementVariance: number;
  engagementRatio: number;
  faceLossEvents: number;
};

type VideoAnalysisResponse = {
  eyeContactScore: number;
  presenceScore: number;
  postureScore: number;
  engagementScore: number;
  overallVideoScore: number;
  metrics: CameraMetrics;
  feedback: {
    strengths: string[];
    improvements: string[];
  };
};

function clampScore(value: number): number {
  return Math.max(1, Math.min(10, Math.round(value)));
}

function normaliseCameraMetrics(input: unknown): CameraMetrics {
  if (!input || typeof input !== "object") {
    return {
      faceDetectedRatio: 0,
      centeredFaceRatio: 0,
      lookingForwardRatio: 0,
      postureStabilityScore: 0,
      movementVariance: 1,
      engagementRatio: 0,
      faceLossEvents: 0,
    };
  }

  const raw = input as Record<string, unknown>;

  const getNumber = (key: keyof CameraMetrics, fallback = 0): number => {
    const value = raw[key];
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  };

  return {
    faceDetectedRatio: getNumber("faceDetectedRatio"),
    centeredFaceRatio: getNumber("centeredFaceRatio"),
    lookingForwardRatio: getNumber("lookingForwardRatio"),
    postureStabilityScore: getNumber("postureStabilityScore"),
    movementVariance: getNumber("movementVariance", 1),
    engagementRatio: getNumber("engagementRatio"),
    faceLossEvents: getNumber("faceLossEvents"),
  };
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const parsedBody =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};

    const cameraMetrics = normaliseCameraMetrics(parsedBody.cameraMetrics);

    const {
      faceDetectedRatio,
      centeredFaceRatio,
      lookingForwardRatio,
      postureStabilityScore,
      movementVariance,
      engagementRatio,
      faceLossEvents,
    } = cameraMetrics;

    let presenceScore = 9;

    if (faceDetectedRatio < 0.9) presenceScore -= 1;
    if (faceDetectedRatio < 0.75) presenceScore -= 2;
    if (faceDetectedRatio < 0.55) presenceScore -= 2;
    if (faceDetectedRatio < 0.35) presenceScore -= 2;

    if (centeredFaceRatio < 0.8) presenceScore -= 1;
    if (centeredFaceRatio < 0.6) presenceScore -= 1;
    if (centeredFaceRatio < 0.4) presenceScore -= 1;

    if (faceLossEvents >= 2) presenceScore -= 1;
    if (faceLossEvents >= 4) presenceScore -= 1;

    presenceScore = clampScore(presenceScore);

    let eyeContactScore = 9;

    if (lookingForwardRatio < 0.8) eyeContactScore -= 1;
    if (lookingForwardRatio < 0.65) eyeContactScore -= 2;
    if (lookingForwardRatio < 0.5) eyeContactScore -= 2;
    if (lookingForwardRatio < 0.35) eyeContactScore -= 2;

    if (centeredFaceRatio < 0.5) eyeContactScore -= 1;

    eyeContactScore = clampScore(eyeContactScore);

    let postureScore = 8;

    if (postureStabilityScore < 0.75) postureScore -= 1;
    if (postureStabilityScore < 0.55) postureScore -= 2;
    if (postureStabilityScore < 0.4) postureScore -= 2;

    if (movementVariance > 0.09) postureScore -= 1;
    if (movementVariance > 0.16) postureScore -= 1;
    if (movementVariance > 0.25) postureScore -= 1;

    postureScore = clampScore(postureScore);

    let engagementScore = 9;

    if (engagementRatio < 0.8) engagementScore -= 1;
    if (engagementRatio < 0.65) engagementScore -= 2;
    if (engagementRatio < 0.5) engagementScore -= 2;
    if (engagementRatio < 0.35) engagementScore -= 2;

    if (lookingForwardRatio < 0.5 && faceDetectedRatio < 0.75) {
      engagementScore -= 1;
    }

    engagementScore = clampScore(engagementScore);

    let overallVideoScore =
      eyeContactScore * 0.3 +
      presenceScore * 0.25 +
      postureScore * 0.2 +
      engagementScore * 0.25;

    if (faceDetectedRatio < 0.45) overallVideoScore -= 1;
    if (lookingForwardRatio < 0.4) overallVideoScore -= 1;
    if (postureStabilityScore < 0.45) overallVideoScore -= 1;

    overallVideoScore = clampScore(overallVideoScore);

    const strengths: string[] = [];
    const improvements: string[] = [];

    if (presenceScore >= 8) {
      strengths.push("You stayed visible on camera consistently, which helps you look present and interview-ready.");
    } else {
      if (faceDetectedRatio < 0.75) {
        improvements.push(
          "Your face was not consistently visible on camera. Stay in frame throughout your answer."
        );
      }
      if (centeredFaceRatio < 0.6) {
        improvements.push(
          "Try to stay more centred in the frame so your presence looks more professional."
        );
      }
      if (faceLossEvents >= 2) {
        improvements.push(
          `Your face dropped out of view ${faceLossEvents} times. Avoid leaning too far out of frame.`
        );
      }
    }

    if (eyeContactScore >= 8) {
      strengths.push("Your on-camera attention looked reasonably direct and engaged.");
    } else {
      improvements.push(
        "You looked away from the camera too often. Lift your gaze closer to screen or webcam level."
      );
    }

    if (postureScore >= 8) {
      strengths.push("Your posture looked steady and composed on camera.");
    } else {
      if (postureStabilityScore < 0.55) {
        improvements.push(
          "Your posture looked unstable. Sit upright and keep your head and shoulders steadier while answering."
        );
      }
      if (movementVariance > 0.16) {
        improvements.push(
          "There was too much movement on camera, which can read as nervousness. Try to reduce drifting and fidgeting."
        );
      }
    }

    if (engagementScore >= 8) {
      strengths.push("Your camera presence felt engaged rather than passive.");
    } else {
      improvements.push(
        "Your camera engagement looked low. Aim to look more present, steady, and attentive throughout the answer."
      );
    }

    if (strengths.length === 0) {
      if (overallVideoScore >= 7) {
        strengths.push("Your visual presence is solid overall, with room to sharpen further.");
      } else {
        strengths.push("You stayed on camera, which gives you a starting point to improve your body language.");
      }
    }

    if (improvements.length === 0) {
      improvements.push("Keep refining your eye contact, posture, and framing so your delivery feels more polished.");
    }

    const response: VideoAnalysisResponse = {
      eyeContactScore,
      presenceScore,
      postureScore,
      engagementScore,
      overallVideoScore,
      metrics: cameraMetrics,
      feedback: {
        strengths,
        improvements,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Video analysis failed:", error);
    return NextResponse.json({ error: "Video analysis failed" }, { status: 500 });
  }
}