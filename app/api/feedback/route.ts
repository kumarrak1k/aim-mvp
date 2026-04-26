import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type VoiceAnalysis = {
  paceScore?: number;
  confidenceScore?: number;
  energyScore?: number;
  overallVoiceScore?: number;
  metrics?: {
    estimatedWPM?: number;
    fillerCount?: number;
    longPauseCount?: number;
    averageVolume?: number;
    lowVolumeRatio?: number;
    silenceRatio?: number;
  };
  feedback?: {
    strengths?: string[];
    improvements?: string[];
  };
};

type FeedbackResponse = {
  overall_score: number;
  category_scores: {
    content: number;
    clarity: number;
    relevance: number;
    structure: number;
    confidence: number;
  };
  pace_score: number;
  section_feedback: {
    content: {
      score: number;
      feedback: string;
      improvement: string;
    };
    clarity: {
      score: number;
      feedback: string;
      improvement: string;
    };
    relevance: {
      score: number;
      feedback: string;
      improvement: string;
    };
    structure: {
      score: number;
      feedback: string;
      improvement: string;
    };
    confidence: {
      score: number;
      feedback: string;
      improvement: string;
    };
    pace: {
      score: number;
      feedback: string;
      improvement: string;
    };
  };
  strengths: string[];
  improvements: string[];
  improved_answer: string;
};

function clampScore(value: number) {
  return Math.max(0, Math.min(10, Math.round(value * 10) / 10));
}

function fallbackFeedback(question: string, answer: string): FeedbackResponse {
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const baseScore = wordCount < 30 ? 4 : wordCount < 70 ? 5.5 : 6.5;

  return {
    overall_score: clampScore(baseScore),
    category_scores: {
      content: clampScore(baseScore),
      clarity: clampScore(baseScore),
      relevance: clampScore(baseScore),
      structure: clampScore(baseScore - 0.5),
      confidence: clampScore(baseScore - 0.5),
    },
    pace_score: 5,
    section_feedback: {
      content: {
        score: clampScore(baseScore),
        feedback: "The answer gives a basic response, but it does not yet provide enough depth or evidence.",
        improvement: "Add a specific example, your exact action, and a clear result.",
      },
      clarity: {
        score: clampScore(baseScore),
        feedback: "The answer is understandable, but could be sharper and easier to follow.",
        improvement: "Use shorter sentences and make one clear point at a time.",
      },
      relevance: {
        score: clampScore(baseScore),
        feedback: "The answer is partly relevant to the question, but could connect more directly to what was asked.",
        improvement: "Start by directly answering the question before adding background detail.",
      },
      structure: {
        score: clampScore(baseScore - 0.5),
        feedback: "The answer would benefit from a clearer beginning, middle, and result.",
        improvement: "Use the STAR format: Situation, Task, Action, Result.",
      },
      confidence: {
        score: clampScore(baseScore - 0.5),
        feedback: "The answer does not yet sound fully assured or interview-ready.",
        improvement: "Use direct language such as 'I did', 'I achieved', and 'the result was'.",
      },
      pace: {
        score: 5,
        feedback: "Pace could not be fully assessed from the available data.",
        improvement: "Aim for a natural pace of roughly 110–160 words per minute.",
      },
    },
    strengths: ["You made an attempt to answer the question."],
    improvements: [
      "Add a specific example.",
      "Explain your actions more clearly.",
      "Include a measurable or observable result.",
    ],
    improved_answer: `A stronger answer would directly address the question: "${question}". I would structure it by briefly explaining the situation, what I was responsible for, the action I took, and the result. For example, I would describe a specific challenge, explain the steps I personally took, show how I communicated or solved the problem, and finish with the outcome and what I learned. This would make the answer more credible, focused, and interview-ready.`,
  };
}

