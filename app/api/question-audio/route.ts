import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/app/lib/rateLimit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Increase the Vercel function timeout to 30 s so longer TTS responses
// can complete. The real fix is streaming (below), but this is a safety net.
export const maxDuration = 30;

const OPENAI_TTS_ENDPOINT = "https://api.openai.com/v1/audio/speech";

type SpeakerVoice = "female" | "male" | "neutral";
type SpeakerAccent = "british" | "american" | "neutral";
type SpeakerPace = "slow" | "natural" | "energetic";

type SpeakerPreference = {
  voice: SpeakerVoice;
  accent: SpeakerAccent;
  pace: SpeakerPace;
};

const DEFAULT_SPEAKER_PREFERENCE: SpeakerPreference = {
  voice: "female",
  accent: "british",
  pace: "natural",
};

const SPEAKER_VOICES: SpeakerVoice[] = ["female", "male", "neutral"];
const SPEAKER_ACCENTS: SpeakerAccent[] = ["british", "american", "neutral"];
const SPEAKER_PACES: SpeakerPace[] = ["slow", "natural", "energetic"];

const voiceMap: Record<SpeakerVoice, string> = {
  female: "nova",
  male: "onyx",
  neutral: "alloy",
};

const speedMap: Record<SpeakerPace, number> = {
  slow: 0.94,
  natural: 1,
  energetic: 1.2,
};

function cleanSpeakerPreference(value: unknown): SpeakerPreference {
  const input = value as Partial<SpeakerPreference> | undefined;

  return {
    voice:
      typeof input?.voice === "string" &&
      SPEAKER_VOICES.includes(input.voice as SpeakerVoice)
        ? (input.voice as SpeakerVoice)
        : DEFAULT_SPEAKER_PREFERENCE.voice,
    accent:
      typeof input?.accent === "string" &&
      SPEAKER_ACCENTS.includes(input.accent as SpeakerAccent)
        ? (input.accent as SpeakerAccent)
        : DEFAULT_SPEAKER_PREFERENCE.accent,
    pace:
      typeof input?.pace === "string" &&
      SPEAKER_PACES.includes(input.pace as SpeakerPace)
        ? (input.pace as SpeakerPace)
        : DEFAULT_SPEAKER_PREFERENCE.pace,
  };
}

function cleanQuestionText(text: string) {
  // OpenAI TTS supports up to 4096 characters; we allow up to 4000 to give
  // a small safety margin. The previous 650-char cap was far too aggressive
  // for multi-sentence interview questions.
  return text.replace(/\s+/g, " ").trim().slice(0, 4000);
}

async function getOpenAiErrorMessage(response: Response) {
  let errorMessage = "Unable to generate interviewer voice.";

  try {
    const errorData = await response.json();
    errorMessage = errorData?.error?.message || errorMessage;
  } catch {
    // Keep fallback message.
  }

  return errorMessage;
}

function getApiKeyErrorResponse() {
  return NextResponse.json(
    { error: "OPENAI_API_KEY is not configured." },
    { status: 500 }
  );
}

function getMissingTextErrorResponse() {
  return NextResponse.json(
    { error: "Question text is required." },
    { status: 400 }
  );
}

/**
 * Stream OpenAI's TTS response body directly to the client.
 *
 * Previously we used `response.arrayBuffer()` which buffers the entire MP3
 * in the serverless function before sending anything. On a loaded OpenAI
 * endpoint a long question can take 10–15 s to fully generate, hitting
 * Vercel's default 10 s timeout and returning a truncated blob. The client
 * then caches that broken blob and every replay of that question is cut off
 * at the same word.
 *
 * With streaming the Vercel function forwards each chunk as it arrives, so
 * the function never sits idle long enough to be killed.
 */
async function fetchSpeechStream({
  apiKey,
  text,
  speakerPreference,
}: {
  apiKey: string;
  text: string;
  speakerPreference: SpeakerPreference;
}) {
  const response = await fetch(OPENAI_TTS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "tts-1",
      voice: voiceMap[speakerPreference.voice],
      input: text,
      response_format: "mp3",
      speed: speedMap[speakerPreference.pace],
    }),
  });

  if (!response.ok) {
    const errorMessage = await getOpenAiErrorMessage(response);
    throw new Error(errorMessage);
  }

  return response;
}

function streamingAudioResponse(ttsResponse: Response) {
  return new NextResponse(ttsResponse.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Audio-Mode": "tts-1-streamed",
      // Tell the client the transfer is chunked so it can buffer progressively
      "Transfer-Encoding": "chunked",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to use question audio." },
        { status: 401 }
      );
    }

    const rateLimitResult = checkRateLimit(userId, "question-audio", 60, 60);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rateLimitResult.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return getApiKeyErrorResponse();
    }

    const searchParams = request.nextUrl.searchParams;

    const text = cleanQuestionText(searchParams.get("text") || "");
    const speakerPreference = cleanSpeakerPreference({
      voice: searchParams.get("voice") || undefined,
      accent: searchParams.get("accent") || undefined,
      pace: searchParams.get("pace") || undefined,
    });

    if (!text) {
      return getMissingTextErrorResponse();
    }

    const ttsResponse = await fetchSpeechStream({
      apiKey,
      text,
      speakerPreference,
    });

    return streamingAudioResponse(ttsResponse);
  } catch (error) {
    console.error("QUESTION AUDIO GET ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while generating interviewer voice.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to use question audio." },
        { status: 401 }
      );
    }

    const rateLimitResult = checkRateLimit(userId, "question-audio", 60, 60);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rateLimitResult.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return getApiKeyErrorResponse();
    }

    const body = await request.json().catch(() => null);
    const text = cleanQuestionText(
      typeof body?.text === "string" ? body.text : ""
    );
    const speakerPreference = cleanSpeakerPreference(body?.speakerPreference);

    if (!text) {
      return getMissingTextErrorResponse();
    }

    const ttsResponse = await fetchSpeechStream({
      apiKey,
      text,
      speakerPreference,
    });

    return streamingAudioResponse(ttsResponse);
  } catch (error) {
    console.error("QUESTION AUDIO POST ERROR:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while generating interviewer voice.",
      },
      { status: 500 }
    );
  }
}