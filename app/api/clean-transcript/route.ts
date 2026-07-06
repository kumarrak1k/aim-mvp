import { auth } from "@clerk/nextjs/server";
import OpenAI from "openai";
import { MODEL_UTILITY } from "@/app/lib/aiModels";
import { adaptRequestForModel } from "@/app/lib/openai-client";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { moderateText } from "@/app/lib/moderation";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function normaliseTranscriptToUkEnglish(value: string) {
  return value
    .replace(/\bresume\b/gi, "CV")
    .replace(/\brésumé\b/gi, "CV")
    .replace(/\bbehavioral\b/gi, "behavioural")
    .replace(/\bbehavior\b/gi, "behaviour")
    .replace(/\bbehaviors\b/gi, "behaviours")
    .replace(/\bprioritize\b/gi, "prioritise")
    .replace(/\bprioritized\b/gi, "prioritised")
    .replace(/\bprioritizing\b/gi, "prioritising")
    .replace(/\bprioritization\b/gi, "prioritisation")
    .replace(/\banalyze\b/gi, "analyse")
    .replace(/\banalyzed\b/gi, "analysed")
    .replace(/\banalyzing\b/gi, "analysing")
    .replace(/\borganization\b/gi, "organisation")
    .replace(/\borganizations\b/gi, "organisations")
    .replace(/\borganizational\b/gi, "organisational")
    .replace(/\borganize\b/gi, "organise")
    .replace(/\borganized\b/gi, "organised")
    .replace(/\borganizing\b/gi, "organising")
    .replace(/\boptimize\b/gi, "optimise")
    .replace(/\boptimized\b/gi, "optimised")
    .replace(/\boptimizing\b/gi, "optimising")
    .replace(/\boptimization\b/gi, "optimisation")
    .replace(/\bspecialize\b/gi, "specialise")
    .replace(/\bspecialized\b/gi, "specialised")
    .replace(/\bspecializing\b/gi, "specialising")
    .replace(/\bspecialization\b/gi, "specialisation")
    .replace(/\butilize\b/gi, "use")
    .replace(/\butilized\b/gi, "used")
    .replace(/\butilizing\b/gi, "using")
    .replace(/\butilization\b/gi, "use")
    .replace(/\bcolor\b/gi, "colour")
    .replace(/\bcolors\b/gi, "colours")
    .replace(/\bcenter\b/gi, "centre")
    .replace(/\bcenters\b/gi, "centres")
    .replace(/\bcredential\b/gi, "qualification")
    .replace(/\bcredentials\b/gi, "qualifications")
    .replace(/\bjob description\b/gi, "role specification")
    .replace(/\bcover letter\b/gi, "covering letter")
    .replace(/\s+/g, " ")
    .trim();
}

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return Response.json(
        { error: "You must be signed in to use transcript cleaning." },
        { status: 401 }
      );
    }

    const rateLimitResult = await checkRateLimit(userId, "clean-transcript", 30, 60);
    if (!rateLimitResult.allowed) {
      return Response.json(
        { error: `Too many requests. Please wait ${rateLimitResult.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    const { transcript } = await req.json();

    if (!transcript || typeof transcript !== "string") {
      return Response.json(
        { error: "Transcript is required." },
        { status: 400 }
      );
    }

    // Bound input so a giant paste can't run up token cost.
    if (transcript.length > 8000) {
      return Response.json({ error: "Transcript is too long." }, { status: 400 });
    }

    if ((await moderateText(transcript)).flagged) {
      return Response.json({ error: "This content can't be processed." }, { status: 400 });
    }

    const ukTranscript = normaliseTranscriptToUkEnglish(transcript);

    // Test pack: this route calls the OpenAI SDK directly (not callOpenAIChat),
    // so the mock seam can't intercept it — return the UK-normalised transcript
    // without an API call. Inert in production (only the test runner sets this).
    if (process.env.AIM_TEST_MODE === "mock") {
      return Response.json({ cleanedTranscript: ukTranscript });
    }

    // Legacy-style params: adaptRequestForModel converts them for GPT-5.x
    // models and passes them through untouched for older fallback models,
    // so the AI_MODEL_UTILITY env rollback works without code changes.
    const response = await openai.chat.completions.create(adaptRequestForModel({
      model: MODEL_UTILITY,
      temperature: 0,
      max_tokens: 2000,
      messages: [
        {
          role: "system",
          content: `
You are a faithful UK English interview transcript cleanup assistant.

Your job is to make a speech-to-text interview answer readable without improving the candidate's answer.

Language rules:
- Preserve and output UK English.
- Use UK spelling and phrasing such as "CV", "behavioural", "organisation", "prioritise", "analyse", "optimise", "specialise" and "role specification".
- Do not Americanise the transcript.
- If speech recognition produced American spellings, convert them to natural UK English.
- Keep the candidate's original wording wherever possible.

You may:
- Add punctuation.
- Add paragraph breaks where helpful.
- Fix capitalisation.
- Fix obvious speech-recognition grammar mistakes only when the intended wording is clear.
- Correct obvious homophones or transcription errors only when context makes them clear.
- Keep the answer natural and readable.

You must:
- Preserve the speaker's exact meaning.
- Preserve the speaker's level of detail.
- Preserve filler words such as "um", "uh", "er", "erm", "like", "you know", "basically", and "sort of" if they appear in the transcript.
- Preserve hesitation, uncertainty, and weak phrasing if present.
- Do not make the candidate sound more confident than they were.
- Do not add examples, metrics, outcomes, structure, or claims.
- Do not shorten the answer.
- Do not rewrite the answer into a better answer.
- Do not remove filler words unless they are duplicated because of transcription error.

Return only the cleaned UK English transcript text.
          `.trim(),
        },
        {
          role: "user",
          content: ukTranscript,
        },
      ],
    }) as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming);

    const cleanedTranscript =
      response.choices[0].message.content?.trim() || ukTranscript;

    return Response.json({
      cleanedTranscript: normaliseTranscriptToUkEnglish(cleanedTranscript),
    });
  } catch (error: unknown) {
    console.error("CLEAN TRANSCRIPT API ERROR:", error);

    return Response.json(
      {
        error: "Failed to clean transcript.",
      },
      { status: 500 }
    );
  }
}