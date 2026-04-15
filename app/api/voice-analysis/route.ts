import { NextResponse } from "next/server";

type AudioMetrics = {
  averageVolume: number;
  peakVolume: number;
  volumeVariation: number;
  silenceRatio: number;
  lowVolumeRatio: number;
  estimatedPauseCount: number;
  longPauseCount: number;
  voicedFrameRatio: number;
};

type VoiceAnalysisResponse = {
  paceScore: number;
  fillerScore: number;
  confidenceScore: number;
  energyScore: number;
  overallVoiceScore: number;
  metrics: {
    wordCount: number;
    sentenceCount: number;
    fillerCount: number;
    fillerRate: number;
    hedgeCount: number;
    repetitionCount: number;
    structureMarkerCount: number;
    exampleMarkerCount: number;
    estimatedWPM: number;
    averageSentenceLength: number;
    averageVolume: number;
    peakVolume: number;
    volumeVariation: number;
    silenceRatio: number;
    lowVolumeRatio: number;
    estimatedPauseCount: number;
    longPauseCount: number;
    voicedFrameRatio: number;
  };
  feedback: {
    strengths: string[];
    improvements: string[];
  };
  evidence: {
    fillersDetected: string[];
    hedgesDetected: string[];
    repeatedPhrasesDetected: string[];
  };
};

const SINGLE_FILLERS: string[] = [
  "um",
  "uh",
  "erm",
  "ah",
  "eh",
  "hmm",
  "like",
  "basically",
  "actually",
  "literally",
  "obviously",
  "right",
];

const MULTI_FILLERS: string[] = [
  "you know",
  "i mean",
  "to be honest",
  "if that makes sense",
  "or something",
  "and stuff",
  "kind of",
  "sort of",
];

const HEDGING_PHRASES: string[] = [
  "i think",
  "i guess",
  "maybe",
  "probably",
  "perhaps",
  "i feel like",
  "i would say",
  "i'm not sure",
  "i am not sure",
  "i don't know",
  "i do not know",
  "hopefully",
  "i suppose",
  "possibly",
];

const STRUCTURE_MARKERS: string[] = [
  "first",
  "firstly",
  "second",
  "secondly",
  "third",
  "thirdly",
  "finally",
  "overall",
  "in summary",
  "to summarise",
  "to summarize",
  "for example",
  "for instance",
  "specifically",
  "in particular",
  "the situation",
  "my task",
  "the action i took",
  "the result was",
];

const EXAMPLE_MARKERS: string[] = [
  "for example",
  "for instance",
  "specifically",
  "in my last role",
  "during university",
  "during my placement",
  "on one occasion",
  "one example",
  "a good example",
  "the result was",
];

