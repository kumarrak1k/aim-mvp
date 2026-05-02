import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { role, questionNumber, totalQuestions, history } = await req.json();

    if (!role || typeof role !== "string") {
      return NextResponse.json(
        { error: "Missing role or candidate profile." },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is missing from environment variables." },
        { status: 500 }
      );
    }

    const safeQuestionNumber =
      typeof questionNumber === "number" && questionNumber > 0
        ? questionNumber
        : 1;

    const safeTotalQuestions =
      typeof totalQuestions === "number" && totalQuestions > 0
        ? totalQuestions
        : 5;

    const previousQuestions = Array.isArray(history)
      ? history
          .map((item, index) => {
            return `Question ${index + 1}: ${item?.question || ""}
Answer ${index + 1}: ${item?.answer || ""}`;
          })
          .join("\n\n")
      : "";

    const systemPrompt = `
You are an expert interview question generator for AI Career Mentor.

Your job is to create realistic, high-quality interview questions for candidates preparing for professional interviews.

Rules:
- Generate ONE interview question only.
- The question must match the candidate profile, interview type, difficulty and focus area.
- Avoid repeating previous questions.
- Make the question clear, realistic and useful for interview practice.
- Do not include scoring, explanation, tips or model answers.
- Return ONLY valid JSON in this exact shape:

{
  "question": "string"
}
`.trim();

    const userPrompt = `
Candidate profile and setup:
${role}

Current question:
${safeQuestionNumber} of ${safeTotalQuestions}

Previous interview history:
${previousQuestions || "No previous questions yet."}

Generate the next best interview question.
`.trim();

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          error:
            data?.error?.message ||
            "OpenAI request failed while generating the question.",
        },
        { status: 500 }
      );
    }

    const text = data.choices?.[0]?.message?.content;

    if (!text) {
      return NextResponse.json(
        { error: "No question was returned by the AI." },
        { status: 500 }
      );
    }

    let parsed: { question?: string };

    try {
      const cleanedText = text
        .replace(/^```json/i, "")
        .replace(/^```/i, "")
        .replace(/```$/i, "")
        .trim();

      parsed = JSON.parse(cleanedText);
    } catch {
      parsed = {
        question: text.trim(),
      };
    }

    if (!parsed.question || typeof parsed.question !== "string") {
      return NextResponse.json(
        { error: "AI response did not include a valid question." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      question: parsed.question.trim(),
    });
  } catch (error) {
    console.error("INTERVIEW QUESTION API ERROR:", error);

    return NextResponse.json(
      { error: "Something went wrong while generating the question." },
      { status: 500 }
    );
  }
}