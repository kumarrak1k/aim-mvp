import { NextRequest, NextResponse } from "next/server";

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
- Pace: use the provided voice analysis pace score if available

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

Voice analysis:
${JSON.stringify(voiceAnalysis || null, null, 2)}

Video analysis:
${JSON.stringify(videoAnalysis || null, null, 2)}

Evaluate this answer strictly against a real hiring bar.

Important:
- If voiceAnalysis.paceScore is provided, use that exact number for pace_score.
- If voiceAnalysis includes fillerCount or fillersDetected, mention filler-word issues clearly when relevant.
- Do not score pace as 0 unless there is no transcript or no usable voice data.
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.25,
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

    const paceScore =
      typeof voiceAnalysis?.paceScore === "number"
        ? voiceAnalysis.paceScore
        : typeof parsed?.pace_score === "number" && parsed.pace_score > 0
        ? parsed.pace_score
        : 5;

    parsed.pace_score = paceScore;

    if (parsed.section_feedback?.pace) {
      parsed.section_feedback.pace.score = paceScore;

      if (!parsed.section_feedback.pace.feedback) {
        parsed.section_feedback.pace.feedback =
          "Pace was assessed using the available voice-analysis data.";
      }

      if (!parsed.section_feedback.pace.improvement) {
        parsed.section_feedback.pace.improvement =
          "Aim for a steady interview pace of roughly 120–170 words per minute.";
      }
    }

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "Something went wrong while generating feedback." },
      { status: 500 }
    );
  }
}