export const fillerWords: string[] = [
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

export const hedgeWords: string[] = [
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
