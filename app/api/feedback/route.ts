import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/app/lib/rateLimit";
import { callOpenAIChat, OpenAIError } from "@/app/lib/openai-client";

type VoiceAnalysisLike = {
  paceScore?: number;
  metrics?: {
    estimatedWPM?: number;
    fillerCount?: number;
    longPauseCount?: number;
    wordCount?: number;
  };
};

type CandidateProfile = {
  cvText: string;
  roleSpec: string;
  interviewGoals: string;
  cvFileName: string;
  roleSpecFileName: string;
  updatedAt: string;
};

const EMPTY_PROFILE: CandidateProfile = {
  cvText: "",
  roleSpec: "",
  interviewGoals: "",
  cvFileName: "",
  roleSpecFileName: "",
  updatedAt: "",
};

function cleanText(value: unknown) {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").trim();
}

function extractCandidateProfile(metadata: unknown): CandidateProfile {
  const data = metadata as {
    candidateProfile?: Partial<CandidateProfile>;
  };

  const candidateProfile = data?.candidateProfile;

  if (!candidateProfile || typeof candidateProfile !== "object") {
    return EMPTY_PROFILE;
  }

  return {
    cvText: cleanText(candidateProfile.cvText),
    roleSpec: cleanText(candidateProfile.roleSpec),
    interviewGoals: cleanText(candidateProfile.interviewGoals),
    cvFileName: cleanText(candidateProfile.cvFileName),
    roleSpecFileName: cleanText(candidateProfile.roleSpecFileName),
    updatedAt: cleanText(candidateProfile.updatedAt),
  };
}

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

async function getSignedInCandidateProfile() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return EMPTY_PROFILE;
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    return extractCandidateProfile(user.privateMetadata);
  } catch (error) {
    console.error("FEEDBACK PROFILE LOAD WARNING:", error);
    return EMPTY_PROFILE;
  }
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

    const rateLimitResult = checkRateLimit(userId, "feedback", 30, 60);
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
      assessmentMode,
      templateContext,
    } = await req.json();

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

    // Same isolation as /api/interview — in assessment mode the candidate's
    // personal profile must NEVER colour the feedback. Comparable scoring
    // depends on every candidate being evaluated against the same brief.
    const isAssessment = Boolean(assessmentMode);
    const savedProfileContext = isAssessment
      ? buildAssessmentContextBlock(templateContext)
      : buildSavedProfileContext(await getSignedInCandidateProfile());

    const suppliedVoiceAnalysis = voiceAnalysis as VoiceAnalysisLike | null;

    const fallbackVoice = estimatePaceFromAnswer(answer);
    const fallbackFillerCount = detectFillers(answer);

    const effectivePaceScore =
      typeof suppliedVoiceAnalysis?.paceScore === "number" &&
      suppliedVoiceAnalysis.paceScore > 0
        ? suppliedVoiceAnalysis.paceScore
        : fallbackVoice.paceScore;

    const effectiveEstimatedWPM =
      typeof suppliedVoiceAnalysis?.metrics?.estimatedWPM === "number" &&
      suppliedVoiceAnalysis.metrics.estimatedWPM > 0
        ? suppliedVoiceAnalysis.metrics.estimatedWPM
        : fallbackVoice.estimatedWPM;

    const effectiveFillerCount =
      typeof suppliedVoiceAnalysis?.metrics?.fillerCount === "number"
        ? suppliedVoiceAnalysis.metrics.fillerCount
        : fallbackFillerCount;

    const effectiveLongPauseCount =
      typeof suppliedVoiceAnalysis?.metrics?.longPauseCount === "number"
        ? suppliedVoiceAnalysis.metrics.longPauseCount
        : 0;

    const systemPrompt = `
You are an elite interview coach used by candidates preparing for competitive roles.

You evaluate answers like a strict hiring manager, not a friendly tutor.

Your job:
- Judge whether the answer would pass a real hiring bar.
- Be direct, specific, and honest.
- Do not give vague encouragement.
- Explain exactly what is missing.
- Give practical improvements the candidate can apply immediately.

Scoring rules:
Score each category from 0 to 10:
- Content: depth, evidence, examples, substance
- Clarity: easy to follow, concise, precise wording
- Relevance: directly answers the question
- Structure: logical flow, STAR method where appropriate
- Confidence: assertive, credible, not hesitant
- Pace: use the supplied pace score if available

A score of 8+ means the answer is strong enough for a competitive interview.
A score of 5 or below means it would likely struggle to pass hiring bar.

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
- Do not overpraise weak answers.

The improved_answer must be a realistic 8+/10 answer.
It should:
- Directly answer the question
- Use strong structure
- Include specific detail
- Include measurable impact where possible, but only if supported by the answer or saved profile
- Sound natural, not robotic
- Be suitable for the candidate's target role/context

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
  "improved_answer": string
}
`.trim();

    const userPrompt = `
Interview question:
${question}

Candidate answer:
${answer}

${isAssessment ? "Company assessment context:" : "Saved candidate profile context:"}
${savedProfileContext}

Voice analysis received from frontend:
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
${JSON.stringify(videoAnalysis || null, null, 2)}

Evaluate this answer strictly against a real hiring bar.

Important:
- Use this exact pace score: ${effectivePaceScore}
- Do not write "No reliable voice-analysis data was available".
- Do not write "Use voice answer mode".
- Do not write "N/A".
- If fillerCount is above 0, mention filler words as an improvement.
- If saved profile context exists, make the improved answer relevant to the target role and candidate background.
`.trim();

    let data;
    try {
      data = await callOpenAIChat({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });
    } catch (error) {
      if (error instanceof OpenAIError) {
        console.error("FEEDBACK OPENAI ERROR:", error.status, error.detail);
        return NextResponse.json({ error: error.message }, { status: error.status >= 500 ? 503 : error.status });
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
        effectivePaceScore >= 8
          ? "Maintain this pace. It is controlled and appropriate for an interview."
          : effectiveEstimatedWPM < 120
          ? "Increase pace slightly. Aim for roughly 120–170 words per minute so the answer sounds confident without feeling rushed."
          : effectiveEstimatedWPM > 170
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

    if (effectiveLongPauseCount > 0) {
      parsed.improvements.unshift(
        `Reduce long pauses. The voice analysis detected ${effectiveLongPauseCount} long pause${
          effectiveLongPauseCount === 1 ? "" : "s"
        }, which can make the answer feel less fluent.`
      );
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