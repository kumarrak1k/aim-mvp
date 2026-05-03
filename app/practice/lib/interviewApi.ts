import type {
  AudioMetrics,
  CandidateProfile,
  Feedback,
  InterviewSummary,
  ResultItem,
  VideoAnalysis,
  VideoMetrics,
  VoiceAnalysis,
} from "../types";

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

export const fetchInterviewQuestion = async ({
  role,
  questionNumber,
  totalQuestions,
  history,
}: {
  role: string;
  questionNumber: number;
  totalQuestions: number;
  history: ResultItem[];
}) => {
  const data = await postJson<
    { question?: string },
    {
      role: string;
      questionNumber: number;
      totalQuestions: number;
      history: Array<{ question: string; answer: string }>;
    }
  >("/api/interview", {
    role,
    questionNumber,
    totalQuestions,
    history: history.map((item) => ({
      question: item.question,
      answer: item.answer,
    })),
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
}: {
  question: string;
  answer: string;
  voiceAnalysis: VoiceAnalysis | null;
  videoAnalysis: VideoAnalysis | null;
}) => {
  return postJson<
    Feedback,
    {
      question: string;
      answer: string;
      voiceAnalysis: VoiceAnalysis | null;
      videoAnalysis: VideoAnalysis | null;
    }
  >("/api/feedback", {
    question,
    answer,
    voiceAnalysis,
    videoAnalysis,
  });
};

export const fetchInterviewSummary = async ({
  role,
  results,
}: {
  role: string;
  results: ResultItem[];
}) => {
  return postJson<
    InterviewSummary,
    {
      role: string;
      results: ResultItem[];
    }
  >("/api/summary", {
    role,
    results,
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

export const fetchQuestionAudioBlob = async (text: string) => {
  const response = await fetch("/api/question-audio", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
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
