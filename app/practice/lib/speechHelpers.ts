import type { AudioMetrics, VoiceAnalysis } from "../types";

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

export const clampScore = (value: number) => {
  return Math.max(0, Math.min(10, Math.round(value)));
};

export const countPhrase = (text: string, phrase: string) => {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "gi");
  return text.match(regex)?.length || 0;
};

export const getWords = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
};

export const normalizeSpeechGuardText = (text: string) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
};

export const speechGuardWords = (text: string) => {
  return normalizeSpeechGuardText(text).split(/\s+/).filter(Boolean);
};

export const stripQuestionLeakageFromTranscript = (
  transcript: string,
  activeQuestion: string
) => {
  const rawTranscript = transcript.trim();
  const rawQuestion = activeQuestion.trim();

  if (!rawTranscript || !rawQuestion) return rawTranscript;

  const transcriptWordsRaw = rawTranscript.split(/\s+/);
  const transcriptWordsNormalized = transcriptWordsRaw.map((word) =>
    normalizeSpeechGuardText(word)
  );

  const questionWords = speechGuardWords(rawQuestion);

  if (questionWords.length === 0 || transcriptWordsNormalized.length === 0) {
    return rawTranscript;
  }

  const normalizedTranscript = normalizeSpeechGuardText(rawTranscript);
  const normalizedQuestion = normalizeSpeechGuardText(rawQuestion);

  if (
    normalizedTranscript === normalizedQuestion ||
    normalizedQuestion.includes(normalizedTranscript)
  ) {
    return "";
  }

  let matchingPrefixWords = 0;

  for (
    let index = 0;
    index < Math.min(transcriptWordsNormalized.length, questionWords.length);
    index += 1
  ) {
    if (transcriptWordsNormalized[index] !== questionWords[index]) {
      break;
    }

    matchingPrefixWords += 1;
  }

  const strongPrefixMatch =
    matchingPrefixWords >= 5 ||
    matchingPrefixWords >= Math.floor(questionWords.length * 0.45);

  if (strongPrefixMatch) {
    return transcriptWordsRaw.slice(matchingPrefixWords).join(" ").trim();
  }

  const transcriptSet = new Set(transcriptWordsNormalized.filter(Boolean));
  const questionSet = new Set(questionWords);

  let overlapCount = 0;

  transcriptSet.forEach((word) => {
    if (questionSet.has(word)) {
      overlapCount += 1;
    }
  });

  const overlapRatio =
    overlapCount / Math.max(1, Math.min(transcriptSet.size, questionSet.size));

  const looksLikeOnlyQuestion =
    transcriptWordsNormalized.length <= questionWords.length + 4 &&
    overlapRatio >= 0.72;

  if (looksLikeOnlyQuestion) {
    return "";
  }

  return rawTranscript;
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
    (sum, word) => sum + countPhrase(transcript, word),
    0
  );

  const hedgeCount = hedgeWords.reduce(
    (sum, word) => sum + countPhrase(transcript, word),
    0
  );

  const fillersDetected = fillerWords.filter(
    (word) => countPhrase(transcript, word) > 0
  );

  const hedgesDetected = hedgeWords.filter(
    (word) => countPhrase(transcript, word) > 0
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
