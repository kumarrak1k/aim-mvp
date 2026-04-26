import { NextResponse } from "next/server";

type VideoMetrics = {
  faceDetectedRatio: number;
  centeredFaceRatio: number;
  lookingForwardRatio: number;
  postureStabilityScore: number;
  engagementRatio: number;
  expressionScore: number;
  smileRatio: number;
  excessiveMovementScore: number;
  faceLossEvents: number;
  totalFrames: number;
};

function clamp(value: number, min = 0, max = 10) {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

export async function POST(req: Request) {
  try {
    const { metrics } = (await req.json()) as {
      metrics?: Partial<VideoMetrics>;
    };

    if (!metrics) {
      return NextResponse.json(
        { error: "Missing video metrics." },
        { status: 400 }
      );
    }

    const faceDetectedRatio = metrics.faceDetectedRatio ?? 0;
    const centeredFaceRatio = metrics.centeredFaceRatio ?? 0;
    const lookingForwardRatio = metrics.lookingForwardRatio ?? 0;
    const postureStabilityScore = metrics.postureStabilityScore ?? 0;
    const engagementRatio = metrics.engagementRatio ?? 0;
    const expressionScore = metrics.expressionScore ?? 0;
    const smileRatio = metrics.smileRatio ?? 0;
    const excessiveMovementScore = metrics.excessiveMovementScore ?? 0;
    const faceLossEvents = metrics.faceLossEvents ?? 0;
    const totalFrames = metrics.totalFrames ?? 0;

    let eyeContactScore = lookingForwardRatio * 10;
    if (faceDetectedRatio < 0.7) eyeContactScore -= 2;
    if (faceLossEvents >= 2) eyeContactScore -= 1.5;

    let positionScore = centeredFaceRatio * 10;
    if (faceDetectedRatio < 0.75) positionScore -= 2;

    let bodyLanguageScore =
      postureStabilityScore * 7 + excessiveMovementScore * 3;
    if (faceLossEvents >= 3) bodyLanguageScore -= 1.5;

    let expressionFinalScore = expressionScore * 10;
    if (smileRatio < 0.03) expressionFinalScore -= 1.2;
    if (smileRatio > 0.65) expressionFinalScore -= 1.5;

    let engagementScore =
      engagementRatio * 5 +
      lookingForwardRatio * 2 +
      centeredFaceRatio * 1.5 +
      postureStabilityScore * 1.5;

    if (faceDetectedRatio < 0.6) {
      eyeContactScore = Math.min(eyeContactScore, 4);
      positionScore = Math.min(positionScore, 4);
      bodyLanguageScore = Math.min(bodyLanguageScore, 4);
      expressionFinalScore = Math.min(expressionFinalScore, 4);
      engagementScore = Math.min(engagementScore, 4);
    }

    if (totalFrames < 20) {
      eyeContactScore = Math.min(eyeContactScore, 5);
      positionScore = Math.min(positionScore, 5);
      bodyLanguageScore = Math.min(bodyLanguageScore, 5);
      expressionFinalScore = Math.min(expressionFinalScore, 5);
      engagementScore = Math.min(engagementScore, 5);
    }

    eyeContactScore = round1(clamp(eyeContactScore));
    positionScore = round1(clamp(positionScore));
    bodyLanguageScore = round1(clamp(bodyLanguageScore));
    expressionFinalScore = round1(clamp(expressionFinalScore));
    engagementScore = round1(clamp(engagementScore));

    let overallVideoScore =
      eyeContactScore * 0.28 +
      positionScore * 0.2 +
      bodyLanguageScore * 0.2 +
      expressionFinalScore * 0.14 +
      engagementScore * 0.18;

    if (eyeContactScore <= 4) overallVideoScore -= 1;
    if (positionScore <= 4) overallVideoScore -= 0.8;
    if (faceDetectedRatio < 0.5) {
      overallVideoScore = Math.min(overallVideoScore, 4);
    }

    overallVideoScore = round1(clamp(overallVideoScore));

    const strengths: string[] = [];
    const improvements: string[] = [];

    if (eyeContactScore >= 8) {
      strengths.push("You maintained strong camera-facing eye contact.");
    }
    if (positionScore >= 8) {
      strengths.push("You stayed well positioned and visible in the frame.");
    }
    if (bodyLanguageScore >= 8) {
      strengths.push("Your posture and movement appeared controlled.");
    }
    if (expressionFinalScore >= 8) {
      strengths.push("Your facial expression appeared engaged and professional.");
    }

    if (eyeContactScore < 7) {
      improvements.push(
        "Improve eye contact by looking closer to the camera while answering, not down or away from the screen."
      );
    }

    if (positionScore < 7) {
      improvements.push(
        "Position yourself more centrally in the frame with your face clearly visible."
      );
    }

    if (bodyLanguageScore < 7) {
      improvements.push(
        "Keep your posture steady. Avoid excessive head movement, leaning out of frame, or shifting too often."
      );
    }

    if (expressionFinalScore < 7) {
      improvements.push(
        "Use a more engaged facial expression. Aim for calm, professional warmth rather than looking blank, distracted, or overly animated."
      );
    }

    if (engagementScore < 7) {
      improvements.push(
        "Your visual engagement could be stronger. Stay present, face the camera, and hold a steady interview posture."
      );
    }

    if (faceDetectedRatio < 0.7) {
      improvements.push(
        "Your face was not consistently detected. Improve lighting and camera position before starting."
      );
    }

    return NextResponse.json({
      overallVideoScore,
      eyeContactScore,
      positionScore,
      bodyLanguageScore,
      expressionScore: expressionFinalScore,
      engagementScore,
      metrics: {
        faceDetectedRatio,
        centeredFaceRatio,
        lookingForwardRatio,
        postureStabilityScore,
        engagementRatio,
        expressionScore,
        smileRatio,
        excessiveMovementScore,
        faceLossEvents,
        totalFrames,
      },
      feedback: {
        strengths:
          strengths.length > 0
            ? strengths
            : ["There is enough camera data to begin analysing visual delivery."],
        improvements:
          improvements.length > 0
            ? improvements
            : ["Maintain steady eye contact, posture, and camera positioning."],
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Video analysis failed unexpectedly.",
      },
      { status: 500 }
    );
  }
}