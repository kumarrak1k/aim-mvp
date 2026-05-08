import OpenAI from "openai";

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
  voice_delivery_summary: {
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
  };
  camera_delivery_summary: {
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
  results: FeedbackResult[]
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
    pace: clampScore(
      average(
        results.map(
          (item) =>
            item.feedback?.pace_score ?? item.voiceAnalysis?.paceScore ?? 0
        )
      )
    ),
    voice_delivery: clampScore(
      average(results.map((item) => item.voiceAnalysis?.overallVoiceScore ?? 0))
    ),
    camera_presence: clampScore(
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
    voice_delivery_summary: {
      score: categoryBreakdown.voice_delivery || 5,
      summary:
        "Voice delivery was assessed using the available pace, filler word, confidence and energy data.",
      strengths: voiceStrengths.slice(0, 3),
      improvements: voiceImprovements.slice(0, 3),
    },
    camera_delivery_summary: {
      score: categoryBreakdown.camera_presence || 5,
      summary:
        "Camera delivery was assessed using the available eye contact, position, posture and engagement data.",
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
    next_steps: [
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
      {
        day: "Day 4",
        focus: "Voice delivery",
        task: "Record answers and reduce filler words such as um, er, like and you know.",
      },
      {
        day: "Day 5",
        focus: "Camera presence",
        task: "Practise looking forward, staying centred and keeping posture steady.",
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
    const { role, results, assessmentMode, templateContext } = await req.json();
    const isAssessment = Boolean(assessmentMode);
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

    const fallbackSummary = buildFallbackSummary(String(role || ""), safeResults);

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.35,
      messages: [
        {
          role: "system",
          content: `
You are AIM, an elite interview coach used by candidates preparing for competitive roles.

Create a premium final interview report.

You must judge the full interview like a strict hiring manager. Be specific, practical and honest.

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
  ]
}

Rules:
- All scores must be integers from 0 to 10.
- overall_score is the final interview score.
- readiness_score reflects how ready the candidate is for a real interview.
- hire_signal must be exactly one of: "Weak", "Moderate", "Strong".
- Strong means likely competitive in a real interview.
- Moderate means useful foundation but not consistently strong.
- Weak means not yet ready for a competitive interview.
- category_breakdown should reflect the whole interview, not one answer.
- strongest_answer and weakest_answer must reference the actual question number.
- priority_improvements must contain exactly 3 items.
- next_steps must contain 3 to 5 items.
- seven_day_action_plan must contain exactly 7 days.
- If video analysis used a neutral fallback score, mention that camera tracking was limited and avoid pretending there was detailed evidence.
- Do not include markdown.
- Do not include commentary outside the JSON.
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
    });

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