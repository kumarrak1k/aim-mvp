import { NextRequest, NextResponse } from "next/server";

const fillerWords = [
  "um",
  "umm",
  "uh",
  "er",
  "erm",
  "ah",
  "like",
  "you know",
  "sort of",
  "kind of",
  "basically",
  "actually",
  "literally",
];

const hedgeWords = [
  "maybe",
  "perhaps",
  "probably",
  "possibly",
  "i think",
  "i guess",
  "i suppose",
  "kind of",
  "sort of",
];

function clampScore(value: number) {
  return Math.max(0, Math.min(10, Math.round(value)));
}

function countPhrase(text: string, phrase: string) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "gi");
  return text.match(regex)?.length || 0;
}

function getWords(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

export async function POST(req: NextRequest) {
  try {
    const { transcript, durationSeconds, audioMetrics } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return NextResponse.json(
        { error: "Missing transcript." },
        { status: 400 }
      );
    }

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

    const fillersDetected = fillerWords.filter(
      (word) => countPhrase(transcript, word) > 0
    );

    const fillerCount = fillerWords.reduce(
      (sum, word) => sum + countPhrase(transcript, word),
      0
    );

    const hedgesDetected = hedgeWords.filter(
      (word) => countPhrase(transcript, word) > 0
    );

    const hedgeCount = hedgeWords.reduce(
      (sum, word) => sum + countPhrase(transcript, word),
      0
    );

    const fillerRate = wordCount > 0 ? fillerCount / wordCount : 0;
    const hedgeRate = wordCount > 0 ? hedgeCount / wordCount : 0;

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
      (sum, word) => sum + countPhrase(transcript, word),
      0
    );

    const exampleMarkerCount = exampleMarkers.reduce(
      (sum, word) => sum + countPhrase(transcript, word),
      0
    );

    const repetitionCount = words.reduce((sum, word, index) => {
      if (index === 0) return sum;
      return word === words[index - 1] ? sum + 1 : sum;
    }, 0);

    let paceScore = 5;
    if (estimatedWPM >= 120 && estimatedWPM <= 170) paceScore = 9;
    else if (estimatedWPM >= 100 && estimatedWPM < 120) paceScore = 7;
    else if (estimatedWPM > 170 && estimatedWPM <= 190) paceScore = 7;
    else if (estimatedWPM >= 80 && estimatedWPM < 100) paceScore = 5;
    else if (estimatedWPM > 190 && estimatedWPM <= 220) paceScore = 5;
    else if (estimatedWPM > 0) paceScore = 3;

    const fillerScore = clampScore(10 - fillerRate * 120 - fillerCount * 0.4);
    const confidenceScore = clampScore(
      8 - hedgeRate * 80 - hedgeCount * 0.35 + Math.min(2, exampleMarkerCount)
    );
    const structureScore = clampScore(
      4 + Math.min(4, structureMarkerCount) + Math.min(2, exampleMarkerCount)
    );

    const averageVolume = audioMetrics?.averageVolume ?? 0;
    const peakVolume = audioMetrics?.peakVolume ?? 0;
    const volumeVariation = audioMetrics?.volumeVariation ?? 0;
    const silenceRatio = audioMetrics?.silenceRatio ?? 0;
    const lowVolumeRatio = audioMetrics?.lowVolumeRatio ?? 0;
    const estimatedPauseCount = audioMetrics?.estimatedPauseCount ?? 0;
    const longPauseCount = audioMetrics?.longPauseCount ?? 0;
    const voicedFrameRatio = audioMetrics?.voicedFrameRatio ?? 0;

    const energyScore = clampScore(
      5 +
        Math.min(2, averageVolume / 8) +
        Math.min(2, volumeVariation / 6) -
        lowVolumeRatio * 3 -
        silenceRatio * 2
    );

    const clarityScore = clampScore(
      8 -
        fillerCount * 0.35 -
        repetitionCount * 0.4 -
        longPauseCount * 0.5 -
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

    if (paceScore >= 8) strengths.push("Your speaking pace was controlled and interview-appropriate.");
    else improvements.push("Adjust your pace. Aim for roughly 120–170 words per minute.");

    if (fillerScore >= 8) strengths.push("You used few filler words.");
    else improvements.push("Reduce filler words such as um, er, like, and you know.");

    if (confidenceScore >= 8) strengths.push("Your language sounded confident and credible.");
    else improvements.push("Use more decisive wording and avoid hedging phrases such as maybe, I think, or probably.");

    if (structureScore >= 8) strengths.push("Your answer showed signs of clear structure.");
    else improvements.push("Use a clearer structure such as Situation, Task, Action, Result.");

    if (energyScore < 6) improvements.push("Increase vocal energy and avoid speaking too softly or with long silences.");

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
        fillerRate: Number(fillerRate.toFixed(3)),
        hedgeCount,
        hedgeRate: Number(hedgeRate.toFixed(3)),
        repetitionCount,
        structureMarkerCount,
        exampleMarkerCount,
        estimatedWPM,
        averageSentenceLength,
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
        strengths,
        improvements,
      },
      evidence: {
        fillersDetected,
        hedgesDetected,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while analysing voice delivery." },
      { status: 500 }
    );
  }
}