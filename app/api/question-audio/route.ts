import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { MODEL_TTS } from "@/app/lib/aiModels";
import {
  resolveCandidatePlanReliable,
  type CandidateBillingMeta,
} from "@/app/lib/candidatePlan";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Increase the Vercel function timeout to 30 s so longer TTS responses
// can complete. The real fix is streaming (below), but this is a safety net.
export const maxDuration = 30;

const OPENAI_TTS_ENDPOINT = "https://api.openai.com/v1/audio/speech";

type SpeakerVoice = "female" | "male";
type SpeakerPace = "slow" | "natural" | "energetic";

type SpeakerPreference = {
  voice: SpeakerVoice;
  pace: SpeakerPace;
};

const DEFAULT_SPEAKER_PREFERENCE: SpeakerPreference = {
  voice: "female",
  pace: "natural",
};

const SPEAKER_VOICES: SpeakerVoice[] = ["female", "male"];
const SPEAKER_PACES: SpeakerPace[] = ["slow", "natural", "energetic"];

// Chosen by ear from a blind audition of all 13 voices under the British brief
// below. OpenAI documents no accent, nationality or gender for any voice — the
// docs say only "Voices are currently optimized for English" — so there is no
// specification to select against and listening is the only method available.
const voiceMap: Record<SpeakerVoice, string> = {
  female: "shimmer",
  male: "fable",
};

const speedMap: Record<SpeakerPace, number> = {
  slow: 0.94,
  natural: 1,
  energetic: 1.2,
};

// gpt-4o-mini-tts takes natural-language delivery instructions instead of a
// numeric speed. These make the accent preference (long accepted by this API
// but ignored by tts-1) actually change the voice.

const paceInstruction: Record<SpeakerPace, string> = {
  slow: "Speak slowly and deliberately, leaving space between sentences.",
  // Was "calm, natural pace" — wording that invited exactly the flat, dull
  // delivery this default is meant to avoid.
  natural: "Keep a brisk, engaged pace — unhurried, but never slow or ponderous.",
  energetic: "Speak with brisk, upbeat energy while staying clear.",
};

/**
 * The accent block is deliberately forceful and names specific phonetic
 * features. A single polite request for "a natural British English accent" was
 * largely ignored: these voices default to neutral American, and instructions
 * are the only accent lever the API offers, so shifting one needs an explicit
 * target plus negative constraints on what makes a voice read as American.
 */
const BRITISH_ACCENT_INSTRUCTION = [
  "Speak in a British English accent — standard Received Pronunciation, as heard on BBC Radio 4.",
  "This is essential and overrides your default pronunciation.",
  "Do NOT use an American accent.",
  "Specifically: use non-rhotic pronunciation — do not pronounce the R at the end of words like 'later', 'better' or 'sure'.",
  "Use the broad British A in words like 'chance', 'past' and 'ask'.",
  "Do not flap your T sounds — say 'better' with a clear T, never 'bedder'.",
].join(" ");

function buildInstructions(pref: SpeakerPreference): string {
  return [
    "You are a warm, experienced interviewer speaking with a candidate across a table.",
    BRITISH_ACCENT_INSTRUCTION,
    paceInstruction[pref.pace],
    "Sound conversational and genuinely curious, not like someone reading from a script.",
    "Vary your intonation naturally. Never flat or monotone.",
  ]
    .filter(Boolean)
    .join(" ");
}

/** tts-1 family: numeric speed, no instructions. Newer TTS models: reverse. */
function isLegacyTts(model: string) {
  return model.startsWith("tts-1");
}

function cleanSpeakerPreference(value: unknown): SpeakerPreference {
  const input = value as Partial<SpeakerPreference> | undefined;

  return {
    voice:
      typeof input?.voice === "string" &&
      SPEAKER_VOICES.includes(input.voice as SpeakerVoice)
        ? (input.voice as SpeakerVoice)
        : DEFAULT_SPEAKER_PREFERENCE.voice,
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
async function requestSpeech(
  apiKey: string,
  model: string,
  text: string,
  pref: SpeakerPreference
) {
  return fetch(OPENAI_TTS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      voice: voiceMap[pref.voice],
      input: text,
      response_format: "mp3",
      ...(isLegacyTts(model)
        ? { speed: speedMap[pref.pace] }
        : { instructions: buildInstructions(pref) }),
    }),
  });
}

async function fetchSpeechStream({
  apiKey,
  text,
  speakerPreference,
}: {
  apiKey: string;
  text: string;
  speakerPreference: SpeakerPreference;
}) {
  let model = MODEL_TTS;
  let response = await requestSpeech(apiKey, model, text, speakerPreference);

  // Safety net: if the configured model fails for any reason (bad override,
  // deprecation, instructions rejected), fall back to tts-1 so the
  // interviewer voice keeps working. tts-1 is the pre-July-2026 behaviour.
  if (!response.ok && !isLegacyTts(model)) {
    const errorMessage = await getOpenAiErrorMessage(response);
    console.error(`QUESTION AUDIO: ${model} failed (${errorMessage}); falling back to tts-1`);
    model = "tts-1";
    response = await requestSpeech(apiKey, model, text, speakerPreference);
  }

  if (!response.ok) {
    const errorMessage = await getOpenAiErrorMessage(response);
    throw new Error(errorMessage);
  }

  return { response, model };
}

function streamingAudioResponse(ttsResponse: Response, model: string) {
  return new NextResponse(ttsResponse.body, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "X-Audio-Mode": `${model}-streamed`,
      // Tell the client the transfer is chunked so it can buffer progressively
      "Transfer-Encoding": "chunked",
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to use question audio." },
        { status: 401 }
      );
    }

    // Spoken questions (TTS) are a paid feature — gate from JWT claims.
    const plan = await resolveCandidatePlanReliable(
      userId,
      sessionClaims as { metadata?: CandidateBillingMeta } | null
    );
    if (!plan.isUnlimited) {
      return NextResponse.json(
        { error: "Spoken questions are available on Plus, Professional, or your free trial." },
        { status: 403 }
      );
    }

    const rateLimitResult = await checkRateLimit(userId, "question-audio", 60, 60);
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

    const { response: ttsResponse, model } = await fetchSpeechStream({
      apiKey,
      text,
      speakerPreference,
    });

    return streamingAudioResponse(ttsResponse, model);
  } catch (error) {
    console.error("QUESTION AUDIO GET ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating interviewer voice." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to use question audio." },
        { status: 401 }
      );
    }

    // Spoken questions (TTS) are a paid feature — gate from JWT claims.
    const plan = await resolveCandidatePlanReliable(
      userId,
      sessionClaims as { metadata?: CandidateBillingMeta } | null
    );
    if (!plan.isUnlimited) {
      return NextResponse.json(
        { error: "Spoken questions are available on Plus, Professional, or your free trial." },
        { status: 403 }
      );
    }

    const rateLimitResult = await checkRateLimit(userId, "question-audio", 60, 60);
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

    const { response: ttsResponse, model } = await fetchSpeechStream({
      apiKey,
      text,
      speakerPreference,
    });

    return streamingAudioResponse(ttsResponse, model);
  } catch (error) {
    console.error("QUESTION AUDIO POST ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating interviewer voice." },
      { status: 500 }
    );
  }
}