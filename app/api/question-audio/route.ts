import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

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
  slow: 0.84,
  natural: 0.94,
  energetic: 1.04,
};

const accentInstructionMap: Record<SpeakerAccent, string> = {
  british: "Use a clear, natural British English accent.",
  american: "Use a clear, natural American English accent.",
  neutral: "Use a clear, neutral international English accent.",
};

const voiceInstructionMap: Record<SpeakerVoice, string> = {
  female: "Use a warm, composed female-presenting interviewer voice.",
  male: "Use a warm, composed male-presenting interviewer voice.",
  neutral: "Use a balanced, neutral-presenting interviewer voice.",
};

const paceInstructionMap: Record<SpeakerPace, string> = {
  slow: "Speak slightly slower than normal with clear pauses.",
  natural: "Speak at a natural conversational pace.",
  energetic: "Speak with slightly more energy while staying professional.",
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
  return text.replace(/\s+/g, " ").trim().slice(0, 1100);
}

function buildInstructions(speakerPreference: SpeakerPreference) {
  return [
    "Read only the interview question. Do not add commentary.",
    "Sound calm, premium, human and professional.",
    voiceInstructionMap[speakerPreference.voice],
    accentInstructionMap[speakerPreference.accent],
    paceInstructionMap[speakerPreference.pace],
    "Use natural emphasis and end cleanly.",
  ].join(" ");
}

async function createOpenAiSpeechResponse({
  apiKey,
  text,
  speakerPreference,
}: {
  apiKey: string;
  text: string;
  speakerPreference: SpeakerPreference;
}) {
  return fetch(OPENAI_TTS_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini-tts",
      voice: voiceMap[speakerPreference.voice],
      input: text,
      response_format: "mp3",
      speed: speedMap[speakerPreference.pace],
      instructions: buildInstructions(speakerPreference),
    }),
  });
}

async function getOpenAiErrorMessage(response: Response) {
  let errorMessage = "Unable to generate natural question audio.";

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

export async function GET(request: NextRequest) {
  try {
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

    const response = await createOpenAiSpeechResponse({
      apiKey,
      text,
      speakerPreference,
    });

    if (!response.ok) {
      const errorMessage = await getOpenAiErrorMessage(response);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    if (!response.body) {
      const audioBuffer = await response.arrayBuffer();

      return new NextResponse(audioBuffer, {
        status: 200,
        headers: {
          "Content-Type": "audio/mpeg",
          "Cache-Control": "no-store",
          "X-AIM-Audio-Mode": "buffer",
        },
      });
    }

    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-AIM-Audio-Mode": "stream",
      },
    });
  } catch (error) {
    console.error("Question audio stream route failed:", error);

    return NextResponse.json(
      { error: "Something went wrong while streaming natural question audio." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
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

    const response = await createOpenAiSpeechResponse({
      apiKey,
      text,
      speakerPreference,
    });

    if (!response.ok) {
      const errorMessage = await getOpenAiErrorMessage(response);
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
        "X-AIM-Audio-Mode": "post-buffer",
      },
    });
  } catch (error) {
    console.error("Question audio route failed:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating natural question audio." },
      { status: 500 }
    );
  }
}