export async function POST(req: Request) {
  try {
    const {
      question,
      answer,
      voiceAnalysis,
    } = (await req.json()) as {
      question?: string;
      answer?: string;
      voiceAnalysis?: VoiceAnalysis | null;
    };

    if (!question?.trim() || !answer?.trim()) {
      return NextResponse.json(
        { error: "Question and answer are required." },
        { status: 400 }
      );
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Missing OPENAI_API_KEY." },
        { status: 500 }
      );
    }

    const voiceContext = voiceAnalysis
      ? `
Voice analysis data:
- Pace score: ${voiceAnalysis.paceScore ?? "unknown"}/10
- Confidence score: ${voiceAnalysis.confidenceScore ?? "unknown"}/10
- Energy score: ${voiceAnalysis.energyScore ?? "unknown"}/10
- Overall voice score: ${voiceAnalysis.overallVoiceScore ?? "unknown"}/10
- Estimated WPM: ${voiceAnalysis.metrics?.estimatedWPM ?? "unknown"}
- Filler count: ${voiceAnalysis.metrics?.fillerCount ?? "unknown"}
- Long pauses: ${voiceAnalysis.metrics?.longPauseCount ?? "unknown"}
- Average volume: ${voiceAnalysis.metrics?.averageVolume ?? "unknown"}
- Low volume ratio: ${voiceAnalysis.metrics?.lowVolumeRatio ?? "unknown"}
- Silence ratio: ${voiceAnalysis.metrics?.silenceRatio ?? "unknown"}
`
      : "No voice analysis data was provided. Pace should be assessed cautiously from answer length only.";

    const prompt = `
You are a strict but constructive interview coach for AI Career Mentor.

Evaluate the candidate's answer to the interview question.

Question:
${question}

Candidate answer:
${answer}

${voiceContext}

Scoring rules:
- Be realistic and not overly generous.
- A vague answer without a specific example should rarely score above 6.
- An answer without a clear result or outcome should rarely score above 7.
- A short answer under 40 words should rarely score above 5.
- A strong answer worthy of 8+ must include: direct relevance, clear structure, specific actions, evidence/detail, and a strong outcome or learning.
- Confidence should consider both wording and voice data if provided.
- Pace should use voice WPM if provided:
  - under 90 WPM = too slow
  - 90–110 = slightly slow
  - 110–160 = good
  - 160–185 = slightly fast
  - over 185 = too fast

Return ONLY valid JSON matching this exact structure:
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

Improved answer requirements:
- Write it as a polished candidate answer.
- It should be strong enough to score 8 or above.
- Use a realistic first-person style.
- Use STAR structure naturally.
- Include specific actions, communication, measurable or observable result, and learning.
- Do not make it robotic.
- Keep it around 140–220 words.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a strict interview assessor. Return only valid JSON. Do not include markdown.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;

    if (!raw) {
      return NextResponse.json(fallbackFeedback(question, answer));
    }

    const parsed = JSON.parse(raw) as FeedbackResponse;

    const cleaned: FeedbackResponse = {
      overall_score: clampScore(parsed.overall_score),
      category_scores: {
        content: clampScore(parsed.category_scores.content),
        clarity: clampScore(parsed.category_scores.clarity),
        relevance: clampScore(parsed.category_scores.relevance),
        structure: clampScore(parsed.category_scores.structure),
        confidence: clampScore(parsed.category_scores.confidence),
      },
      pace_score: clampScore(parsed.pace_score),
      section_feedback: {
        content: {
          score: clampScore(parsed.section_feedback.content.score),
          feedback: parsed.section_feedback.content.feedback,
          improvement: parsed.section_feedback.content.improvement,
        },
        clarity: {
          score: clampScore(parsed.section_feedback.clarity.score),
          feedback: parsed.section_feedback.clarity.feedback,
          improvement: parsed.section_feedback.clarity.improvement,
        },
        relevance: {
          score: clampScore(parsed.section_feedback.relevance.score),
          feedback: parsed.section_feedback.relevance.feedback,
          improvement: parsed.section_feedback.relevance.improvement,
        },
        structure: {
          score: clampScore(parsed.section_feedback.structure.score),
          feedback: parsed.section_feedback.structure.feedback,
          improvement: parsed.section_feedback.structure.improvement,
        },
        confidence: {
          score: clampScore(parsed.section_feedback.confidence.score),
          feedback: parsed.section_feedback.confidence.feedback,
          improvement: parsed.section_feedback.confidence.improvement,
        },
        pace: {
          score: clampScore(parsed.section_feedback.pace.score),
          feedback: parsed.section_feedback.pace.feedback,
          improvement: parsed.section_feedback.pace.improvement,
        },
      },
      strengths: parsed.strengths || [],
      improvements: parsed.improvements || [],
      improved_answer: parsed.improved_answer || "",
    };

    return NextResponse.json(cleaned);
  } catch (error) {
    console.error("Feedback route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while generating feedback.",
      },
      { status: 500 }
    );
  }
}