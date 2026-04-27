import { NextRequest, NextResponse } from "next/server";

type VoiceAnalysisLike = {
  paceScore?: number;
  metrics?: {
    estimatedWPM?: number;
    fillerCount?: number;
    longPauseCount?: number;
    wordCount?: number;
  };
};

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

  // Without actual recording duration, estimate from a normal interview answer pace.
  // This prevents the product from showing "no pace data" when an answer exists.
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
    const { question, answer, voiceAnalysis, videoAnalysis } =
      await req.json();

    if (!question || !answer) {
      return NextResponse.json(
        { error: "Missing question or answer." },
        { status: 400 }
      );
    }

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
- Include measurable impact where possible
- Sound natural, not robotic
- Be suitable for the candidate's role/context

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
`;

    const userPrompt = `
Interview question:
${question}

Candidate answer:
${answer}

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
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || "OpenAI request failed." },
        { status: 500 }
      );
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
      parsed = JSON.parse(text);
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
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while generating feedback." },
      { status: 500 }
    );
  }
}