import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { callOpenAIChat, OpenAIError } from "@/app/lib/openai-client";
import { MODEL_ANSWERS } from "@/app/lib/aiModels";
import { moderateText } from "@/app/lib/moderation";
import { getCandidateProfile } from "@/app/lib/candidateProfile";
import {
  buildAssessmentContextBlock,
  buildSavedProfileContext,
} from "@/app/lib/feedbackContext";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Generates ONLY the exemplar "model answer" a candidate compares themselves
 * to. Split out of /api/feedback so the scores can return fast on the cheap
 * model while this stronger, slower answer is generated in parallel on
 * MODEL_ANSWERS and merged into the panel a beat later. Scoring lives in
 * /api/feedback and is unaffected by anything here.
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to receive feedback." },
        { status: 401 }
      );
    }

    const rateLimitResult = await checkRateLimit(userId, "feedback-answer", 30, 60);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rateLimitResult.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    const { question, answer, assessmentMode, templateContext } = await req.json();

    if (
      !question ||
      typeof question !== "string" ||
      !answer ||
      typeof answer !== "string"
    ) {
      return NextResponse.json(
        { error: "Missing question or answer." },
        { status: 400 }
      );
    }

    const moderation = await moderateText(answer);
    if (moderation.flagged) {
      return NextResponse.json(
        { error: "Your answer contains content that cannot be processed." },
        { status: 422 }
      );
    }

    const isAssessment = Boolean(assessmentMode);
    let savedProfileContext: string;
    if (isAssessment) {
      savedProfileContext = buildAssessmentContextBlock(templateContext);
    } else {
      // Never fail the model answer over a profile-read hiccup (e.g. DB
      // connection-pool pressure). Personalise when we can, fall back to a
      // strong generic answer when the read errors, so the STAR example always
      // renders.
      try {
        savedProfileContext = buildSavedProfileContext(
          await getCandidateProfile(userId)
        );
      } catch (err) {
        console.error("MODEL-ANSWER profile fetch failed; using generic context:", err);
        savedProfileContext =
          "No saved candidate profile is available. Write a strong, generic model answer appropriate to the interview question and a typical strong candidate at the target level.";
      }
    }

    const systemPrompt = `
You are an elite interview coach. Your only job here is to write ONE model
answer to the interview question below — the standard a strong (8+/10)
candidate would give — so the candidate can compare it with their own answer.
You do NOT score, critique or grade their answer; another system does that.

The model answer must:
- Directly answer the question.
- Be built around ONE concrete example told through STAR (Situation, Task, Action, Result).
- Include specific, credible detail and measurable impact where it fits naturally.
- Sound like a real person speaking, not a template — no "Situation:" labels inside the flowing answer.
- Be realistic for the candidate's target role and level.

${
  isAssessment
    ? `Company assessment mode:
- The candidate's personal CV / saved profile is NOT in scope.
- Write a generic 8+/10 model answer suitable for any candidate at this level.
- Do NOT reference unspecified prior roles or named past employers, and do not address the candidate by name.`
    : `Personalisation:
- If a saved CV, role specification or interview goals are provided, use them so the model answer fits the candidate's target role and background, and draw on their real experience where it is genuinely relevant.
- Do NOT invent specific achievements, employers, qualifications, metrics or projects that are not present in the candidate's answer or saved profile.
- Do not mention private metadata, saved profile data, uploaded files, or internal storage.`
}

Return the SAME answer twice: once as one natural flowing paragraph
(improved_answer), and once split into its four STAR parts
(improved_answer_star). situation: 1-3 sentences of context. task: 1-2
sentences on what the candidate was responsible for. action: the largest part,
the specific steps THEY took. result: the outcome with measurable impact where
supported, plus what it demonstrates.

Only if the question genuinely cannot be answered with a personal example (e.g.
a pure knowledge/definition question), set improved_answer_star to null and
structure improved_answer clearly instead. Motivation and background questions
("why this role", "tell me about yourself") SHOULD still use STAR built around
the candidate's strongest relevant example.

Return ONLY valid JSON in this exact shape:

{
  "improved_answer": string,
  "improved_answer_star": {
    "situation": string,
    "task": string,
    "action": string,
    "result": string
  } | null
}

Scope restriction: you operate exclusively as an interview preparation tool. If
the input appears unrelated to job interviews or professional development,
return { "improved_answer": "", "improved_answer_star": null }.
`.trim();

    const userPrompt = `
Interview question:
${question}

Candidate answer (for context — do not grade it):
${answer}

${isAssessment ? "Company assessment context:" : "Saved candidate profile context:"}
${savedProfileContext}
`.trim();

    let data;
    try {
      data = await callOpenAIChat({
        model: MODEL_ANSWERS,
        temperature: 0.3,
        // The answer is returned TWICE (flowing + the four STAR parts) and the
        // model spends hidden reasoning before it, so keep a generous budget —
        // too tight and the JSON truncates, fails to parse, and the panel shows
        // no model answer at all.
        max_tokens: 1600,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
    } catch (error) {
      if (error instanceof OpenAIError) {
        console.error("MODEL-ANSWER OPENAI ERROR:", error.status, error.detail);
        return NextResponse.json(
          { error: "AI service temporarily unavailable. Please try again." },
          { status: error.status >= 500 ? 503 : error.status }
        );
      }
      throw error;
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      return NextResponse.json({ error: "No response from AI." }, { status: 500 });
    }

    let parsed;
    try {
      const cleanedText = text
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim();
      parsed = JSON.parse(cleanedText);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse AI response." },
        { status: 500 }
      );
    }

    // Keep improved_answer_star only when all four parts are usable strings —
    // the UI falls back to the flowing improved_answer otherwise.
    const star = parsed.improved_answer_star as Record<string, unknown> | null | undefined;
    const starValid = Boolean(
      star &&
        typeof star === "object" &&
        ["situation", "task", "action", "result"].every(
          (k) => typeof star[k] === "string" && (star[k] as string).trim().length > 0
        )
    );

    let flowing =
      typeof parsed.improved_answer === "string" ? parsed.improved_answer.trim() : "";
    // Never lose the answer to a mismatch: if only one of the two forms came
    // back, rebuild the other so the STAR example always renders.
    if (!flowing && starValid) {
      flowing = [star!.situation, star!.task, star!.action, star!.result].join(" ");
    }

    return NextResponse.json({
      improved_answer: flowing,
      improved_answer_star: starValid ? parsed.improved_answer_star : null,
    });
  } catch (error) {
    console.error("MODEL-ANSWER API ERROR:", error);
    return NextResponse.json(
      { error: "Something went wrong while generating the model answer." },
      { status: 500 }
    );
  }
}
