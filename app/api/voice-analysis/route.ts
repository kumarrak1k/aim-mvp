import { NextResponse } from "next/server";

type AudioMetrics = {
  averageVolume?: number;
  peakVolume?: number;
  volumeVariation?: number;
  silenceRatio?: number;
  lowVolumeRatio?: number;
  estimatedPauseCount?: number;
  longPauseCount?: number;
  voicedFrameRatio?: number;
};

const fillerWords = [
  "um",
  "uh",
  "erm",
  "er",
  "like",
  "you know",
  "sort of",
  "kind of",
  "basically",
  "literally",
  "actually",
];

const hedgeWords = [
  "maybe",
  "probably",
  "i think",
  "i guess",
  "i suppose",
  "perhaps",
  "not sure",
  "hopefully",
  "possibly",
];

function clamp(value: number, min = 0, max = 10) {
  return Math.max(min, Math.min(max, value));
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function countMatches(text: string, phrases: string[]) {
  return phrases.reduce((count, phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    const matches = text.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
}

function getDetected(text: string, phrases: string[]) {
  return phrases.filter((phrase) => {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`, "i").test(text);
  });
}

function countRepeatedPhrases(words: string[]) {
  let repetitions = 0;
  const seen = new Map<string, number>();

  for (let i = 0; i < words.length - 2; i++) {
    const phrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
    seen.set(phrase, (seen.get(phrase) || 0) + 1);
  }

  seen.forEach((value) => {
    if (value > 1) repetitions += value - 1;
  });

  return repetitions;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      transcript?: string;
      durationSeconds?: number | null;
      audioMetrics?: AudioMetrics;
    };

    const transcript = (body.transcript || "").trim();
    const durationSeconds = body.durationSeconds || null;
    const audio = body.audioMetrics || {};

    if (!transcript) {
      return NextResponse.json(
        { error: "Missing transcript for voice analysis." },
        { status: 400 }
      );
    }

    const lower = transcript.toLowerCase();
    const words = lower.match(/\b[\w']+\b/g) || [];
    const wordCount = words.length;

    const sentences = transcript
      .split(/[.!?]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const sentenceCount = Math.max(1, sentences.length);
    const averageSentenceLength = wordCount / sentenceCount;

    const fillerCount = countMatches(lower, fillerWords);
    const hedgeCount = countMatches(lower, hedgeWords);
    const repetitionCount = countRepeatedPhrases(words);

    const structureMarkerCount = countMatches(lower, [
      "first",
      "second",
      "third",
      "finally",
      "for example",
      "because",
      "therefore",
      "as a result",
      "the outcome",
      "what i learned",
    ]);

    const exampleMarkerCount = countMatches(lower, [
      "for example",
      "for instance",
      "in my previous role",
      "at university",
      "during",
      "when i",
      "i worked on",
      "i was responsible",
    ]);

    const estimatedWPM =
      durationSeconds && durationSeconds > 0
        ? Math.round((wordCount / durationSeconds) * 60)
        : 0;

    const fillerRate = wordCount > 0 ? fillerCount / wordCount : 0;
    const hedgeRate = wordCount > 0 ? hedgeCount / wordCount : 0;

    const averageVolume = audio.averageVolume ?? 0;
    const peakVolume = audio.peakVolume ?? 0;
    const volumeVariation = audio.volumeVariation ?? 0;
    const silenceRatio = audio.silenceRatio ?? 1;
    const lowVolumeRatio = audio.lowVolumeRatio ?? 1;
    const longPauseCount = audio.longPauseCount ?? 0;
    const estimatedPauseCount = audio.estimatedPauseCount ?? 0;
    const voicedFrameRatio = audio.voicedFrameRatio ?? 0;

    let paceScore = 10;
    if (estimatedWPM === 0) paceScore = 5;
    else if (estimatedWPM < 85) paceScore = 4;
    else if (estimatedWPM < 105) paceScore = 6;
    else if (estimatedWPM <= 165) paceScore = 9;
    else if (estimatedWPM <= 185) paceScore = 7;
    else paceScore = 4;

    if (longPauseCount >= 2) paceScore -= 1.5;
    if (silenceRatio > 0.35) paceScore -= 2;
    if (wordCount < 35) paceScore -= 1.5;

    let fillerScore = 10;
    fillerScore -= fillerCount * 1.4;
    fillerScore -= hedgeCount * 0.9;
    fillerScore -= repetitionCount * 0.8;
    if (fillerRate > 0.08) fillerScore -= 2;
    if (fillerRate > 0.12) fillerScore -= 2;

    let confidenceScore = 10;
    if (averageVolume < 5) confidenceScore -= 4;
    else if (averageVolume < 9) confidenceScore -= 2.5;
    else if (averageVolume < 13) confidenceScore -= 1;

    if (peakVolume < 12) confidenceScore -= 2;
    if (lowVolumeRatio > 0.45) confidenceScore -= 2.5;
    if (voicedFrameRatio < 0.45) confidenceScore -= 2;
    if (hedgeRate > 0.04) confidenceScore -= 1.5;
    if (wordCount < 30) confidenceScore -= 2;

    let energyScore = 10;
    if (averageVolume < 7) energyScore -= 3;
    if (volumeVariation < 1.5) energyScore -= 2.5;
    if (silenceRatio > 0.3) energyScore -= 2;
    if (voicedFrameRatio < 0.5) energyScore -= 2;
    if (wordCount < 35) energyScore -= 1.5;

    let clarityScore = 10;
    if (averageSentenceLength > 28) clarityScore -= 2;
    if (averageSentenceLength > 38) clarityScore -= 2;
    if (fillerCount >= 4) clarityScore -= 1.5;
    if (repetitionCount >= 2) clarityScore -= 1.5;
    if (structureMarkerCount === 0 && wordCount > 45) clarityScore -= 1.5;

    let structureScore = 10;
    if (structureMarkerCount === 0) structureScore -= 2.5;
    if (exampleMarkerCount === 0) structureScore -= 2;
    if (wordCount < 45) structureScore -= 2;
    if (sentenceCount < 2) structureScore -= 1.5;

    paceScore = round1(clamp(paceScore));
    fillerScore = round1(clamp(fillerScore));
    confidenceScore = round1(clamp(confidenceScore));
    energyScore = round1(clamp(energyScore));
    clarityScore = round1(clamp(clarityScore));
    structureScore = round1(clamp(structureScore));

    let overallVoiceScore =
      paceScore * 0.18 +
      fillerScore * 0.18 +
      confidenceScore * 0.24 +
      energyScore * 0.16 +
      clarityScore * 0.14 +
      structureScore * 0.1;

    if (confidenceScore <= 4) overallVoiceScore -= 1.2;
    if (energyScore <= 4) overallVoiceScore -= 1;
    if (fillerScore <= 4) overallVoiceScore -= 0.8;
    if (wordCount < 25) overallVoiceScore = Math.min(overallVoiceScore, 5);
    if (averageVolume < 5 && lowVolumeRatio > 0.5) {
      overallVoiceScore = Math.min(overallVoiceScore, 4.5);
    }

    overallVoiceScore = round1(clamp(overallVoiceScore));

    const strengths: string[] = [];
    const improvements: string[] = [];

    if (paceScore >= 8) strengths.push("Your speaking pace was suitable for an interview.");
    if (fillerScore >= 8) strengths.push("You used relatively few filler words.");
    if (confidenceScore >= 8) strengths.push("Your voice carried confidence and presence.");
    if (structureScore >= 8) strengths.push("Your answer had signs of structure and examples.");

    if (paceScore < 6) {
      improvements.push(
        estimatedWPM && estimatedWPM < 100
          ? "Your pace was too slow. Aim for a more natural interview pace with fewer long pauses."
          : "Your pace was uneven. Slow down slightly and pause deliberately between points."
      );
    }

    if (fillerScore < 7) {
      improvements.push(
        "Reduce filler language such as 'um', 'like', 'you know', or hedging phrases. Replace them with short pauses."
      );
    }

    if (confidenceScore < 7) {
      improvements.push(
        "Your confidence score was reduced because your delivery appears quiet, hesitant, or low-presence. Speak slightly louder and finish sentences firmly."
      );
    }

    if (energyScore < 7) {
      improvements.push(
        "Your delivery needs more vocal energy. Vary your tone and emphasise key words rather than speaking flatly."
      );
    }

    if (structureScore < 7) {
      improvements.push(
        "Use a clearer structure: situation, action, result, and learning. This makes your answer easier to follow."
      );
    }

    if (wordCount < 35) {
      improvements.push(
        "Your answer was too short to fully demonstrate capability. Add a specific example and measurable outcome."
      );
    }

    return NextResponse.json({
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
        fillerRate: round1(fillerRate * 100),
        hedgeCount,
        hedgeRate: round1(hedgeRate * 100),
        repetitionCount,
        structureMarkerCount,
        exampleMarkerCount,
        estimatedWPM,
        averageSentenceLength: round1(averageSentenceLength),
        averageVolume,
        peakVolume,
        volumeVariation,
        silenceRatio,
        lowVolumeRatio,
        estimatedPauseCount,
        longPauseCount,
        voicedFrameRatio,
      },
      feedback: {
        strengths:
          strengths.length > 0
            ? strengths
            : ["There is enough speech data to start analysing your delivery."],
        improvements:
          improvements.length > 0
            ? improvements
            : ["Keep practising with specific examples and confident delivery."],
      },
      evidence: {
        fillersDetected: getDetected(lower, fillerWords),
        hedgesDetected: getDetected(lower, hedgeWords),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Voice analysis failed unexpectedly.",
      },
      { status: 500 }
    );
  }
}