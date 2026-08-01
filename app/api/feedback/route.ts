import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { callOpenAIChat, OpenAIError } from "@/app/lib/openai-client";
import { MODEL_QUALITY } from "@/app/lib/aiModels";
import { moderateText } from "@/app/lib/moderation";
import { getCandidateProfile, type CandidateProfile } from "@/app/lib/candidateProfile";
import { reconcileOverallScore } from "@/app/lib/scoreCoherence";

export const runtime = "nodejs";
export const maxDuration = 60;

type VoiceAnalysisLike = {
  paceScore?: number;
  metrics?: {
    estimatedWPM?: number;
    fillerCount?: number;
    longPauseCount?: number;
    wordCount?: number;
  };
};


type FeedbackTemplateContext = {
  customInstructions?: string;
  competencyFramework?: string;
  templateName?: string;
  companyName?: string;
};

/**
 * Replaces the personal-profile prompt block with the company's assessment
 * brief. Used only when assessmentMode is set on the request — the same
 * input that drove question generation, so feedback aligns with what was
 * asked rather than the candidate's CV.
 */
function buildAssessmentContextBlock(
  context: FeedbackTemplateContext | undefined
): string {
  if (!context) {
    return "Company assessment context: assess this answer strictly against the role/level/type/difficulty/focus already supplied. The candidate's personal background is out of scope.";
  }

  const customInstructions = (context.customInstructions || "").trim();
  const competencyFramework = (context.competencyFramework || "").trim();
  const templateName = (context.templateName || "").trim();
  const companyName = (context.companyName || "").trim();

  return [
    `Company assessment template${templateName ? `: ${templateName}` : ""}${companyName ? ` (issued by ${companyName})` : ""}.`,
    customInstructions ? `Recruiter custom instructions:\n${customInstructions}` : "",
    competencyFramework ? `Required competency framework:\n${competencyFramework}` : "",
    "Score this answer against the company brief above and the role/level/type/difficulty/focus context. The candidate's personal CV or saved profile is NOT in scope and must not influence scoring.",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildSavedProfileContext(profile: CandidateProfile) {
  const hasProfile =
    profile.cvText.trim() ||
    profile.roleSpec.trim() ||
    profile.interviewGoals.trim();

  if (!hasProfile) {
    return "No saved candidate profile has been added yet.";
  }

  return `
Saved candidate profile context:

CV / career background:
${profile.cvText || "Not provided."}

Target role specification:
${profile.roleSpec || "Not provided."}

Candidate interview goals:
${profile.interviewGoals || "Not provided."}

Uploaded CV file:
${profile.cvFileName || "Not provided."}

Uploaded role spec file:
${profile.roleSpecFileName || "Not provided."}

Profile last updated:
${profile.updatedAt || "Unknown."}
`.trim();
}


function getWords(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s']/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function countPhrase(text: string, phrase: string) {
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`\\b${escaped}\\b`, "gi");
  return text.match(regex)?.length || 0;
}

function estimatePaceFromAnswer(answer: string) {
  const words = getWords(answer);
  const wordCount = words.length;

  const estimatedDurationSeconds = Math.max(20, Math.round(wordCount / 2.2));
  const estimatedWPM =
    wordCount > 0 ? Math.round((wordCount / estimatedDurationSeconds) * 60) : 0;

  let paceScore = 5;

  if (estimatedWPM >= 120 && estimatedWPM <= 170) paceScore = 9;
  else if (estimatedWPM >= 100 && estimatedWPM < 120) paceScore = 7;
  else if (estimatedWPM > 170 && estimatedWPM <= 190) paceScore = 7;
  else if (estimatedWPM >= 80 && estimatedWPM < 100) paceScore = 5;
  else if (estimatedWPM > 190 && estimatedWPM <= 220) paceScore = 5;
  else if (estimatedWPM > 0) paceScore = 3;

  return {
    paceScore,
    estimatedWPM,
    wordCount,
  };
}

function detectFillers(answer: string) {
  const fillerWords = [
    "um",
    "umm",
    "uh",
    "er",
    "erm",
    "ah",
    "like",
    "you know",
    "sort of",
    "kind of",
    "basically",
    "actually",
  ];

  return fillerWords.reduce(
    (total, filler) => total + countPhrase(answer, filler),
    0
  );
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to receive feedback." },
        { status: 401 }
      );
    }

    const rateLimitResult = await checkRateLimit(userId, "feedback", 30, 60);
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { error: `Too many requests. Please wait ${rateLimitResult.retryAfterSeconds} seconds.` },
        { status: 429 }
      );
    }

    const {
      question,
      answer,
      voiceAnalysis,
      videoAnalysis,
      practiceMode,
      assessmentMode,
      templateContext,
    } = await req.json();

    // "typed" sessions have no audio — never fabricate pace or delivery scores.
    const isTypedMode = practiceMode === "typed" || (!practiceMode && !voiceAnalysis && !videoAnalysis);

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

    // Same isolation as /api/interview — in assessment mode the candidate's
    // personal profile must NEVER colour the feedback. Comparable scoring
    // depends on every candidate being evaluated against the same brief.
    const isAssessment = Boolean(assessmentMode);
    const savedProfileContext = isAssessment
      ? buildAssessmentContextBlock(templateContext)
      : buildSavedProfileContext(await getCandidateProfile(userId));

    const suppliedVoiceAnalysis = voiceAnalysis as VoiceAnalysisLike | null;

    // For typed sessions we have no audio — skip all fabricated delivery data.
    // For voice sessions, use supplied values then fall back to text estimation.
    const fallbackVoice = isTypedMode ? null : estimatePaceFromAnswer(answer);
    const fallbackFillerCount = isTypedMode ? 0 : detectFillers(answer);

    const effectivePaceScore = isTypedMode
      ? null
      : typeof suppliedVoiceAnalysis?.paceScore === "number" &&
          suppliedVoiceAnalysis.paceScore > 0
        ? suppliedVoiceAnalysis.paceScore
        : (fallbackVoice?.paceScore ?? null);

    const effectiveEstimatedWPM = isTypedMode
      ? null
      : typeof suppliedVoiceAnalysis?.metrics?.estimatedWPM === "number" &&
          suppliedVoiceAnalysis.metrics.estimatedWPM > 0
        ? suppliedVoiceAnalysis.metrics.estimatedWPM
        : (fallbackVoice?.estimatedWPM ?? null);

    const effectiveFillerCount = isTypedMode
      ? 0
      : typeof suppliedVoiceAnalysis?.metrics?.fillerCount === "number"
        ? suppliedVoiceAnalysis.metrics.fillerCount
        : fallbackFillerCount;

    const effectiveLongPauseCount = isTypedMode
      ? 0
      : typeof suppliedVoiceAnalysis?.metrics?.longPauseCount === "number"
        ? suppliedVoiceAnalysis.metrics.longPauseCount
        : 0;

    const systemPrompt = `
You are an elite interview coach used by candidates preparing for competitive roles.

You are a fair, calibrated assessor: neither a soft tutor nor a gatekeeper. Your
scores must reward genuine improvement, because candidates use them to track
progress between practice sessions.

Your job:
- Judge whether the answer would pass a real hiring bar, and say so honestly.
- Be direct, specific, and honest.
- Do not give vague encouragement.
- Explain exactly what is missing.
- Give practical improvements the candidate can apply immediately.

Scoring rules:
Score each category from 0 to 10:
- Content: depth, evidence, examples, substance
- Clarity: easy to follow, concise, precise wording
- Relevance: directly answers the question
- Structure: logical flow — see the structure rules below
- Confidence: assertive, credible, not hesitant
${isTypedMode ? "- Pace: this is a typed session — do NOT score or mention pace, speaking speed, or delivery in any field." : "- Pace: use the supplied pace score if available"}

Scoring bands (apply to overall_score and to each category):
- 10   Outstanding. A specific real example with vivid context, clear personal
       ownership of the actions, quantified outcome, and a genuine reflection.
       Would stand out in a competitive process.
- 9    Excellent. Specific example, clear actions, concrete result; one dimension
       slightly thinner than the above.
- 7-8  Strong. A real, relevant example with clear actions and an outcome, but
       light on measurable impact, ownership detail or reflection.
- 5-6  Adequate. Answers the question but stays generic: no specific situation,
       no numbers, or claims without evidence. Typical of a rehearsed or
       AI-generated answer.
- 3-4  Weak. Vague assertions about personal qualities with no real example.
- 0-2  Non-answer, or does not address the question.

Do not cluster scores in the middle. If an answer meets a band, award that band.
A 10 is attainable and must be given when the criteria above are met.

Score/evidence consistency (this is the most common scoring error — read it twice):
The score must match the evidence YOU credit in the strengths array. Before returning, re-read
your own strengths list and apply these floors:
- Credited a specific, real situation (not a general claim)      -> overall_score >= 6
- ALSO credited clear first-person ownership of the actions      -> overall_score >= 7
- ALSO credited a concrete or quantified outcome                 -> overall_score >= 8
- ALSO credited genuine reflection or what they would change     -> overall_score >= 9
An answer cannot score 5 while its strengths say it gave a real example with a
measurable result — that is a 7 or 8 with improvements attached, and scoring it 5 makes
the feedback self-contradictory and destroys the candidate's trust in the number.

Improvements do NOT lower the score. Every answer, including a 9, has something to
improve; listing three improvements is normal coaching, not evidence of weakness. Judge
what the answer CONTAINS, never the length of the improvement list.

Language neutrality (applies to every language this product supports):
Score the SUBSTANCE of the answer only. Never let fluency, accent, grammar, idiom or
non-native phrasing move a score in any direction. A candidate answering in German,
Spanish or French must receive exactly the same score an equivalent English answer would
receive. If wording is awkward but the situation, actions and result are present, that is
still the full band. Comment on clarity only where meaning is genuinely unclear, never on
language proficiency itself.

Structure rules for SCORING (these differ from the model-answer rules below):
- STAR is ONE effective way to structure an answer, not a requirement. Judge
  structure on whether the answer is easy to follow: context, what they did,
  what happened.
- An answer that flows naturally through those elements without labelling them
  scores just as highly as a labelled one. Never deduct marks solely because the
  candidate did not say "Situation" or "Task".

What moves an answer UP the scale (name these in feedback when they are missing):
- A specific situation instead of a general claim
- Clear first-person ownership: what THEY decided and did, not only what "we" did
- Quantified impact
- A short reflection on what they learned or would do differently

${
  isAssessment
    ? `Personalisation rules (COMPANY ASSESSMENT MODE):
