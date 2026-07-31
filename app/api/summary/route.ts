import OpenAI from "openai";
import { MODEL_QUALITY } from "@/app/lib/aiModels";
import { adaptRequestForModel } from "@/app/lib/openai-client";
import { auth } from "@clerk/nextjs/server";
import { checkRateLimit } from "@/app/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type FeedbackResult = {
  question?: string;
  answer?: string;
  feedback?: {
    overall_score?: number;
    category_scores?: {
      content?: number;
      clarity?: number;
      relevance?: number;
      structure?: number;
      confidence?: number;
    };
    pace_score?: number;
    strengths?: string[];
    improvements?: string[];
    improved_answer?: string;
    section_feedback?: Record<
      string,
      {
        score?: number;
        feedback?: string;
        improvement?: string;
      }
    >;
  };
  voiceAnalysis?: {
    overallVoiceScore?: number;
    paceScore?: number;
    fillerScore?: number;
    confidenceScore?: number;
    energyScore?: number;
    structureScore?: number;
    metrics?: {
      wordCount?: number;
      fillerCount?: number;
      estimatedWPM?: number;
      longPauseCount?: number;
    };
    feedback?: {
      strengths?: string[];
      improvements?: string[];
    };
  } | null;
  videoAnalysis?: {
    overallVideoScore?: number;
    eyeContactScore?: number;
    positionScore?: number;
    bodyLanguageScore?: number;
    expressionScore?: number;
    engagementScore?: number;
    metrics?: {
      faceDetectedRatio?: number;
      centeredFaceRatio?: number;
      lookingForwardRatio?: number;
      faceLossEvents?: number;
      totalFrames?: number;
    };
    feedback?: {
      strengths?: string[];
      improvements?: string[];
    };
  } | null;
};

type PremiumSummary = {
  overall_score: number;
  readiness_score: number;
  hire_signal: "Weak" | "Moderate" | "Strong";
  hire_signal_reason: string;
  category_breakdown: {
    content: number;
    clarity: number;
    relevance: number;
    structure: number;
    confidence: number;
    pace: number;
    voice_delivery: number;
    camera_presence: number;
  };
  strongest_answer: {
    question_number: number;
    question: string;
    score: number;
    reason: string;
  };
  weakest_answer: {
    question_number: number;
    question: string;
    score: number;
    reason: string;
  };
  voice_delivery_summary?: {
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
  };
  camera_delivery_summary?: {
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
  };
  top_strengths: string[];
  top_improvements: string[];
  priority_improvements: string[];
  final_recommendation: string;
  next_steps: string[];
  seven_day_action_plan: {
    day: string;
    focus: string;
    task: string;
  }[];
  star_model_answer?: {
    question: string;
    situation: string;
    task: string;
    action: string;
    result: string;
  };
};

const clampScore = (value: number) => {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(10, Math.round(value)));
};

const average = (values: number[]) => {
  const validValues = values.filter((value) => Number.isFinite(value));
  if (validValues.length === 0) return 0;

  return (
    validValues.reduce((sum, value) => sum + value, 0) / validValues.length
  );
};

const stripCodeFence = (text: string) => {
  return text
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
};

const getScore = (item: FeedbackResult) => {
  return clampScore(item.feedback?.overall_score ?? 0);
};