function clampScore(value: number): number {
  return Math.max(1, Math.min(10, Math.round(value)));
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function countPhraseOccurrences(
  text: string,
  phrases: string[]
): { count: number; found: string[] } {
  let count = 0;
  const found: string[] = [];

  for (const phrase of phrases) {
    const regex = new RegExp(`\\b${escapeRegex(phrase)}\\b`, "gi");
    const matches = text.match(regex);

    if (matches) {
      count += matches.length;
      found.push(...matches.map((): string => phrase));
    }
  }

  return { count, found };
}

function countRepeatedWords(
  words: string[]
): { count: number; repeated: string[] } {
  let count = 0;
  const repeated: string[] = [];

  for (let i = 1; i < words.length; i++) {
    const previousWord = words[i - 1].toLowerCase();
    const currentWord = words[i].toLowerCase();

    if (
      previousWord === currentWord &&
      previousWord.length > 1 &&
      !["i", "a"].includes(previousWord)
    ) {
      count += 1;
      repeated.push(`${currentWord} ${currentWord}`);
    }
  }

  return { count, repeated };
}

function extractSentences(transcript: string): string[] {
  return transcript
    .split(/[.!?]+/)
    .map((sentence: string): string => sentence.trim())
    .filter((sentence: string): boolean => Boolean(sentence));
}

function normaliseAudioMetrics(input: unknown): AudioMetrics {
  if (!input || typeof input !== "object") {
    return {
      averageVolume: 0,
      peakVolume: 0,
      volumeVariation: 0,
      silenceRatio: 1,
      lowVolumeRatio: 1,
      estimatedPauseCount: 0,
      longPauseCount: 0,
      voicedFrameRatio: 0,
    };
  }

  const raw = input as Partial<Record<keyof AudioMetrics, unknown>>;

  const getNumber = (key: keyof AudioMetrics, fallback = 0): number => {
    const value = raw[key];
    return typeof value === "number" && Number.isFinite(value) ? value : fallback;
  };

  return {
    averageVolume: getNumber("averageVolume"),
    peakVolume: getNumber("peakVolume"),
    volumeVariation: getNumber("volumeVariation"),
    silenceRatio: getNumber("silenceRatio", 1),
    lowVolumeRatio: getNumber("lowVolumeRatio", 1),
    estimatedPauseCount: getNumber("estimatedPauseCount"),
    longPauseCount: getNumber("longPauseCount"),
    voicedFrameRatio: getNumber("voicedFrameRatio"),
  };
}

export async function POST(req: Request) {
  try {
    const body: unknown = await req.json();
    const parsedBody =
      body && typeof body === "object" ? (body as Record<string, unknown>) : {};

    const transcript =
      typeof parsedBody.transcript === "string"
        ? parsedBody.transcript.trim()
        : "";

    const durationSeconds =
      typeof parsedBody.durationSeconds === "number" &&
      parsedBody.durationSeconds > 0
        ? parsedBody.durationSeconds
        : null;

    const audioMetrics = normaliseAudioMetrics(parsedBody.audioMetrics);

    if (!transcript) {
      return NextResponse.json({ error: "Missing transcript" }, { status: 400 });
    }

    const normalisedTranscript = transcript.replace(/\s+/g, " ").trim();
    const lowerTranscript = normalisedTranscript.toLowerCase();

    const words: string[] = normalisedTranscript
      .split(/\s+/)
      .map((word: string): string => word.replace(/[^\w'-]/g, ""))
      .filter((word: string): boolean => Boolean(word));

    const wordCount = words.length;
    const sentences = extractSentences(normalisedTranscript);
    const sentenceCount = sentences.length || 1;
    const averageSentenceLength =
      sentenceCount > 0 ? Number((wordCount / sentenceCount).toFixed(1)) : wordCount;

    const singleFillerResult = countPhraseOccurrences(lowerTranscript, SINGLE_FILLERS);
    const multiFillerResult = countPhraseOccurrences(lowerTranscript, MULTI_FILLERS);
    const hedgeResult = countPhraseOccurrences(lowerTranscript, HEDGING_PHRASES);
    const structureResult = countPhraseOccurrences(lowerTranscript, STRUCTURE_MARKERS);
    const exampleResult = countPhraseOccurrences(lowerTranscript, EXAMPLE_MARKERS);
    const repetitionResult = countRepeatedWords(words);

    const fillerCount = singleFillerResult.count + multiFillerResult.count;
    const hedgeCount = hedgeResult.count;
    const repetitionCount = repetitionResult.count;
    const structureMarkerCount = structureResult.count;
    const exampleMarkerCount = exampleResult.count;
    const fillerRate = wordCount > 0 ? fillerCount / wordCount : 0;

    const estimatedWPM =
      durationSeconds && durationSeconds > 0
        ? Math.round((wordCount / durationSeconds) * 60)
        : 0;

    const {
      averageVolume,
      peakVolume,
      volumeVariation,
      silenceRatio,
      lowVolumeRatio,
      estimatedPauseCount,
      longPauseCount,
      voicedFrameRatio,
    } = audioMetrics;

    let paceScore = 5;

    if (!durationSeconds || estimatedWPM === 0) {
      paceScore = 4;
    } else if (estimatedWPM >= 120 && estimatedWPM <= 155) {
      paceScore = 9;
    } else if (estimatedWPM >= 105 && estimatedWPM <= 170) {
      paceScore = 7;
    } else if (estimatedWPM >= 90 && estimatedWPM <= 185) {
      paceScore = 5;
    } else if (estimatedWPM >= 75 && estimatedWPM <= 200) {
      paceScore = 3;
    } else {
      paceScore = 2;
    }

    if (wordCount < 35) paceScore -= 1;
    if (wordCount < 20) paceScore -= 1;
    if (longPauseCount >= 3) paceScore -= 1;
    if (silenceRatio > 0.45) paceScore -= 1;

    paceScore = clampScore(paceScore);

    let fillerScore = 10;

    if (fillerCount >= 2) fillerScore -= 1;
    if (fillerCount >= 4) fillerScore -= 2;
    if (fillerCount >= 7) fillerScore -= 2;
    if (fillerCount >= 10) fillerScore -= 2;

    if (fillerRate >= 0.03) fillerScore -= 1;
    if (fillerRate >= 0.06) fillerScore -= 1;
    if (fillerRate >= 0.1) fillerScore -= 1;

    if (repetitionCount >= 2) fillerScore -= 1;
    if (repetitionCount >= 4) fillerScore -= 1;

    fillerScore = clampScore(fillerScore);

    let energyScore = 8;

    if (averageVolume < 8) energyScore -= 4;
    else if (averageVolume < 12) energyScore -= 3;
    else if (averageVolume < 16) energyScore -= 2;
    else if (averageVolume < 20) energyScore -= 1;

    if (peakVolume < 20) energyScore -= 2;
    else if (peakVolume < 28) energyScore -= 1;

    if (volumeVariation < 4) energyScore -= 2;
    else if (volumeVariation < 7) energyScore -= 1;

    if (lowVolumeRatio > 0.7) energyScore -= 2;
    else if (lowVolumeRatio > 0.5) energyScore -= 1;

    if (silenceRatio > 0.45) energyScore -= 2;
    else if (silenceRatio > 0.3) energyScore -= 1;

    if (voicedFrameRatio < 0.45) energyScore -= 1;

    energyScore = clampScore(energyScore);

    let confidenceScore = 9;

    if (hedgeCount >= 1) confidenceScore -= 1;
    if (hedgeCount >= 3) confidenceScore -= 2;
    if (hedgeCount >= 5) confidenceScore -= 2;

    if (fillerCount >= 4) confidenceScore -= 1;
    if (fillerCount >= 8) confidenceScore -= 1;

    if (repetitionCount >= 2) confidenceScore -= 1;
    if (repetitionCount >= 4) confidenceScore -= 1;

    if (wordCount < 30) confidenceScore -= 1;
    if (wordCount < 18) confidenceScore -= 1;

    if (averageSentenceLength > 30) confidenceScore -= 1;
    if (averageSentenceLength < 6 && wordCount > 20) confidenceScore -= 1;

    if (averageVolume < 12) confidenceScore -= 2;
    else if (averageVolume < 16) confidenceScore -= 1;

    if (volumeVariation < 4) confidenceScore -= 2;
    else if (volumeVariation < 7) confidenceScore -= 1;

    if (longPauseCount >= 2) confidenceScore -= 1;
    if (longPauseCount >= 4) confidenceScore -= 1;

    if (silenceRatio > 0.4) confidenceScore -= 1;
    if (lowVolumeRatio > 0.65) confidenceScore -= 1;

    if (structureMarkerCount >= 1) confidenceScore += 1;
    if (exampleMarkerCount >= 1) confidenceScore += 1;

    confidenceScore = clampScore(confidenceScore);

    let overallVoiceScore =
      paceScore * 0.15 +
      fillerScore * 0.25 +
      energyScore * 0.3 +
      confidenceScore * 0.3;

    if (averageVolume < 12 && volumeVariation < 5) overallVoiceScore -= 1.5;
    if (silenceRatio > 0.45) overallVoiceScore -= 1;
    if (fillerCount >= 8 && hedgeCount >= 3) overallVoiceScore -= 1;
    if (wordCount < 20) overallVoiceScore -= 1;
    if (repetitionCount >= 4) overallVoiceScore -= 1;
    if (structureMarkerCount === 0 && wordCount > 50) overallVoiceScore -= 0.5;

    overallVoiceScore = clampScore(overallVoiceScore);

    const strengths: string[] = [];
    const improvements: string[] = [];

    if (paceScore >= 8) {
      strengths.push("Your speaking pace is controlled and easy to follow.");
    } else if (paceScore <= 4) {
      if (estimatedWPM > 185) {
        improvements.push(
          `You are speaking too quickly at around ${estimatedWPM} words per minute. Slow down so your points land more clearly.`
        );
      } else if (estimatedWPM > 0 && estimatedWPM < 90) {
        improvements.push(
          `You are speaking quite slowly at around ${estimatedWPM} words per minute. Aim for a steadier interview pace.`
        );
      } else {
        improvements.push("Work on a steadier speaking pace with fewer broken pauses.");
      }
    }

    if (fillerScore >= 8 && fillerCount <= 2) {
      strengths.push("You use very few filler words, which keeps the answer cleaner.");
    } else {
      improvements.push(
        `Reduce filler words and verbal crutches. I detected ${fillerCount} filler ${
          fillerCount === 1 ? "instance" : "instances"
        }, which weakens polish.`
      );
    }

    if (energyScore >= 8) {
      strengths.push("Your vocal energy is strong enough to keep the answer engaging.");
    } else {
      if (averageVolume < 16) {
        improvements.push(
          "Your voice sounds too quiet overall. Speak a little louder and project more clearly."
        );
      }

      if (volumeVariation < 7) {
        improvements.push(
          "Your delivery sounds too flat. Add more vocal variation so the answer feels more confident and engaged."
        );
      }

      if (silenceRatio > 0.3) {
        improvements.push(
          "There is too much silence between phrases. Try to connect ideas more smoothly."
        );
      }

      if (longPauseCount >= 2) {
        improvements.push(
          `You had ${longPauseCount} long pauses. Short pauses are fine, but long gaps can make you sound uncertain.`
        );
      }
    }

    if (confidenceScore >= 8) {
      strengths.push("Your wording comes across as reasonably direct and self-assured.");
    } else {
      if (hedgeCount >= 3) {
        improvements.push(
          `Your answer uses too much uncertain language (${hedgeCount} hedge phrases detected). Replace phrases like "I think" or "maybe" with firmer statements.`
        );
      }

      if (repetitionCount >= 2) {
        improvements.push(
          `There are repeated words or restart patterns in your answer (${repetitionCount} detected). Pause briefly instead of restarting the sentence.`
        );
      }

      if (structureMarkerCount === 0 && wordCount > 45) {
        improvements.push(
          "Your delivery would sound more confident with clearer structure. Use signposts like “first”, “for example”, and “the result was”."
        );
      }

      if (averageVolume < 14 && volumeVariation < 6) {
        improvements.push(
          "Your delivery sounds low-energy and under-confident. Increase projection and vary your voice more deliberately."
        );
      }
    }

    if (structureMarkerCount >= 2) {
      strengths.push("Your answer includes useful structure markers, which helps it sound organised.");
    }

    if (exampleMarkerCount >= 1) {
      strengths.push("You support your points with example-style wording, which improves credibility.");
    } else if (wordCount > 35) {
      improvements.push(
        "Add a concrete example to make the answer sound more convincing and less generic."
      );
    }

    if (wordCount < 20) {
      improvements.push(
        "Your answer is very short. Expand your point so your delivery sounds more developed and persuasive."
      );
    }

    if (averageSentenceLength > 30) {
      improvements.push(
        "Some sentences are too long, which makes the delivery sound rambling. Break ideas into shorter points."
      );
    }

    if (strengths.length === 0) {
      if (overallVoiceScore >= 7) {
        strengths.push("Your delivery has some solid foundations, but still has room to sharpen.");
      } else {
        strengths.push("You completed the response, which gives you a base to improve from.");
      }
    }

    if (improvements.length === 0) {
      improvements.push("Keep refining delivery by being clearer, more direct, and more expressive.");
    }

    const response: VoiceAnalysisResponse = {
      paceScore,
      fillerScore,
      confidenceScore,
      energyScore,
      overallVoiceScore,
      metrics: {
        wordCount,
        sentenceCount,
        fillerCount,
        fillerRate: Number(fillerRate.toFixed(3)),
        hedgeCount,
        repetitionCount,
        structureMarkerCount,
        exampleMarkerCount,
        estimatedWPM,
        averageSentenceLength,
        averageVolume: Number(averageVolume.toFixed(2)),
        peakVolume: Number(peakVolume.toFixed(2)),
        volumeVariation: Number(volumeVariation.toFixed(2)),
        silenceRatio: Number(silenceRatio.toFixed(3)),
        lowVolumeRatio: Number(lowVolumeRatio.toFixed(3)),
        estimatedPauseCount,
        longPauseCount,
        voicedFrameRatio: Number(voicedFrameRatio.toFixed(3)),
      },
      feedback: {
        strengths,
        improvements,
      },
      evidence: {
        fillersDetected: [
          ...new Set([...singleFillerResult.found, ...multiFillerResult.found]),
        ].slice(0, 8),
        hedgesDetected: [...new Set(hedgeResult.found)].slice(0, 8),
        repeatedPhrasesDetected: [...new Set(repetitionResult.repeated)].slice(0, 8),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Voice analysis failed:", error);
    return NextResponse.json({ error: "Voice analysis failed" }, { status: 500 });
  }
}