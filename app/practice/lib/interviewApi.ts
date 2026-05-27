import type {
  AudioMetrics,
  CandidateProfile,
  Feedback,
  InterviewSummary,
  ResultItem,
  SpeakerPreference,
  VideoAnalysis,
  VideoMetrics,
  VoiceAnalysis,
} from "../types";
import type { QuestionMix } from "../session/utils";

const postJson = async <TResponse, TBody>(
  url: string,
  body: TBody
): Promise<TResponse> => {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || `Request failed: ${url}`);
  }

  return data as TResponse;
};

export const fetchCandidateProfile = async () => {
  const response = await fetch("/api/candidate-profile", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    throw new Error(data.error || "Failed to load candidate profile.");
  }

  return (data.profile || null) as CandidateProfile | null;
};

export type AssessmentTemplateContext = {
  customInstructions?: string;
  competencyFramework?: string;
  templateName?: string;
  companyName?: string;
};

export const fetchInterviewQuestion = async ({
  role,
  questionNumber,
  totalQuestions,
  history,
  assessmentMode,
  templateContext,
  questionMix,
}: {
  role: string;
  questionNumber: number;
  totalQuestions: number;
  history: ResultItem[];
  assessmentMode?: boolean;
  templateContext?: AssessmentTemplateContext;
  questionMix?: QuestionMix;
}) => {
  const data = await postJson<
    { question?: string },
    {
      role: string;
      questionNumber: number;
      totalQuestions: number;
      history: Array<{ question: string; answer: string }>;
      assessmentMode?: boolean;
      templateContext?: AssessmentTemplateContext;
      questionMix?: QuestionMix;
    }
  >("/api/interview", {
    role,
    questionNumber,
    totalQuestions,
    history: history.map((item) => ({
      question: item.question,
      answer: item.answer,
    })),
    ...(assessmentMode ? { assessmentMode: true } : {}),
    ...(templateContext ? { templateContext } : {}),
    ...(questionMix ? { questionMix } : {}),
  });

  return data.question || "Tell me about yourself.";
};

export const fetchVoiceAnalysis = async ({
  transcript,
  durationSeconds,
  audioMetrics,
}: {
  transcript: string;
  durationSeconds: number | null;
  audioMetrics: AudioMetrics;
}) => {
  return postJson<
    VoiceAnalysis,
    {
      transcript: string;
      durationSeconds: number | null;
      audioMetrics: AudioMetrics;
    }
  >("/api/voice-analysis", {
    transcript,
    durationSeconds,
    audioMetrics,
  });
};

export const fetchVideoAnalysis = async (metrics: VideoMetrics) => {
  return postJson<VideoAnalysis, { metrics: VideoMetrics }>(
    "/api/video-analysis",
    { metrics }
  );
};

export const fetchFeedback = async ({
  question,
  answer,
  voiceAnalysis,
  videoAnalysis,
  practiceMode,
  assessmentMode,
  templateContext,
}: {
  question: string;
  answer: string;
  voiceAnalysis: VoiceAnalysis | null;
  videoAnalysis: VideoAnalysis | null;
  practiceMode?: string;
  assessmentMode?: boolean;
  templateContext?: AssessmentTemplateContext;
}) => {
  return postJson<
    Feedback,
    {
      question: string;
      answer: string;
      voiceAnalysis: VoiceAnalysis | null;
      videoAnalysis: VideoAnalysis | null;
      practiceMode?: string;
      assessmentMode?: boolean;
      templateContext?: AssessmentTemplateContext;
    }
  >("/api/feedback", {
    question,
    answer,
    voiceAnalysis,
    videoAnalysis,
    ...(practiceMode ? { practiceMode } : {}),
    ...(assessmentMode ? { assessmentMode: true } : {}),
    ...(templateContext ? { templateContext } : {}),
  });
};

export const fetchInterviewSummary = async ({
  role,
  results,
  practiceMode,
  assessmentMode,
  templateContext,
}: {
  role: string;
  results: ResultItem[];
  practiceMode?: string;
  assessmentMode?: boolean;
  templateContext?: AssessmentTemplateContext;
}) => {
  return postJson<
    InterviewSummary,
    {
      role: string;
      results: ResultItem[];
      practiceMode?: string;
      assessmentMode?: boolean;
      templateContext?: AssessmentTemplateContext;
    }
  >("/api/summary", {
    role,
    results,
    ...(practiceMode ? { practiceMode } : {}),
    ...(assessmentMode ? { assessmentMode: true } : {}),
    ...(templateContext ? { templateContext } : {}),
  });
};

export const cleanTranscript = async (transcript: string) => {
  if (!transcript.trim()) return transcript;

  const data = await postJson<
    { cleanedTranscript?: string },
    {
      transcript: string;
    }
  >("/api/clean-transcript", {
    transcript,
  });

  return data.cleanedTranscript?.trim() || transcript;
};

export type WhisperFillerResult = {
  transcript: string;
  fillerCount: number;
  fillerCounts: Record<string, number>;
  fillersDetected: string[];
};

/**
 * Sends the recorded audio blob to the Whisper filler-detection endpoint.
 * Optionally pass `context` (the previous Whisper transcript) when doing
 * incremental chunk-by-chunk polling — this gives the model continuity
 * across chunk boundaries.
 * Returns the Whisper transcript and filler analysis, or null on failure.
 */
export const fetchWhisperFillerAnalysis = async (
  audioBlob: Blob,
  context?: string
): Promise<WhisperFillerResult | null> => {
  try {
    const formData = new FormData();
    formData.append("audio", audioBlob);
    if (context) formData.append("context", context);

    const response = await fetch("/api/whisper-filler", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) return null;

    const data = await response.json() as Partial<WhisperFillerResult>;

    return {
      transcript: data.transcript ?? "",
      fillerCount: data.fillerCount ?? 0,
      fillerCounts: data.fillerCounts ?? {},
      fillersDetected: data.fillersDetected ?? [],
    };
  } catch {
    return null;
  }
};

export const fetchQuestionAudioBlob = async (
  text: string,
  speakerPreference?: SpeakerPreference
) => {
  const response = await fetch("/api/question-audio", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, speakerPreference }),
  });

  if (!response.ok) {
    let message = "Question audio could not be prepared.";

    try {
      const data = await response.json();
      message = data.error || message;
    } catch {
      // Keep fallback message.
    }

    throw new Error(message);
  }

  return response.blob();
};