const buildFallbackSummary = (
  role: string,
  results: FeedbackResult[],
  isTyped = false,
  hasCamera = false,
): PremiumSummary => {
  const scores = results.map(getScore);
  const overallScore = clampScore(average(scores));

  const strongestIndex = scores.length
    ? scores.indexOf(Math.max(...scores))
    : 0;

  const weakestIndex = scores.length ? scores.indexOf(Math.min(...scores)) : 0;

  const categoryBreakdown = {
    content: clampScore(
      average(results.map((item) => item.feedback?.category_scores?.content ?? 0))
    ),
    clarity: clampScore(
      average(results.map((item) => item.feedback?.category_scores?.clarity ?? 0))
    ),
    relevance: clampScore(
      average(
        results.map((item) => item.feedback?.category_scores?.relevance ?? 0)
      )
    ),
    structure: clampScore(
      average(
        results.map((item) => item.feedback?.category_scores?.structure ?? 0)
      )
    ),
    confidence: clampScore(
      average(
        results.map((item) => item.feedback?.category_scores?.confidence ?? 0)
      )
    ),
    // Pace, voice delivery and camera presence are only meaningful for
    // voice / voice-camera sessions. Zero them out for typed sessions.
    pace: isTyped ? 0 : clampScore(
      average(
        results.map(
          (item) =>
            item.feedback?.pace_score ?? item.voiceAnalysis?.paceScore ?? 0
        )
      )
    ),
    voice_delivery: isTyped ? 0 : clampScore(
      average(results.map((item) => item.voiceAnalysis?.overallVoiceScore ?? 0))
    ),
    camera_presence: (isTyped || !hasCamera) ? 0 : clampScore(
      average(results.map((item) => item.videoAnalysis?.overallVideoScore ?? 0))
    ),
  };

  const voiceStrengths = results.flatMap(
    (item) => item.voiceAnalysis?.feedback?.strengths || []
  );

  const voiceImprovements = results.flatMap(
    (item) => item.voiceAnalysis?.feedback?.improvements || []
  );

  const cameraStrengths = results.flatMap(
    (item) => item.videoAnalysis?.feedback?.strengths || []
  );

  const cameraImprovements = results.flatMap(
    (item) => item.videoAnalysis?.feedback?.improvements || []
  );

  const allStrengths = results.flatMap((item) => item.feedback?.strengths || []);
  const allImprovements = results.flatMap(
    (item) => item.feedback?.improvements || []
  );

  const hireSignal: "Weak" | "Moderate" | "Strong" =
    overallScore >= 8 ? "Strong" : overallScore >= 5 ? "Moderate" : "Weak";

  return {
    overall_score: overallScore,
    readiness_score: overallScore,
    hire_signal: hireSignal,
    hire_signal_reason:
      hireSignal === "Strong"
        ? "The candidate showed a strong level of interview readiness across the session."
        : hireSignal === "Moderate"
        ? "The candidate showed useful foundations, but needs sharper examples, clearer structure and more consistent delivery before a competitive interview."
        : "The candidate needs more preparation before they are likely to perform strongly in a real interview.",
    category_breakdown: categoryBreakdown,
    strongest_answer: {
      question_number: strongestIndex + 1,
      question: results[strongestIndex]?.question || "Not available",
      score: scores[strongestIndex] ?? overallScore,
      reason:
        "This was the strongest answer based on the available score and feedback.",
    },
    weakest_answer: {
      question_number: weakestIndex + 1,
      question: results[weakestIndex]?.question || "Not available",
      score: scores[weakestIndex] ?? overallScore,
      reason:
        "This answer needs the most improvement based on the available score and feedback.",
    },
    voice_delivery_summary: isTyped ? undefined : {
      score: categoryBreakdown.voice_delivery,
      summary: categoryBreakdown.voice_delivery > 0
        ? "Voice delivery was assessed using the recorded pace, filler word, confidence and energy data."
        : "Voice delivery data was not available for this session.",
      strengths: voiceStrengths.slice(0, 3),
      improvements: voiceImprovements.slice(0, 3),
    },
    camera_delivery_summary: (isTyped || !hasCamera) ? undefined : {
      score: categoryBreakdown.camera_presence,
      summary: categoryBreakdown.camera_presence > 0
        ? "Camera delivery was assessed using the recorded eye contact, position, posture and engagement data."
        : "Camera presence data was not available for this session.",
      strengths: cameraStrengths.slice(0, 3),
      improvements: cameraImprovements.slice(0, 3),
    },
    top_strengths:
      allStrengths.length > 0
        ? allStrengths.slice(0, 4)
        : ["You completed the full interview practice session."],
    top_improvements:
      allImprovements.length > 0
        ? allImprovements.slice(0, 4)
        : ["Use clearer structure and more specific examples."],
    priority_improvements:
      allImprovements.length > 0
        ? allImprovements.slice(0, 3)
        : [
            "Use STAR structure more consistently.",
            "Add measurable outcomes to answers.",
            "Make answers more concise and focused.",
          ],
    final_recommendation: `For ${role || "this target role"}, keep practising with a stronger focus on evidence, structure and confident delivery.`,
    next_steps: isTyped
      ? [
          "Rewrite your weakest answer using the STAR method.",
          "Prepare three measurable examples from your experience.",
          "Focus on concise, well-structured written answers.",
        ]
      : [
          "Rewrite your weakest answer using the STAR method.",
          "Prepare three measurable examples from your experience.",
          "Practise answering aloud while reducing filler words.",
        ],
    seven_day_action_plan: [
      {
        day: "Day 1",
        focus: "Structure",
        task: "Rewrite two answers using Situation, Task, Action and Result.",
      },
      {
        day: "Day 2",
        focus: "Evidence",
        task: "Add measurable results, numbers or outcomes to your strongest examples.",
      },
      {
        day: "Day 3",
        focus: "Conciseness",
        task: "Practise answering three questions in under two minutes each.",
      },
      isTyped
        ? {
            day: "Day 4",
            focus: "Depth",
            task: "Expand your weakest answer with a second strong example and measurable outcome.",
          }
        : {
            day: "Day 4",
            focus: "Voice delivery",
            task: "Record answers and reduce filler words such as um, er, like and you know.",
          },
      isTyped
        ? {
            day: "Day 5",
            focus: "Confidence",
            task: "Rewrite three answers to sound more assertive by removing hedging phrases like 'I think' and 'maybe'.",
          }
        : hasCamera
        ? {
            day: "Day 5",
            focus: "Camera presence",
            task: "Practise looking forward, staying centred and keeping posture steady.",
          }
        : {
            day: "Day 5",
            focus: "Fluency",
            task: "Practise speaking answers aloud with a focus on a steady, confident pace.",
          },
      {
        day: "Day 6",
        focus: "Pressure practice",
        task: "Complete a timed mock interview without pausing or restarting.",
      },
      {
        day: "Day 7",
        focus: "Final polish",
        task: "Review feedback, refine weak answers and repeat the full mock interview.",
      },
    ],
  };
};

