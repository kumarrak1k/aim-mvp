import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const OPENAI_TTS_ENDPOINT = "https://api.openai.com/v1/audio/speech";

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
        voice: "nova",
        input: safeText,
        response_format: "mp3",
        speed: 0.9,
        instructions:
          "You are a world-class British interview coach speaking one interview question to a candidate. Sound human, calm, warm, premium and conversational. Use natural pacing and short pauses between clauses. Do not sound robotic, synthetic, rushed, theatrical or salesy. Read the question clearly, with gentle emphasis on key words. End cleanly without adding extra commentary.",
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