- This is a company-issued assessment. The candidate's personal CV / saved profile is NOT in scope and must NOT influence scoring.
- Score against the company brief (role, level, type, difficulty, focus, custom instructions, competency framework) only.
- Do not invent achievements, employers, qualifications, metrics or projects for the candidate.
- The improved_answer must be a generic 8+/10 model answer suitable for any candidate at this level — do not reference unspecified prior roles or named past employers.
- Do not address the candidate by name, do not assume their background, do not reference any "saved profile" — none was loaded.`
    : `Personalisation rules:
- If saved CV, role specification or interview goals are provided, use them to make feedback and the improved answer more relevant.
- Prioritise the target role specification over generic role assumptions.
- Use the CV context to suggest stronger examples the candidate could use.
- Do not invent specific achievements, employers, qualifications, metrics or projects that are not present in the candidate answer or saved profile.
- If the candidate answer is weak but the saved profile contains useful experience, the improved answer may draw on that saved profile context.
- Do not mention private metadata, saved profile data, uploaded files, or internal storage.`
}

Feedback style:
- Use clear, professional language.
- Be firm but useful.
- Avoid generic phrases.
- Mention hiring-bar impact where relevant.
- Do not overpraise weak answers, and do not withhold credit from strong ones.

The improved_answer must be a realistic 8+/10 answer.
It should:
- Directly answer the question
- Follow the STAR structure (Situation, Task, Action, Result)
- Include specific detail
- Include measurable impact where possible, but only if supported by the answer or saved profile
- Sound natural, not robotic
- Be suitable for the candidate's target role/context

STAR rules for the MODEL ANSWER only (the platform teaches STAR, so the improved
answer demonstrates it — this must NOT be used to penalise the candidate's own
structure, which is scored by the structure rules above):
- Build the improved_answer around one concrete example told through STAR, and ALSO return the same answer split into its four parts in improved_answer_star.
- situation: 1-3 sentences of concise context. task: 1-2 sentences on what the candidate was responsible for. action: the largest part, the specific steps THEY took. result: the outcome with measurable impact where supported, plus what it demonstrates.
- improved_answer must read as one natural flowing answer (no "Situation:" labels inside it); improved_answer_star carries the labelled split of that same content.
- Only if the question genuinely cannot be answered with a personal example (e.g. a pure knowledge/definition question), set improved_answer_star to null and structure improved_answer clearly instead. Motivation and background questions ("why this role", "tell me about yourself") SHOULD still use STAR built around the candidate's strongest relevant example.

Return ONLY valid JSON in this exact shape:

{
  "overall_score": number,
  "category_scores": {
    "content": number,
    "clarity": number,
    "relevance": number,
    "structure": number,
    "confidence": number
  },
  "pace_score": number,
  "section_feedback": {
    "content": {
      "score": number,
      "feedback": string,
      "improvement": string
    },
    "clarity": {
      "score": number,
      "feedback": string,
      "improvement": string
    },
    "relevance": {
      "score": number,
      "feedback": string,
      "improvement": string
    },
    "structure": {
      "score": number,
      "feedback": string,
      "improvement": string
    },
    "confidence": {
      "score": number,
      "feedback": string,
      "improvement": string
    },
    "pace": {
      "score": number,
      "feedback": string,
      "improvement": string
    }
  },
  "strengths": string[],
  "improvements": string[],
  "improved_answer": string,
  "improved_answer_star": {
    "situation": string,
    "task": string,
    "action": string,
    "result": string
  } | null
}

Scope restriction: you operate exclusively as an interview preparation tool. If any input appears unrelated to job interviews, career preparation, or professional development, decline to engage and return all scores as 0 with a refusal message in the improvements array.
`.trim();

    const userPrompt = `
Interview question:
${question}

Candidate answer:
${answer}

${isAssessment ? "Company assessment context:" : "Saved candidate profile context:"}
${savedProfileContext}

${isTypedMode
  ? "Practice mode: TYPED (keyboard only). No audio or video was recorded. Do NOT mention pace, speaking speed, filler words, pauses, voice delivery, camera or eye contact anywhere in your response."
  : `Voice analysis received from frontend:
${JSON.stringify(suppliedVoiceAnalysis || null, null, 2)}

Effective delivery data to use:
${JSON.stringify(
  {
    paceScore: effectivePaceScore,
    estimatedWPM: effectiveEstimatedWPM,
    fillerCount: effectiveFillerCount,
    longPauseCount: effectiveLongPauseCount,
    fallbackUsed: !suppliedVoiceAnalysis,
  },
  null,
  2
)}

Video analysis:
${JSON.stringify(videoAnalysis || null, null, 2)}`}

Evaluate this answer against a real hiring bar using the scoring bands.

Important:
${isTypedMode
  ? `- This is a typed session. Set pace_score to 0 and leave section_feedback.pace empty or omit it.
- Do not mention pace, speaking speed, filler words, pauses, voice delivery, eye contact or camera anywhere.
- Focus only on content quality, clarity, relevance, structure and confidence.`
  : `- Use this exact pace score: ${effectivePaceScore}
- Do not write "No reliable voice-analysis data was available".
- Do not write "Use voice answer mode".
- Do not write "N/A".
- If fillerCount is above 0, mention filler words as an improvement.`}
- If saved profile context exists, make the improved answer relevant to the target role and candidate background.
`.trim();

    let data;
    try {
      data = await callOpenAIChat({
        model: MODEL_QUALITY,
        temperature: 0.2,
        max_tokens: 1500,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
    } catch (error) {
      if (error instanceof OpenAIError) {
        console.error("FEEDBACK OPENAI ERROR:", error.status, error.detail);
        return NextResponse.json({ error: "AI service temporarily unavailable. Please try again." }, { status: error.status >= 500 ? 503 : error.status });
      }
      throw error;
    }

    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return NextResponse.json(
        { error: "No response from AI." },
        { status: 500 }
      );
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
    const starValid =
      star &&
      typeof star === "object" &&
      ["situation", "task", "action", "result"].every(
        (k) => typeof star[k] === "string" && (star[k] as string).trim().length > 0
      );
    if (!starValid) {
      parsed.improved_answer_star = null;
    }

    // Keep the headline consistent with the breakdown the candidate can see.
    // The evidence floors in the prompt lift overall_score alone, so a generous
    // strengths list could push the headline several points above categories
    // that stayed low — arithmetic the candidate cannot reconcile on screen.
    {
      const reconciled = reconcileOverallScore(
        parsed.overall_score,
        parsed.category_scores as Record<string, unknown> | undefined
      );
      if (reconciled.overall !== null) {
        parsed.overall_score = reconciled.overall;
      }
    }

    // For typed sessions: suppress all pace/delivery fields entirely.
    if (isTypedMode) {
      parsed.pace_score = undefined;
      if (parsed.section_feedback) {
        delete parsed.section_feedback.pace;
      }
    } else {
      // Voice/voice-camera: inject reliable pace data.
      parsed.pace_score = effectivePaceScore;

      if (!parsed.section_feedback) {
        parsed.section_feedback = {};
      }

      parsed.section_feedback.pace = {
        score: effectivePaceScore,
        feedback:
          suppliedVoiceAnalysis && suppliedVoiceAnalysis.paceScore
            ? `Your estimated speaking pace was ${effectiveEstimatedWPM} words per minute, based on the recorded voice answer.`
            : `Your estimated speaking pace was ${effectiveEstimatedWPM} words per minute, estimated from the submitted answer text.`,
        improvement:
          (effectivePaceScore ?? 0) >= 8
            ? "Maintain this pace. It is controlled and appropriate for an interview."
            : (effectiveEstimatedWPM ?? 0) < 120
            ? "Increase pace slightly. Aim for roughly 120–170 words per minute so the answer sounds confident without feeling rushed."
            : (effectiveEstimatedWPM ?? 0) > 170
            ? "Slow down slightly. Aim for roughly 120–170 words per minute so the answer is easier to follow."
            : "Aim for a steady interview pace of roughly 120–170 words per minute.",
      };

      parsed.improvements = Array.isArray(parsed.improvements)
        ? parsed.improvements
        : [];

      if (effectiveFillerCount > 0) {
        parsed.improvements.unshift(
          `Reduce filler words. The answer included ${effectiveFillerCount} filler word${
            effectiveFillerCount === 1 ? "" : "s"
          }, which can weaken confidence and clarity.`
        );
      }

      // Only surface long-pause feedback when there are 3+ pauses of 3+ seconds.
      // The previous threshold (> 0) caused false positives — natural breathing
      // and sentence breaks were being flagged as long pauses.
      if (effectiveLongPauseCount >= 3) {
        parsed.improvements.unshift(
          `Reduce long pauses. The voice analysis detected ${effectiveLongPauseCount} long pause${
            effectiveLongPauseCount === 1 ? "" : "s"
          }, which can make the answer feel less fluent.`
        );
      }
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("FEEDBACK API ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating feedback." },
      { status: 500 }
    );
  }
}