export async function POST(req: Request) {
  try {
    // AuthN + throttle — this endpoint drives an OpenAI completion and must
    // never be reachable anonymously.
    const { userId } = await auth();
    if (!userId) {
      return Response.json({ error: "Authentication required." }, { status: 401 });
    }
    const rl = await checkRateLimit(userId, "summary", 20, 3600);
    if (!rl.allowed) {
      return Response.json(
        { error: `Rate limit reached. Try again in ${rl.retryAfterSeconds}s.` },
        { status: 429 }
      );
    }

    const { role, results, practiceMode, assessmentMode, templateContext } = await req.json();
    const isAssessment = Boolean(assessmentMode);
    const isTypedMode = practiceMode === "typed";
    const hasCameraMode = practiceMode === "voice-camera";
    const tCtx = (templateContext || {}) as {
      customInstructions?: string;
      competencyFramework?: string;
      templateName?: string;
      companyName?: string;
    };
    const assessmentBriefBlock = isAssessment
      ? [
          `Company assessment template${tCtx.templateName ? `: ${tCtx.templateName}` : ""}${tCtx.companyName ? ` (issued by ${tCtx.companyName})` : ""}.`,
          (tCtx.customInstructions || "").trim()
            ? `Recruiter custom instructions:\n${tCtx.customInstructions?.trim()}`
            : "",
          (tCtx.competencyFramework || "").trim()
            ? `Required competency framework:\n${tCtx.competencyFramework?.trim()}`
            : "",
          "Score this whole interview against the company brief above. The candidate's personal CV / saved profile is NOT in scope.",
        ]
          .filter(Boolean)
          .join("\n\n")
      : "";

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          error: "OPENAI_API_KEY is missing from environment variables.",
        },
        { status: 500 }
      );
    }

    const safeResults: FeedbackResult[] = Array.isArray(results) ? results : [];

    if (safeResults.length === 0) {
      return Response.json(
        {
          error: "No interview results were provided.",
        },
        { status: 400 }
      );
    }

    // Bound the payload so a crafted request can't run up token cost.
    if (safeResults.length > 25) {
      return Response.json(
        { error: "Too many results in one request." },
        { status: 400 }
      );
    }

    const formattedResults = safeResults
      .map((item, index) => {
        const categoryScores = item.feedback?.category_scores || {};
        const voice = item.voiceAnalysis;
        const video = item.videoAnalysis;

        return `
Question ${index + 1}: ${item.question || "Not available"}

Candidate answer ${index + 1}:
${item.answer || "Not available"}

Answer score ${index + 1}: ${item.feedback?.overall_score ?? 0}/10

Category scores ${index + 1}:
- Content: ${categoryScores.content ?? "N/A"}
- Clarity: ${categoryScores.clarity ?? "N/A"}
- Relevance: ${categoryScores.relevance ?? "N/A"}
- Structure: ${categoryScores.structure ?? "N/A"}
- Confidence: ${categoryScores.confidence ?? "N/A"}
- Pace: ${item.feedback?.pace_score ?? voice?.paceScore ?? "N/A"}

Strengths ${index + 1}:
${(item.feedback?.strengths || []).join("; ") || "None provided"}

Improvements ${index + 1}:
${(item.feedback?.improvements || []).join("; ") || "None provided"}

Voice analysis ${index + 1}:
- Overall voice score: ${voice?.overallVoiceScore ?? "N/A"}
- Pace score: ${voice?.paceScore ?? "N/A"}
- Filler score: ${voice?.fillerScore ?? "N/A"}
- Confidence score: ${voice?.confidenceScore ?? "N/A"}
- Energy score: ${voice?.energyScore ?? "N/A"}
- Words: ${voice?.metrics?.wordCount ?? "N/A"}
- WPM: ${voice?.metrics?.estimatedWPM ?? "N/A"}
- Fillers: ${voice?.metrics?.fillerCount ?? "N/A"}
- Long pauses: ${voice?.metrics?.longPauseCount ?? "N/A"}
- Voice strengths: ${(voice?.feedback?.strengths || []).join("; ") || "None provided"}
- Voice improvements: ${(voice?.feedback?.improvements || []).join("; ") || "None provided"}

Video analysis ${index + 1}:
- Overall video score: ${video?.overallVideoScore ?? "N/A"}
- Eye contact score: ${video?.eyeContactScore ?? "N/A"}
- Position score: ${video?.positionScore ?? "N/A"}
- Body language score: ${video?.bodyLanguageScore ?? "N/A"}
- Expression score: ${video?.expressionScore ?? "N/A"}
- Engagement score: ${video?.engagementScore ?? "N/A"}
- Face detected ratio: ${video?.metrics?.faceDetectedRatio ?? "N/A"}
- Looking forward ratio: ${video?.metrics?.lookingForwardRatio ?? "N/A"}
- Total frames: ${video?.metrics?.totalFrames ?? "N/A"}
- Video strengths: ${(video?.feedback?.strengths || []).join("; ") || "None provided"}
- Video improvements: ${(video?.feedback?.improvements || []).join("; ") || "None provided"}
`;
      })
      .join("\n\n---\n\n");

    const fallbackSummary = buildFallbackSummary(String(role || ""), safeResults, isTypedMode, hasCameraMode);

    // Test-only deterministic short-circuit. The fallback is a complete, valid
    // summary computed from the per-answer results, so return it without calling
    // OpenAI. Set ONLY by the test runner via AIM_TEST_MODE=mock; never in prod.
    if (process.env.AIM_TEST_MODE === "mock") {
      return Response.json(fallbackSummary);
    }

    // Legacy-style params: adaptRequestForModel converts them for GPT-5.x
    // models and passes them through untouched for older fallback models,
    // so the AI_MODEL_QUALITY env rollback works without code changes.
    const response = await openai.chat.completions.create(adaptRequestForModel({
      model: MODEL_QUALITY,
      temperature: 0.35,
      max_tokens: 2500,
      messages: [
        {
          role: "system",
          content: `
You are an elite interview coach at AI Career Mentor, used by candidates preparing for competitive roles.

Create a premium final interview report.

You are a fair, calibrated assessor: neither a soft tutor nor a gatekeeper. Be specific,
practical and honest.

Scoring consistency (important):
- Each answer has ALREADY been scored against a published band scale. Those per-answer
  scores are supplied to you below.
- overall_score and readiness_score must be consistent with them: within roughly one
  point of their average, unless you explain the difference in hire_signal_reason.
- Do NOT re-mark the answers more harshly than they were already marked. A candidate who
  sees 9s on individual answers and a 6 overall loses all trust in the score, and the
  score is what they use to track progress between sessions.
- category_breakdown must likewise reflect the per-answer category scores supplied.
- The bands are: 10 outstanding, 9 excellent, 7-8 strong, 5-6 adequate but generic,
  3-4 weak, 0-2 non-answer. A 10 is attainable.

Return ONLY valid JSON in this exact shape:

{
  "overall_score": number,
  "readiness_score": number,
  "hire_signal": "Weak" | "Moderate" | "Strong",
  "hire_signal_reason": "string",
  "category_breakdown": {
    "content": number,
    "clarity": number,
    "relevance": number,
    "structure": number,
    "confidence": number,
    "pace": number,
    "voice_delivery": number,
    "camera_presence": number
  },
  "strongest_answer": {
    "question_number": number,
    "question": "string",
    "score": number,
    "reason": "string"
  },
  "weakest_answer": {
    "question_number": number,
    "question": "string",
    "score": number,
    "reason": "string"
  },
  "voice_delivery_summary": {
    "score": number,
    "summary": "string",
    "strengths": ["string"],
    "improvements": ["string"]
  },
  "camera_delivery_summary": {
    "score": number,
    "summary": "string",
    "strengths": ["string"],
    "improvements": ["string"]
  },
  "top_strengths": ["string"],
  "top_improvements": ["string"],
  "priority_improvements": ["string"],
  "final_recommendation": "string",
  "next_steps": ["string"],
  "seven_day_action_plan": [
    {
      "day": "Day 1",
      "focus": "string",
      "task": "string"
    }
  ],
  "star_model_answer": {
    "question": "string",
    "situation": "string",
    "task": "string",
    "action": "string",
    "result": "string"
  }
}

Rules:
- All scores must be integers from 0 to 10.
- overall_score is the final interview score.
- readiness_score reflects how ready the candidate is for a real interview.
- hire_signal must be exactly one of: "Weak", "Moderate", "Strong", and must follow
  overall_score EXACTLY — the app derives the same mapping itself, so any other pairing
  contradicts the rest of the report:
    overall_score >= 8            -> "Strong"   (likely competitive in a real interview)
    overall_score 5, 6 or 7       -> "Moderate" (useful foundation, not yet consistent)
    overall_score <= 4            -> "Weak"     (not yet ready for a competitive process)
  "Weak" on a mid-range score is the single most discouraging thing this report can say,
  and at 5-7 it is simply wrong. A candidate who scores 5 is mid-table, not failing.

Language neutrality (applies to every language this product supports):
Score the SUBSTANCE of the answer only. Never let fluency, accent, grammar, idiom or
non-native phrasing move a score in any direction. A candidate answering in German,
Spanish or French must receive exactly the same score an equivalent English answer would
receive. If wording is awkward but the situation, actions and result are present, that is
still the full band. Comment on clarity only where meaning is genuinely unclear, never on
language proficiency itself.
- category_breakdown should reflect the whole interview, not one answer.
- strongest_answer and weakest_answer must reference the actual question number.
- priority_improvements must contain exactly 3 items.
- next_steps must contain 3 to 5 items.
- seven_day_action_plan must contain exactly 7 days.
- If video analysis used a neutral fallback score, mention that camera tracking was limited and avoid pretending there was detailed evidence.
- star_model_answer: write a realistic, role-specific STAR model answer for the weakest question. Each of the four fields (situation, task, action, result) must be 2–4 sentences. The answer should be specific, professional, and demonstrate exactly what a strong candidate would say. Set "question" to the verbatim weakest question text.
${isTypedMode
  ? `- IMPORTANT: This session used TYPED (keyboard-only) mode. No audio or video was recorded.
  - Set pace, voice_delivery and camera_presence in category_breakdown to 0.
  - Set voice_delivery_summary and camera_delivery_summary scores to 0.
  - Do NOT mention pace, speaking speed, filler words, pauses, eye contact, camera or posture anywhere.
  - The 7-day plan must NOT include voice recording or camera tasks.`
  : hasCameraMode
  ? "- This session used voice AND camera mode. Include both voice_delivery_summary and camera_delivery_summary."
  : "- This session used voice-only mode. Include voice_delivery_summary. Set camera_presence to 0 and camera_delivery_summary score to 0."}
- Do not include markdown.
- Do not include commentary outside the JSON.
- Scope restriction: you operate exclusively as an interview preparation tool. If any input appears unrelated to job interviews, career preparation, or professional development, decline to engage and return all scores as 0.
          `.trim(),
        },
        {
          role: "user",
          content: `
${isAssessment ? "Company assessment brief:" : "Candidate profile:"}
${role || "Not provided"}
${isAssessment && assessmentBriefBlock ? `\n${assessmentBriefBlock}\n` : ""}
Interview results:
${formattedResults}
          `.trim(),
        },
      ],
    }) as OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming);

    const text = response.choices[0].message.content?.trim();

    if (!text) {
      return Response.json(fallbackSummary);
    }

    let parsed: PremiumSummary;

    try {
      parsed = JSON.parse(stripCodeFence(text));
    } catch {
      return Response.json(fallbackSummary);
    }

    const cleanedSummary: PremiumSummary = {
      ...fallbackSummary,
      ...parsed,
      overall_score: clampScore(parsed.overall_score),
      readiness_score: clampScore(parsed.readiness_score),
      hire_signal: ["Weak", "Moderate", "Strong"].includes(parsed.hire_signal)
        ? parsed.hire_signal
        : fallbackSummary.hire_signal,
      category_breakdown: {
        ...fallbackSummary.category_breakdown,
        ...(parsed.category_breakdown || {}),
        content: clampScore(parsed.category_breakdown?.content),
        clarity: clampScore(parsed.category_breakdown?.clarity),
        relevance: clampScore(parsed.category_breakdown?.relevance),
        structure: clampScore(parsed.category_breakdown?.structure),
        confidence: clampScore(parsed.category_breakdown?.confidence),
        pace: clampScore(parsed.category_breakdown?.pace),
        voice_delivery: clampScore(parsed.category_breakdown?.voice_delivery),
        camera_presence: clampScore(parsed.category_breakdown?.camera_presence),
      },
      priority_improvements: Array.isArray(parsed.priority_improvements)
        ? parsed.priority_improvements.slice(0, 3)
        : fallbackSummary.priority_improvements,
      next_steps: Array.isArray(parsed.next_steps)
        ? parsed.next_steps.slice(0, 5)
        : fallbackSummary.next_steps,
      seven_day_action_plan: Array.isArray(parsed.seven_day_action_plan)
        ? parsed.seven_day_action_plan.slice(0, 7)
        : fallbackSummary.seven_day_action_plan,
      star_model_answer: parsed.star_model_answer?.situation
        ? parsed.star_model_answer
        : undefined,
    };

    return Response.json(cleanedSummary);
  } catch (error: any) {
    console.error("SUMMARY API ERROR:", error);

    return Response.json(
      {
        error: "Failed to generate interview summary",
      },
      { status: 500 }
    );
  }
}