import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/app/lib/rateLimit";
import {
  resolveCandidatePlanFromClaims,
  type CandidateBillingMeta,
} from "@/app/lib/candidatePlan";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Filler words we detect in the Whisper transcript.
 * Multi-word fillers ("you know", "sort of") are also listed so we can
 * count them, but the regex uses \b boundaries to avoid false positives.
 */
const FILLER_WORDS = [
  "um",
  "umm",
  "uh",
  "er",
  "err",
  "erm",
  "ah",
  "like",
  "you know",
  "sort of",
  "kind of",
  "basically",
  "actually",
  "literally",
];

function countPhrase(text: string, phrase: string): number {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "gi");
  return (text.match(regex) || []).length;
}

function getFileExtension(mimeType: string): string {
  if (mimeType.startsWith("audio/webm")) return "webm";
  if (mimeType.startsWith("audio/ogg"))  return "ogg";
  if (mimeType.startsWith("audio/mp4"))  return "mp4";
  if (mimeType.startsWith("audio/mpeg")) return "mp3";
  if (mimeType.startsWith("audio/wav"))  return "wav";
  return "webm";
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in." },
        { status: 401 }
      );
    }

    // Voice transcription (Whisper) is a paid feature — Free users are
    // keyboard-only. Gate from JWT claims (no extra Clerk API call).
    const plan = resolveCandidatePlanFromClaims(
      sessionClaims as { metadata?: CandidateBillingMeta } | null
    );
    if (!plan.isUnlimited) {
      return NextResponse.json(
        { error: "Voice practice is available on Plus, Professional, or your free trial." },
        { status: 403 }
      );
    }

    // Whisper is billed per audio-minute — fail closed if the limiter is down.
    const rateLimitResult = await checkRateLimit(userId, "whisper-filler", 30, 60, {
      failClosed: true,
    });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rateLimitResult.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const audioFile = formData.get("audio");

    if (!audioFile || !(audioFile instanceof Blob)) {
      return NextResponse.json(
        { error: "Audio file is required." },
        { status: 400 }
      );
    }

    // Whisper requires a named File with the right extension.
    const mimeType = audioFile.type || "audio/webm";
    const ext = getFileExtension(mimeType);
    const namedFile = new File([audioFile], `answer.${ext}`, { type: mimeType });

    // If the recording is suspiciously small it's likely silence or a
    // recording error — skip the API call and return an empty result.
    if (namedFile.size < 1500) {
      return NextResponse.json({ transcript: "", fillerCount: 0, fillersDetected: [] });
    }

    /**
     * Optional preceding context sent by the client when doing incremental
     * chunk-by-chunk polling.  Passing the previous Whisper result as the
     * prompt gives the model continuity across chunk boundaries.
     */
    const contextField = formData.get("context");
    const contextText =
      typeof contextField === "string" ? contextField.trim() : "";

    /**
     * The prompt primes Whisper to transcribe disfluencies.  Whisper uses the
     * prompt as a stylistic hint — including filler words here biases the model
     * toward keeping them rather than cleaning them away.
     */
    const fillerHint =
      "Um, uh, er, erm, ah. The speaker may use filler words and hesitation sounds.";
    const whisperPrompt = contextText
      ? `${contextText} ${fillerHint}`
      : `${fillerHint} This is a spoken English interview answer.`;

    const transcription = await openai.audio.transcriptions.create({
      file: namedFile,
      model: "whisper-1",
      language: "en",
      prompt: whisperPrompt,
      response_format: "text",
    });

    const transcript = typeof transcription === "string" ? transcription.trim() : "";

    // Count each filler in the Whisper transcript and return per-word breakdown.
    const fillerCounts: Record<string, number> = {};
    for (const word of FILLER_WORDS) {
      const count = countPhrase(transcript, word);
      if (count > 0) fillerCounts[word] = count;
    }
    const fillerCount = Object.values(fillerCounts).reduce((a, b) => a + b, 0);
    const fillersDetected = Object.keys(fillerCounts);

    return NextResponse.json({ transcript, fillerCount, fillerCounts, fillersDetected });
  } catch (error) {
    console.error("WHISPER FILLER API ERROR:", error);
    // Return empty rather than an error so the UI degrades gracefully.
    return NextResponse.json({ transcript: "", fillerCount: 0, fillersDetected: [] });
  }
}
