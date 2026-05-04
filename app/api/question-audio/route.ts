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
  slow: 0.82,
  natural: 0.92,
  energetic: 1.05,
};

const accentInstructionMap: Record<SpeakerAccent, string> = {
  british:
    "Use a clear, natural British accent suitable for a professional UK interview coach.",
  american:
    "Use a clear, natural American accent suitable for a professional interview coach.",
  neutral:
    "Use a clear, neutral international English accent suitable for a professional interview coach.",
};

const voiceInstructionMap: Record<SpeakerVoice, string> = {
  female:
    "Use a warm, composed female-presenting voice. Sound premium, calm and human.",
  male:
    "Use a warm, composed male-presenting voice. Sound premium, calm and human.",
  neutral:
    "Use a balanced, neutral-presenting voice. Sound premium, calm and human.",
};

const paceInstructionMap: Record<SpeakerPace, string> = {
  slow: "Speak slightly slower than normal, with thoughtful pauses for clarity.",
  natural: "Speak at a natural conversational pace, not rushed and not too slow.",
  energetic:
    "Speak with a little more energy and momentum while staying clear and professional.",
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

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const body = await request.json().catch(() => null);
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const speakerPreference = cleanSpeakerPreference(body?.speakerPreference);

    if (!text) {
      return NextResponse.json(
        { error: "Question text is required." },
        { status: 400 }
      );
    }

    const safeText = text.slice(0, 1800);

    const response = await fetch(OPENAI_TTS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini-tts",
        voice: voiceMap[speakerPreference.voice],
        input: safeText,
        response_format: "mp3",
        speed: speedMap[speakerPreference.pace],
        instructions: [
          "You are a world-class interview coach speaking one interview question to a candidate.",
          voiceInstructionMap[speakerPreference.voice],
          accentInstructionMap[speakerPreference.accent],
          paceInstructionMap[speakerPreference.pace],
          "Read only the interview question. Do not add extra commentary.",
          "Use natural pacing and short pauses between clauses.",
          "Do not sound robotic, synthetic, rushed, theatrical or salesy.",
          "Read the question clearly, with gentle emphasis on key words. End cleanly.",
        ].join(" "),
      }),
    });

    if (!response.ok) {
      let errorMessage = "Unable to generate natural question audio.";

      try {
        const errorData = await response.json();
        errorMessage = errorData?.error?.message || errorMessage;
      } catch {
        // Keep fallback message.
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    const audioBuffer = await response.arrayBuffer();

    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
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